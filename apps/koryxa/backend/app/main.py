from __future__ import annotations

import json
import time
import threading
import re
import hmac
import csv
import io
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Literal
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from urllib.parse import urlparse
from urllib import error as urlerror
from urllib import request as urlrequest
import cohere
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.config import settings
from app.db.mongo import close_mongo_connection, connect_to_mongo
from app.routers.auth import router as auth_router
from app.routers.ebooks import router as ebooks_router
from app.routers.posts import router as posts_router
from app.routers.messages import router as messages_router
from app.routers.groups import router as groups_router
from app.routers.contact import router as contact_router
from app.routers.chatlaya import router as chatlaya_router
from app.routers.diagnostics import router as diag_router
from app.routers.innova import router as innova_router
from app.routers.pieagency import router as pieagency_router
from app.routers.farmlink import router as farmlink_router
from app.routers.sante import router as sante_router
from app.routers.rag import router as rag_router
from app.routers.me import router as me_router
from app.routers.notifications import router as notifications_router
from app.routers.metrics import router as metrics_router
from app.routers.emailer import router as email_router
from app.routers.invite import router as invite_router
from app.routers.opportunities import router as opportunities_router
from app.routers.engine import router as engine_router
from app.routers import school as school_router
from app.routers.marketplace import router as market_router
from app.routers.meet_api import router as meet_router
from app.routers.profiles import router as profiles_router
from app.routers.profiles_v1 import router as profiles_v1_router
from app.routers.missions import router as missions_router
from app.routers.studio import router as studio_router
from app.routers.myplanning import router as myplanning_router
from app.routers import studio_missions as studio_missions_router
from app.routers.skills import router as skills_router
from app.routers.module6 import router as module6_router
from app.routers.youtube import router as youtube_router
from app.core.ai import detect_embed_dim
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db
import os
import logging
from app.core.product_mode import is_myplanning_only


API_PROXY_PREFIX = "/innova/api"
FORWARDED_PREFIX_HEADER = "x-forwarded-prefix"

app = FastAPI(title=settings.APP_NAME, root_path=API_PROXY_PREFIX)
logger = logging.getLogger(__name__)
MYPLANNING_ONLY = is_myplanning_only()
POOL: SimpleConnectionPool | None = None
CO: Any = None
LEAD_RATE_LIMIT_WINDOW_S = int(os.environ.get("ENTERPRISE_LEADS_RATE_WINDOW_S", "60"))
LEAD_RATE_LIMIT_MAX = int(os.environ.get("ENTERPRISE_LEADS_RATE_MAX", "5"))
_LEAD_RATE_BUCKETS: dict[str, list[float]] = {}
_LEAD_RATE_LOCK = threading.Lock()


def _normalize_prefix(value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    clean = f"/{raw.strip('/')}"
    return clean


class EnterpriseLeadIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    company: str = Field(..., min_length=2, max_length=160)
    role: str = Field(..., min_length=2, max_length=120)
    team_size: str = Field(..., min_length=1, max_length=64)
    need: str = Field(..., min_length=2, max_length=180)
    message: str = Field(..., min_length=0, max_length=4000)
    source_page: str = Field(default="/myplanning/enterprise", max_length=255)
    source_ts: datetime | None = None
    website: str | None = Field(default=None, max_length=255)  # honeypot

    @field_validator("source_page")
    @classmethod
    def validate_source_page(cls, value: str) -> str:
        value = (value or "").strip()
        if not value.startswith("/"):
            return "/myplanning/enterprise"
        return value


class EnterpriseLeadUpdateIn(BaseModel):
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None
    assigned_to: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=4000)
    contacted_at: datetime | None = None


def _json_safe(row: dict[str, Any]) -> dict[str, Any]:
    # Decimal is not JSON-serializable by default.
    for k, v in list(row.items()):
        if isinstance(v, Decimal):
            row[k] = float(v)
    return row


def _dsn_with_supabase_defaults(dsn: str) -> str:
    # Supabase requires SSL; add it when omitted.
    if "sslmode=" not in dsn:
        sep = "&" if "?" in dsn else "?"
        dsn = f"{dsn}{sep}sslmode=require"
    # Keep connection attempts bounded in case of network issues.
    if "connect_timeout=" not in dsn:
        sep = "&" if "?" in dsn else "?"
        dsn = f"{dsn}{sep}connect_timeout={int(os.environ.get('PG_CONNECT_TIMEOUT_S', '10'))}"
    return dsn


def init_pg_pool() -> None:
    global POOL
    dsn = (os.environ.get("DATABASE_URL") or "").strip()
    if not dsn:
        logger.warning("DATABASE_URL is not set; /mart/app-overview is disabled")
        return
    dsn = _dsn_with_supabase_defaults(dsn)

    POOL = SimpleConnectionPool(
        minconn=int(os.environ.get("PGPOOL_MIN", "1")),
        maxconn=int(os.environ.get("PGPOOL_MAX", "5")),
        dsn=dsn,
    )


def close_pg_pool() -> None:
    global POOL
    if POOL:
        POOL.closeall()
        POOL = None


def db_fetchone(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    global POOL
    if not POOL:
        raise RuntimeError("DB pool not initialized")

    conn = POOL.getconn()
    try:
        conn.autocommit = True
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "set statement_timeout = %s;",
                (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),),
            )
            cur.execute(sql, params)
            row = cur.fetchone()
            return dict(row) if row is not None else None
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        POOL.putconn(conn)


def db_fetchall(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    global POOL
    if not POOL:
        raise RuntimeError("DB pool not initialized")

    conn = POOL.getconn()
    try:
        conn.autocommit = True
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "set statement_timeout = %s;",
                (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),),
            )
            cur.execute(sql, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        POOL.putconn(conn)


def db_execute(sql: str, params: tuple[Any, ...] = ()) -> None:
    global POOL
    if not POOL:
        raise RuntimeError("DB pool not initialized")

    conn = POOL.getconn()
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                "set statement_timeout = %s;",
                (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),),
            )
            cur.execute(sql, params)
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        POOL.putconn(conn)


def ensure_enterprise_leads_table() -> None:
    # Lightweight bootstrap to keep setup simple on Hetzner.
    if not POOL:
        return
    db_execute(
        """
        create table if not exists public.enterprise_leads (
          id bigserial primary key,
          name text not null,
          email text not null,
          company text not null,
          role text not null,
          team_size text not null,
          need text not null,
          message text not null,
          source_page text not null default '/myplanning/enterprise',
          source_ts timestamptz,
          created_at timestamptz not null default now(),
          client_ip text,
          user_agent text,
          metadata jsonb not null default '{}'::jsonb
        );
        """
    )
    db_execute(
        "create index if not exists idx_enterprise_leads_created_at on public.enterprise_leads (created_at desc);"
    )
    db_execute(
        "create index if not exists idx_enterprise_leads_email_lower on public.enterprise_leads ((lower(email)));"
    )
    db_execute(
        "alter table public.enterprise_leads add column if not exists status text not null default 'new';"
    )
    db_execute(
        "alter table public.enterprise_leads add column if not exists assigned_to text;"
    )
    db_execute(
        "alter table public.enterprise_leads add column if not exists notes text;"
    )
    db_execute(
        "alter table public.enterprise_leads add column if not exists contacted_at timestamptz;"
    )
    db_execute(
        "alter table public.enterprise_leads add column if not exists updated_at timestamptz not null default now();"
    )
    db_execute(
        "create index if not exists idx_enterprise_leads_status_created_at on public.enterprise_leads (status, created_at desc);"
    )


def ensure_myplanning_team_tables() -> None:
    # Bootstrap Team collaboration tables/policies in Postgres app schema.
    # Keep SQL idempotent so startup is safe across environments.
    if not POOL:
        return

    db_execute("create extension if not exists pgcrypto;")
    db_execute("grant usage on schema app to authenticated;")
    db_execute(
        """
        create table if not exists app.workspaces (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          owner_id uuid not null references auth.users(id) on delete cascade,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          created_by uuid
        );
        """
    )
    db_execute("alter table app.workspaces add column if not exists id uuid default gen_random_uuid();")
    db_execute("alter table app.workspaces add column if not exists name text;")
    db_execute("alter table app.workspaces add column if not exists owner_id uuid;")
    db_execute("alter table app.workspaces add column if not exists created_at timestamptz not null default now();")
    db_execute("alter table app.workspaces add column if not exists updated_at timestamptz not null default now();")
    db_execute("alter table app.workspaces add column if not exists created_by uuid;")
    db_execute("update app.workspaces set created_by = owner_id where created_by is null;")
    db_execute("create index if not exists workspaces_owner_id_idx on app.workspaces(owner_id);")
    db_execute("create index if not exists workspaces_created_by_idx on app.workspaces(created_by);")
    db_execute(
        """
        create or replace function app.set_workspaces_updated_at()
        returns trigger as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$ language plpgsql;
        """
    )
    db_execute("drop trigger if exists workspaces_set_updated_at on app.workspaces;")
    db_execute(
        """
        create trigger workspaces_set_updated_at
        before update on app.workspaces
        for each row
        execute function app.set_workspaces_updated_at();
        """
    )

    db_execute(
        """
        create table if not exists app.workspace_members (
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          user_id uuid not null references auth.users(id) on delete cascade,
          role text not null default 'member',
          created_at timestamptz not null default now(),
          status text not null default 'active',
          id uuid not null default gen_random_uuid(),
          primary key (workspace_id, user_id)
        );
        """
    )
    db_execute("alter table app.workspace_members add column if not exists workspace_id uuid;")
    db_execute("alter table app.workspace_members add column if not exists user_id uuid;")
    db_execute("alter table app.workspace_members add column if not exists role text not null default 'member';")
    db_execute("alter table app.workspace_members add column if not exists created_at timestamptz not null default now();")
    db_execute("alter table app.workspace_members add column if not exists status text not null default 'active';")
    db_execute("alter table app.workspace_members add column if not exists id uuid default gen_random_uuid();")
    db_execute("update app.workspace_members set id = gen_random_uuid() where id is null;")
    db_execute(
        "create unique index if not exists workspace_members_workspace_user_uidx on app.workspace_members(workspace_id, user_id);"
    )
    db_execute("create unique index if not exists workspace_members_id_key on app.workspace_members(id);")
    db_execute("create index if not exists workspace_members_user_id_idx on app.workspace_members(user_id);")
    db_execute("create index if not exists workspace_members_workspace_status_idx on app.workspace_members(workspace_id, status);")

    db_execute(
        """
        do $$
        begin
          if not exists (
            select 1
            from pg_constraint
            where conname = 'workspace_members_role_check'
          ) then
            alter table app.workspace_members
              add constraint workspace_members_role_check
              check (role in ('owner','admin','member'));
          end if;
        end $$;
        """
    )
    db_execute(
        """
        do $$
        begin
          if not exists (
            select 1
            from pg_constraint
            where conname = 'workspace_members_status_check'
          ) then
            alter table app.workspace_members
              add constraint workspace_members_status_check
              check (status in ('active','pending'));
          end if;
        end $$;
        """
    )

    db_execute(
        """
        create or replace function app.workspace_exists(ws_id uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = app, public
        set row_security = off
        as $$
          select exists (
            select 1
            from app.workspaces w
            where w.id = ws_id
          );
        $$;
        """
    )
    db_execute(
        """
        create or replace function app.is_workspace_member(ws_id uuid, uid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = app, public
        set row_security = off
        as $$
          select exists (
            select 1
            from app.workspaces w
            where w.id = ws_id
              and (
                w.owner_id = uid
                or exists (
                  select 1
                  from app.workspace_members wm
                  where wm.workspace_id = ws_id
                    and wm.user_id = uid
                    and coalesce(wm.status, 'active') = 'active'
                )
              )
          );
        $$;
        """
    )
    db_execute(
        """
        create or replace function app.is_workspace_admin(ws_id uuid, uid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = app, public
        set row_security = off
        as $$
          select exists (
            select 1
            from app.workspaces w
            where w.id = ws_id
              and (
                w.owner_id = uid
                or exists (
                  select 1
                  from app.workspace_members wm
                  where wm.workspace_id = ws_id
                    and wm.user_id = uid
                    and coalesce(wm.status, 'active') = 'active'
                    and coalesce(wm.role, '') in ('owner', 'admin')
                )
              )
          );
        $$;
        """
    )
    db_execute("grant execute on function app.workspace_exists(uuid) to authenticated;")
    db_execute("grant execute on function app.is_workspace_member(uuid, uuid) to authenticated;")
    db_execute("grant execute on function app.is_workspace_admin(uuid, uuid) to authenticated;")

    db_execute("alter table app.workspaces add column if not exists workspace_type text not null default 'team';")
    db_execute("create index if not exists workspaces_workspace_type_idx on app.workspaces(workspace_type);")
    db_execute(
        """
        do $$
        begin
          if not exists (
            select 1
            from pg_constraint
            where conname = 'workspaces_workspace_type_check'
          ) then
            alter table app.workspaces
              add constraint workspaces_workspace_type_check
              check (workspace_type in ('team','enterprise'));
          end if;
        end $$;
        """
    )
    db_execute(
        """
        create table if not exists app.workspace_invites (
          id uuid primary key,
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          email text not null,
          role text not null check (role in ('admin','member')),
          token text not null,
          status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
          invited_by uuid not null,
          invited_at timestamptz not null default now(),
          accepted_at timestamptz
        );
        """
    )
    db_execute(
        "create unique index if not exists workspace_invites_workspace_id_email_key on app.workspace_invites (workspace_id, email);"
    )
    db_execute(
        "create index if not exists idx_workspace_invites_workspace_status on app.workspace_invites (workspace_id, status, invited_at desc);"
    )

    db_execute("grant select, insert, update, delete on app.workspaces to authenticated;")
    db_execute("grant select, insert, update, delete on app.workspace_members to authenticated;")
    db_execute("grant select, insert, update, delete on app.workspace_invites to authenticated;")

    db_execute("alter table app.workspaces enable row level security;")
    db_execute("alter table app.workspace_members enable row level security;")
    db_execute("alter table app.workspace_invites enable row level security;")

    # Reset policies to avoid recursive policy dependencies between
    # app.workspaces and app.workspace_members.
    db_execute("drop policy if exists workspaces_select_member on app.workspaces;")
    db_execute("drop policy if exists workspaces_insert_owner on app.workspaces;")
    db_execute("drop policy if exists workspaces_update_owner on app.workspaces;")
    db_execute("drop policy if exists workspaces_delete_owner on app.workspaces;")
    db_execute("drop policy if exists members_select on app.workspace_members;")
    db_execute("drop policy if exists members_insert_owner on app.workspace_members;")
    db_execute("drop policy if exists members_update_owner on app.workspace_members;")
    db_execute("drop policy if exists members_delete_owner on app.workspace_members;")
    db_execute("drop policy if exists members_select_auth on app.workspace_members;")
    db_execute("drop policy if exists members_insert_auth on app.workspace_members;")
    db_execute("drop policy if exists members_update_auth on app.workspace_members;")
    db_execute("drop policy if exists members_delete_auth on app.workspace_members;")
    db_execute("drop policy if exists invites_select_auth on app.workspace_invites;")
    db_execute("drop policy if exists invites_insert_auth on app.workspace_invites;")
    db_execute("drop policy if exists invites_update_auth on app.workspace_invites;")
    db_execute("drop policy if exists invites_delete_auth on app.workspace_invites;")

    db_execute(
        """
        create policy workspaces_select_member
          on app.workspaces
          for select
          to authenticated
          using (app.is_workspace_member(workspaces.id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy workspaces_insert_owner
          on app.workspaces
          for insert
          to authenticated
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy workspaces_update_owner
          on app.workspaces
          for update
          to authenticated
          using (app.is_workspace_admin(workspaces.id, auth.uid()))
          with check (app.is_workspace_admin(workspaces.id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy workspaces_delete_owner
          on app.workspaces
          for delete
          to authenticated
          using (owner_id = auth.uid());
        """
    )

    # Workspace member/invite permissions are constrained by route-level checks.
    # Keeping these policies simple avoids recursive policy evaluation.
    db_execute(
        """
        create policy members_select_auth
          on app.workspace_members
          for select
          to authenticated
          using (app.is_workspace_member(workspace_members.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy members_insert_auth
          on app.workspace_members
          for insert
          to authenticated
          with check (app.is_workspace_admin(workspace_members.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy members_update_auth
          on app.workspace_members
          for update
          to authenticated
          using (app.is_workspace_admin(workspace_members.workspace_id, auth.uid()))
          with check (app.is_workspace_admin(workspace_members.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy members_delete_auth
          on app.workspace_members
          for delete
          to authenticated
          using (app.is_workspace_admin(workspace_members.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy invites_select_auth
          on app.workspace_invites
          for select
          to authenticated
          using (app.is_workspace_member(workspace_invites.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy invites_insert_auth
          on app.workspace_invites
          for insert
          to authenticated
          with check (app.is_workspace_admin(workspace_invites.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy invites_update_auth
          on app.workspace_invites
          for update
          to authenticated
          using (app.is_workspace_admin(workspace_invites.workspace_id, auth.uid()))
          with check (app.is_workspace_admin(workspace_invites.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy invites_delete_auth
          on app.workspace_invites
          for delete
          to authenticated
          using (app.is_workspace_admin(workspace_invites.workspace_id, auth.uid()));
        """
    )


def ensure_myplanning_org_tables() -> None:
    # Bootstrap "Entreprise = Organisation" tables/policies in Postgres app schema.
    # Keep SQL idempotent so startup is safe across environments.
    if not POOL:
        return

    db_execute("create extension if not exists pgcrypto;")
    db_execute("grant usage on schema app to authenticated;")

    db_execute(
        """
        create table if not exists app.organizations (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          owner_id uuid not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute("alter table app.organizations add column if not exists name text;")
    db_execute("alter table app.organizations add column if not exists owner_id uuid;")
    db_execute("alter table app.organizations add column if not exists created_at timestamptz not null default now();")
    db_execute("alter table app.organizations add column if not exists updated_at timestamptz not null default now();")

    db_execute(
        """
        create table if not exists app.organization_members (
          organization_id uuid not null references app.organizations(id) on delete cascade,
          user_id uuid not null,
          role text not null check (role in ('owner','admin','member')),
          status text not null default 'active' check (status in ('active','pending')),
          joined_at timestamptz not null default now(),
          primary key (organization_id, user_id)
        );
        """
    )
    db_execute("create index if not exists org_members_user_id_idx on app.organization_members(user_id);")
    db_execute("create index if not exists org_members_org_id_status_idx on app.organization_members(organization_id, status);")

    db_execute(
        """
        create table if not exists app.organization_workspaces (
          organization_id uuid not null references app.organizations(id) on delete cascade,
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          primary key (organization_id, workspace_id)
        );
        """
    )
    db_execute("create index if not exists org_workspaces_workspace_id_idx on app.organization_workspaces(workspace_id);")

    db_execute("grant select, insert, update, delete on app.organizations to authenticated;")
    db_execute("grant select, insert, update, delete on app.organization_members to authenticated;")
    db_execute("grant select, insert, update, delete on app.organization_workspaces to authenticated;")

    db_execute("alter table app.organizations enable row level security;")
    db_execute("alter table app.organization_members enable row level security;")
    db_execute("alter table app.organization_workspaces enable row level security;")

    db_execute(
        """
        create or replace function app.set_orgs_updated_at()
        returns trigger as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$ language plpgsql;
        """
    )
    db_execute("drop trigger if exists organizations_set_updated_at on app.organizations;")
    db_execute(
        """
        create trigger organizations_set_updated_at
        before update on app.organizations
        for each row
        execute function app.set_orgs_updated_at();
        """
    )

    # Helper functions used inside policies to avoid recursive RLS dependencies.
    db_execute(
        """
        create or replace function app.is_org_member(org_id uuid, uid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = app, public
        set row_security = off
        as $$
          select exists (
            select 1
            from app.organization_members m
            where m.organization_id = org_id
              and m.user_id = uid
              and m.status in ('active','pending')
          );
        $$;
        """
    )
    db_execute(
        """
        create or replace function app.is_org_admin(org_id uuid, uid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = app, public
        set row_security = off
        as $$
          select exists (
            select 1
            from app.organization_members m
            where m.organization_id = org_id
              and m.user_id = uid
              and m.status = 'active'
              and m.role in ('owner','admin')
          );
        $$;
        """
    )
    db_execute("grant execute on function app.is_org_member(uuid, uuid) to authenticated;")
    db_execute("grant execute on function app.is_org_admin(uuid, uuid) to authenticated;")

    # Reset policies (safe idempotent).
    db_execute("drop policy if exists orgs_select_member on app.organizations;")
    db_execute("drop policy if exists orgs_insert_owner on app.organizations;")
    db_execute("drop policy if exists orgs_update_admin on app.organizations;")
    db_execute("drop policy if exists orgs_delete_owner on app.organizations;")
    db_execute("drop policy if exists org_members_select_member on app.organization_members;")
    db_execute("drop policy if exists org_members_insert_admin on app.organization_members;")
    db_execute("drop policy if exists org_members_update_admin on app.organization_members;")
    db_execute("drop policy if exists org_members_delete_admin on app.organization_members;")
    db_execute("drop policy if exists org_workspaces_select_member on app.organization_workspaces;")
    db_execute("drop policy if exists org_workspaces_insert_admin on app.organization_workspaces;")
    db_execute("drop policy if exists org_workspaces_delete_admin on app.organization_workspaces;")

    db_execute(
        """
        create policy orgs_select_member
          on app.organizations
          for select
          to authenticated
          using (
            owner_id = auth.uid()
            or app.is_org_member(organizations.id, auth.uid())
          );
        """
    )
    db_execute(
        """
        create policy orgs_insert_owner
          on app.organizations
          for insert
          to authenticated
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy orgs_update_admin
          on app.organizations
          for update
          to authenticated
          using (owner_id = auth.uid() or app.is_org_admin(organizations.id, auth.uid()))
          with check (owner_id = auth.uid() or app.is_org_admin(organizations.id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy orgs_delete_owner
          on app.organizations
          for delete
          to authenticated
          using (owner_id = auth.uid());
        """
    )

    db_execute(
        """
        create policy org_members_select_member
          on app.organization_members
          for select
          to authenticated
          using (app.is_org_member(organization_members.organization_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy org_members_insert_admin
          on app.organization_members
          for insert
          to authenticated
          with check (
            app.is_org_admin(organization_members.organization_id, auth.uid())
            or exists (
              select 1
              from app.organizations o
              where o.id = organization_members.organization_id
                and o.owner_id = auth.uid()
            )
          );
        """
    )
    db_execute(
        """
        create policy org_members_update_admin
          on app.organization_members
          for update
          to authenticated
          using (app.is_org_admin(organization_members.organization_id, auth.uid()))
          with check (app.is_org_admin(organization_members.organization_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy org_members_delete_admin
          on app.organization_members
          for delete
          to authenticated
          using (app.is_org_admin(organization_members.organization_id, auth.uid()));
        """
    )

    db_execute(
        """
        create policy org_workspaces_select_member
          on app.organization_workspaces
          for select
          to authenticated
          using (app.is_org_member(organization_workspaces.organization_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy org_workspaces_insert_admin
          on app.organization_workspaces
          for insert
          to authenticated
          with check (app.is_org_admin(organization_workspaces.organization_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy org_workspaces_delete_admin
          on app.organization_workspaces
          for delete
          to authenticated
          using (app.is_org_admin(organization_workspaces.organization_id, auth.uid()));
        """
    )


def ensure_myplanning_tasks_tables() -> None:
    # Bootstrap MyPlanning tasks table/policies in Postgres app schema.
    # Keep SQL idempotent so startup remains safe.
    if not POOL:
        return

    db_execute("create extension if not exists pgcrypto;")
    db_execute("grant usage on schema app to authenticated;")
    db_execute("alter table app.workspace_members add column if not exists status text not null default 'active';")
    db_execute(
        """
        create table if not exists app.tasks (
          id uuid primary key default gen_random_uuid(),
          owner_id uuid not null,
          workspace_id uuid null references app.workspaces(id) on delete set null,
          project_id uuid null,
          title text not null,
          description text null,
          category text null,
          context_type text not null default 'personal',
          context_id text null,
          priority_eisenhower text not null default 'important_not_urgent',
          kanban_state text not null default 'todo',
          high_impact boolean not null default false,
          estimated_duration_minutes int null,
          start_datetime timestamptz null,
          due_datetime timestamptz null,
          linked_goal text null,
          moscow text null,
          status text null,
          energy_level text null,
          pomodoro_estimated int null,
          pomodoro_done int null,
          comments text null,
          assignee_user_id uuid null,
          collaborator_ids uuid[] null,
          source text not null default 'manual',
          completed_at timestamptz null,
          priority text null,
          due_date date null,
          start_at timestamptz null,
          end_at timestamptz null,
          estimated_minutes int null,
          spent_minutes int null,
          assignee_id uuid null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute("alter table app.tasks add column if not exists owner_id uuid;")
    db_execute("alter table app.tasks add column if not exists title text;")
    db_execute("alter table app.tasks add column if not exists description text null;")
    db_execute("alter table app.tasks add column if not exists priority_eisenhower text not null default 'important_not_urgent';")
    db_execute("alter table app.tasks add column if not exists status text null;")
    db_execute("alter table app.tasks add column if not exists workspace_id uuid null references app.workspaces(id) on delete set null;")
    db_execute("alter table app.tasks add column if not exists project_id uuid null;")
    db_execute("alter table app.tasks add column if not exists category text null;")
    db_execute("alter table app.tasks add column if not exists context_type text not null default 'personal';")
    db_execute("alter table app.tasks add column if not exists context_id text null;")
    db_execute("alter table app.tasks add column if not exists kanban_state text not null default 'todo';")
    db_execute("alter table app.tasks add column if not exists high_impact boolean not null default false;")
    db_execute("alter table app.tasks add column if not exists estimated_duration_minutes int null;")
    db_execute("alter table app.tasks add column if not exists start_datetime timestamptz null;")
    db_execute("alter table app.tasks add column if not exists due_datetime timestamptz null;")
    db_execute("alter table app.tasks add column if not exists linked_goal text null;")
    db_execute("alter table app.tasks add column if not exists moscow text null;")
    db_execute("alter table app.tasks add column if not exists energy_level text null;")
    db_execute("alter table app.tasks add column if not exists pomodoro_estimated int null;")
    db_execute("alter table app.tasks add column if not exists pomodoro_done int null;")
    db_execute("alter table app.tasks add column if not exists comments text null;")
    db_execute("alter table app.tasks add column if not exists assignee_user_id uuid null;")
    db_execute("alter table app.tasks add column if not exists collaborator_ids uuid[] null;")
    db_execute("alter table app.tasks add column if not exists source text not null default 'manual';")
    db_execute("alter table app.tasks add column if not exists completed_at timestamptz null;")
    db_execute("alter table app.tasks add column if not exists priority text null;")
    db_execute("alter table app.tasks add column if not exists due_date date null;")
    db_execute("alter table app.tasks add column if not exists start_at timestamptz null;")
    db_execute("alter table app.tasks add column if not exists end_at timestamptz null;")
    db_execute("alter table app.tasks add column if not exists estimated_minutes int null;")
    db_execute("alter table app.tasks add column if not exists spent_minutes int null;")
    db_execute("alter table app.tasks add column if not exists assignee_id uuid null;")
    db_execute("alter table app.tasks add column if not exists done_at timestamptz null;")
    db_execute("alter table app.tasks add column if not exists created_at timestamptz not null default now();")
    db_execute("alter table app.tasks add column if not exists updated_at timestamptz not null default now();")
    db_execute("alter table app.tasks alter column project_id drop not null;")
    db_execute(
        """
        do $$
        begin
          if exists (
            select 1
            from information_schema.columns
            where table_schema = 'app'
              and table_name = 'tasks'
              and column_name = 'priority'
              and data_type <> 'text'
          ) then
            execute 'alter table app.tasks alter column priority type text using priority::text';
          end if;
        end $$;
        """
    )
    db_execute(
        """
        do $$
        begin
          if exists (
            select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'app'
              and c.relname = 'integration_mock_receipts_id_seq'
          ) then
            execute 'grant usage, select on sequence app.integration_mock_receipts_id_seq to authenticated';
          end if;
        end $$;
        """
    )
    db_execute("alter table app.tasks alter column priority drop not null;")
    db_execute("alter table app.tasks drop constraint if exists tasks_status_check;")
    db_execute(
        """
        alter table app.tasks
        add constraint tasks_status_check
        check (status is null or status in ('todo','doing','done'))
        not valid;
        """
    )
    db_execute("alter table app.tasks drop constraint if exists tasks_kanban_state_check;")
    db_execute(
        """
        alter table app.tasks
        add constraint tasks_kanban_state_check
        check (kanban_state in ('todo','in_progress','done'))
        not valid;
        """
    )
    db_execute("alter table app.tasks drop constraint if exists tasks_priority_eisenhower_check;")
    db_execute(
        """
        alter table app.tasks
        add constraint tasks_priority_eisenhower_check
        check (priority_eisenhower in ('urgent_important','important_not_urgent','urgent_not_important','not_urgent_not_important'))
        not valid;
        """
    )
    db_execute(
        """
        create or replace function app.set_tasks_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$;
        """
    )
    db_execute("drop trigger if exists trg_tasks_updated_at on app.tasks;")
    db_execute(
        """
        create trigger trg_tasks_updated_at
        before update on app.tasks
        for each row
        execute function app.set_tasks_updated_at();
        """
    )
    db_execute("create index if not exists idx_tasks_owner_created_at on app.tasks(owner_id, created_at desc);")
    db_execute("create index if not exists idx_tasks_workspace_created_at on app.tasks(workspace_id, created_at desc);")
    db_execute("create index if not exists idx_tasks_assignee_created_at on app.tasks(assignee_id, created_at desc);")
    db_execute("create index if not exists idx_tasks_assignee_user_created_at on app.tasks(assignee_user_id, created_at desc);")
    db_execute("create index if not exists tasks_owner_done_at_idx on app.tasks(owner_id, done_at);")
    db_execute("create index if not exists tasks_workspace_done_at_idx on app.tasks(workspace_id, done_at);")
    db_execute(
        """
        create table if not exists app.task_id_map (
          mongo_id text primary key,
          pg_id uuid not null unique,
          owner_id uuid not null,
          created_at timestamptz not null default now()
        );
        """
    )
    db_execute("create index if not exists idx_task_id_map_owner_created_at on app.task_id_map(owner_id, created_at desc);")
    db_execute(
        """
        create table if not exists app.migration_state (
          key text primary key,
          value text,
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute(
        """
        create or replace function app.set_migration_state_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$;
        """
    )
    db_execute("drop trigger if exists trg_migration_state_updated_at on app.migration_state;")
    db_execute(
        """
        create trigger trg_migration_state_updated_at
        before update on app.migration_state
        for each row
        execute function app.set_migration_state_updated_at();
        """
    )

    db_execute("grant select, insert, update, delete on app.tasks to authenticated;")
    db_execute("grant select, insert, update, delete on app.task_id_map to authenticated;")
    db_execute("grant select, insert, update, delete on app.migration_state to authenticated;")
    db_execute(
        """
        do $$
        begin
          if to_regclass('app.projects') is not null then
            execute 'grant select on app.projects to authenticated';
          end if;
        end $$;
        """
    )
    db_execute("alter table app.tasks enable row level security;")
    db_execute("alter table app.task_id_map enable row level security;")
    db_execute("alter table app.migration_state enable row level security;")

    db_execute("drop policy if exists tasks_select_auth on app.tasks;")
    db_execute("drop policy if exists tasks_insert_auth on app.tasks;")
    db_execute("drop policy if exists tasks_update_auth on app.tasks;")
    db_execute("drop policy if exists tasks_delete_auth on app.tasks;")
    db_execute("drop policy if exists task_id_map_select_auth on app.task_id_map;")
    db_execute("drop policy if exists task_id_map_insert_auth on app.task_id_map;")
    db_execute("drop policy if exists task_id_map_update_auth on app.task_id_map;")
    db_execute("drop policy if exists task_id_map_delete_auth on app.task_id_map;")
    db_execute("drop policy if exists migration_state_select_auth on app.migration_state;")
    db_execute("drop policy if exists migration_state_insert_auth on app.migration_state;")
    db_execute("drop policy if exists migration_state_update_auth on app.migration_state;")
    db_execute("drop policy if exists migration_state_delete_auth on app.migration_state;")

    db_execute(
        """
        create policy tasks_select_auth
          on app.tasks
          for select
          to authenticated
          using (
            owner_id = auth.uid()
            or (
              workspace_id is not null
              and exists (
                select 1
                from app.workspace_members wm
                where wm.workspace_id = tasks.workspace_id
                  and wm.user_id = auth.uid()
                  and coalesce(wm.status, 'active') = 'active'
              )
            )
          );
        """
    )
    db_execute(
        """
        create policy tasks_insert_auth
          on app.tasks
          for insert
          to authenticated
          with check (
            owner_id = auth.uid()
            and (
              workspace_id is null
              or exists (
                select 1
                from app.workspace_members wm
                where wm.workspace_id = tasks.workspace_id
                  and wm.user_id = auth.uid()
                  and coalesce(wm.status, 'active') = 'active'
              )
            )
          );
        """
    )
    db_execute(
        """
        create policy tasks_update_auth
          on app.tasks
          for update
          to authenticated
          using (
            owner_id = auth.uid()
            or (
              workspace_id is not null
              and exists (
                select 1
                from app.workspace_members wm
                where wm.workspace_id = tasks.workspace_id
                  and wm.user_id = auth.uid()
                  and coalesce(wm.status, 'active') = 'active'
                  and wm.role in ('owner','admin')
              )
            )
          )
          with check (
            owner_id = auth.uid()
            or (
              workspace_id is not null
              and exists (
                select 1
                from app.workspace_members wm
                where wm.workspace_id = tasks.workspace_id
                  and wm.user_id = auth.uid()
                  and coalesce(wm.status, 'active') = 'active'
                  and wm.role in ('owner','admin')
              )
            )
          );
        """
    )
    db_execute(
        """
        create policy tasks_delete_auth
          on app.tasks
          for delete
          to authenticated
          using (
            owner_id = auth.uid()
            or (
              workspace_id is not null
              and exists (
                select 1
                from app.workspace_members wm
                where wm.workspace_id = tasks.workspace_id
                  and wm.user_id = auth.uid()
                  and coalesce(wm.status, 'active') = 'active'
                  and wm.role in ('owner','admin')
              )
            )
          );
        """
    )
    db_execute(
        """
        create policy task_id_map_select_auth
          on app.task_id_map
          for select
          to authenticated
          using (true);
        """
    )
    db_execute(
        """
        create policy task_id_map_insert_auth
          on app.task_id_map
          for insert
          to authenticated
          with check (true);
        """
    )
    db_execute(
        """
        create policy task_id_map_update_auth
          on app.task_id_map
          for update
          to authenticated
          using (true)
          with check (true);
        """
    )
    db_execute(
        """
        create policy task_id_map_delete_auth
          on app.task_id_map
          for delete
          to authenticated
          using (true);
        """
    )
    db_execute(
        """
        create policy migration_state_select_auth
          on app.migration_state
          for select
          to authenticated
          using (true);
        """
    )
    db_execute(
        """
        create policy migration_state_insert_auth
          on app.migration_state
          for insert
          to authenticated
          with check (true);
        """
    )
    db_execute(
        """
        create policy migration_state_update_auth
          on app.migration_state
          for update
          to authenticated
          using (true)
          with check (true);
        """
    )
    db_execute(
        """
        create policy migration_state_delete_auth
          on app.migration_state
          for delete
          to authenticated
          using (true);
        """
    )


def ensure_myplanning_alerts_tables() -> None:
    # Bootstrap Alerts v1 tables/policies in Postgres app schema.
    # Keep SQL idempotent so startup remains safe.
    if not POOL:
        return

    db_execute("create extension if not exists pgcrypto;")
    db_execute("grant usage on schema app to authenticated;")

    db_execute(
        """
        create table if not exists app.notification_preferences (
          owner_id uuid primary key,
          email_enabled boolean not null default true,
          whatsapp_enabled boolean not null default false,
          whatsapp_e164 text null,
          daily_digest_enabled boolean not null default true,
          digest_time_local time not null default '07:00:00',
          timezone text not null default 'Africa/Lome',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute("create index if not exists notification_preferences_owner_idx on app.notification_preferences(owner_id);")

    db_execute(
        """
        create table if not exists app.alert_rules (
          id uuid primary key default gen_random_uuid(),
          owner_id uuid not null,
          workspace_id uuid null references app.workspaces(id) on delete set null,
          rule_type text not null,
          channel text not null,
          is_enabled boolean not null default true,
          params jsonb not null default '{}'::jsonb,
          last_run_at timestamptz null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute("create index if not exists alert_rules_owner_idx on app.alert_rules(owner_id, created_at desc);")
    db_execute("create index if not exists alert_rules_workspace_idx on app.alert_rules(workspace_id, created_at desc);")
    db_execute("create index if not exists alert_rules_enabled_idx on app.alert_rules(is_enabled, rule_type);")

    db_execute(
        """
        create table if not exists app.notifications (
          id bigserial primary key,
          owner_id uuid not null,
          workspace_id uuid null references app.workspaces(id) on delete set null,
          channel text not null,
          template text not null,
          payload jsonb not null,
          status text not null default 'pending',
          provider_message_id text null,
          error text null,
          dedupe_key text null,
          scheduled_at timestamptz not null default now(),
          sent_at timestamptz null,
          created_at timestamptz not null default now()
        );
        """
    )
    db_execute("create index if not exists notifications_status_scheduled_idx on app.notifications(status, scheduled_at);")
    db_execute("create index if not exists notifications_owner_created_idx on app.notifications(owner_id, created_at desc);")
    # ON CONFLICT (dedupe_key) requires a non-partial unique index/constraint to be inferred.
    # Postgres UNIQUE already allows multiple NULL values, so we don't need a partial index.
    db_execute(
        """
        do $$
        declare
          idxdef text;
        begin
          select indexdef into idxdef
          from pg_indexes
          where schemaname='app' and indexname='notifications_dedupe_key_uniq';
          if idxdef is not null and position(' where ' in lower(idxdef)) > 0 then
            execute 'drop index if exists app.notifications_dedupe_key_uniq';
          end if;
        end $$;
        """
    )
    db_execute("create unique index if not exists notifications_dedupe_key_uniq on app.notifications(dedupe_key);")

    db_execute(
        """
        create table if not exists app.notification_events (
          id bigserial primary key,
          notification_id bigint not null references app.notifications(id) on delete cascade,
          event text not null,
          meta jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now()
        );
        """
    )
    db_execute("create index if not exists notification_events_notification_idx on app.notification_events(notification_id, created_at desc);")

    db_execute("grant select, insert, update, delete on app.notification_preferences to authenticated;")
    db_execute("grant select, insert, update, delete on app.alert_rules to authenticated;")
    db_execute("grant select, insert, update, delete on app.notifications to authenticated;")
    db_execute("grant select, insert, update, delete on app.notification_events to authenticated;")

    db_execute(
        """
        create or replace function app.set_alerts_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$;
        """
    )
    db_execute("drop trigger if exists trg_notification_preferences_updated_at on app.notification_preferences;")
    db_execute(
        """
        create trigger trg_notification_preferences_updated_at
        before update on app.notification_preferences
        for each row
        execute function app.set_alerts_updated_at();
        """
    )
    db_execute("drop trigger if exists trg_alert_rules_updated_at on app.alert_rules;")
    db_execute(
        """
        create trigger trg_alert_rules_updated_at
        before update on app.alert_rules
        for each row
        execute function app.set_alerts_updated_at();
        """
    )

    db_execute("alter table app.notification_preferences enable row level security;")
    db_execute("alter table app.alert_rules enable row level security;")
    db_execute("alter table app.notifications enable row level security;")
    db_execute("alter table app.notification_events enable row level security;")

    db_execute("drop policy if exists notification_preferences_select_auth on app.notification_preferences;")
    db_execute("drop policy if exists notification_preferences_insert_auth on app.notification_preferences;")
    db_execute("drop policy if exists notification_preferences_update_auth on app.notification_preferences;")
    db_execute("drop policy if exists notification_preferences_delete_auth on app.notification_preferences;")

    db_execute("drop policy if exists alert_rules_select_auth on app.alert_rules;")
    db_execute("drop policy if exists alert_rules_insert_auth on app.alert_rules;")
    db_execute("drop policy if exists alert_rules_update_auth on app.alert_rules;")
    db_execute("drop policy if exists alert_rules_delete_auth on app.alert_rules;")

    db_execute("drop policy if exists notifications_select_auth on app.notifications;")
    db_execute("drop policy if exists notifications_insert_auth on app.notifications;")
    db_execute("drop policy if exists notifications_update_auth on app.notifications;")
    db_execute("drop policy if exists notifications_delete_auth on app.notifications;")

    db_execute("drop policy if exists notification_events_select_auth on app.notification_events;")
    db_execute("drop policy if exists notification_events_insert_auth on app.notification_events;")
    db_execute("drop policy if exists notification_events_update_auth on app.notification_events;")
    db_execute("drop policy if exists notification_events_delete_auth on app.notification_events;")

    db_execute(
        """
        create policy notification_preferences_select_auth
          on app.notification_preferences
          for select
          to authenticated
          using (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy notification_preferences_insert_auth
          on app.notification_preferences
          for insert
          to authenticated
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy notification_preferences_update_auth
          on app.notification_preferences
          for update
          to authenticated
          using (owner_id = auth.uid())
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy notification_preferences_delete_auth
          on app.notification_preferences
          for delete
          to authenticated
          using (owner_id = auth.uid());
        """
    )

    db_execute(
        """
        create policy alert_rules_select_auth
          on app.alert_rules
          for select
          to authenticated
          using (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy alert_rules_insert_auth
          on app.alert_rules
          for insert
          to authenticated
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy alert_rules_update_auth
          on app.alert_rules
          for update
          to authenticated
          using (owner_id = auth.uid())
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy alert_rules_delete_auth
          on app.alert_rules
          for delete
          to authenticated
          using (owner_id = auth.uid());
        """
    )

    db_execute(
        """
        create policy notifications_select_auth
          on app.notifications
          for select
          to authenticated
          using (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy notifications_insert_auth
          on app.notifications
          for insert
          to authenticated
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy notifications_update_auth
          on app.notifications
          for update
          to authenticated
          using (owner_id = auth.uid())
          with check (owner_id = auth.uid());
        """
    )
    db_execute(
        """
        create policy notifications_delete_auth
          on app.notifications
          for delete
          to authenticated
          using (owner_id = auth.uid());
        """
    )

    db_execute(
        """
        create policy notification_events_select_auth
          on app.notification_events
          for select
          to authenticated
          using (
            exists (
              select 1
              from app.notifications n
              where n.id = notification_events.notification_id
                and n.owner_id = auth.uid()
            )
          );
        """
    )
    db_execute(
        """
        create policy notification_events_insert_auth
          on app.notification_events
          for insert
          to authenticated
          with check (
            exists (
              select 1
              from app.notifications n
              where n.id = notification_events.notification_id
                and n.owner_id = auth.uid()
            )
          );
        """
    )
    db_execute(
        """
        create policy notification_events_update_auth
          on app.notification_events
          for update
          to authenticated
          using (false)
          with check (false);
        """
    )
    db_execute(
        """
        create policy notification_events_delete_auth
          on app.notification_events
          for delete
          to authenticated
          using (false);
        """
    )


def ensure_myplanning_attendance_tables() -> None:
    # Bootstrap Attendance v1 tables/policies in Postgres app schema.
    # Keep SQL idempotent so startup remains safe.
    if not POOL:
        return

    db_execute("create extension if not exists pgcrypto;")
    db_execute("grant usage on schema app to authenticated;")
    # Bigserial tables require sequence privileges for inserts under role authenticated.
    db_execute("grant usage, select on all sequences in schema app to authenticated;")

    db_execute(
        """
        create table if not exists app.attendance_locations (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          name text not null,
          is_active boolean not null default true,
          created_by uuid not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute(
        "create index if not exists attendance_locations_workspace_active_idx on app.attendance_locations(workspace_id, is_active);"
    )

    # Prepared for v1.1 (device signature): included now for forward-compatibility.
    db_execute(
        """
        create table if not exists app.attendance_devices (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          label text not null,
          device_public_key text null,
          is_active boolean not null default true,
          created_at timestamptz not null default now()
        );
        """
    )
    db_execute(
        "create index if not exists attendance_devices_workspace_active_idx on app.attendance_devices(workspace_id, is_active);"
    )

    db_execute(
        """
        create table if not exists app.attendance_qr_tokens (
          id bigserial primary key,
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          location_id uuid not null references app.attendance_locations(id) on delete cascade,
          token_hash text not null,
          valid_from timestamptz not null,
          valid_to timestamptz not null,
          created_at timestamptz not null default now(),
          constraint attendance_qr_tokens_valid_range check (valid_to > valid_from)
        );
        """
    )
    db_execute(
        "create index if not exists attendance_qr_tokens_workspace_loc_from_idx on app.attendance_qr_tokens(workspace_id, location_id, valid_from desc);"
    )
    db_execute("create unique index if not exists attendance_qr_tokens_token_hash_uniq on app.attendance_qr_tokens(token_hash);")

    db_execute(
        """
        create table if not exists app.attendance_events (
          id bigserial primary key,
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          user_id uuid not null,
          location_id uuid not null references app.attendance_locations(id) on delete cascade,
          event_type text not null check (event_type in ('check_in','check_out')),
          event_ts timestamptz not null default now(),
          client_ts timestamptz null,
          client_tz text null,
          client_ip inet null,
          user_agent text null,
          metadata jsonb not null default '{}'::jsonb
        );
        """
    )
    db_execute("create index if not exists attendance_events_workspace_user_ts_idx on app.attendance_events(workspace_id, user_id, event_ts desc);")
    db_execute("create index if not exists attendance_events_workspace_ts_idx on app.attendance_events(workspace_id, event_ts desc);")

    db_execute(
        """
        create table if not exists app.attendance_daily (
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          user_id uuid not null,
          day date not null,
          first_check_in timestamptz null,
          last_check_out timestamptz null,
          minutes_present int not null default 0,
          status text not null default 'absent' check (status in ('present','partial','absent')),
          computed_at timestamptz not null default now(),
          primary key (workspace_id, user_id, day)
        );
        """
    )
    db_execute("create index if not exists attendance_daily_workspace_day_idx on app.attendance_daily(workspace_id, day);")

    db_execute("grant select, insert, update, delete on app.attendance_locations to authenticated;")
    db_execute("grant select, insert, update, delete on app.attendance_devices to authenticated;")
    db_execute("grant select, insert, update, delete on app.attendance_qr_tokens to authenticated;")
    db_execute("grant select, insert, update, delete on app.attendance_events to authenticated;")
    db_execute("grant select, insert, update, delete on app.attendance_daily to authenticated;")

    db_execute(
        """
        create or replace function app.set_attendance_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$;
        """
    )
    db_execute("drop trigger if exists trg_attendance_locations_updated_at on app.attendance_locations;")
    db_execute(
        """
        create trigger trg_attendance_locations_updated_at
        before update on app.attendance_locations
        for each row
        execute function app.set_attendance_updated_at();
        """
    )

    db_execute("alter table app.attendance_locations enable row level security;")
    db_execute("alter table app.attendance_devices enable row level security;")
    db_execute("alter table app.attendance_qr_tokens enable row level security;")
    db_execute("alter table app.attendance_events enable row level security;")
    db_execute("alter table app.attendance_daily enable row level security;")

    # Reset policies (idempotent).
    for table, prefix in [
        ("app.attendance_locations", "attendance_locations"),
        ("app.attendance_devices", "attendance_devices"),
        ("app.attendance_qr_tokens", "attendance_qr_tokens"),
        ("app.attendance_events", "attendance_events"),
        ("app.attendance_daily", "attendance_daily"),
    ]:
        db_execute(f"drop policy if exists {prefix}_select_auth on {table};")
        db_execute(f"drop policy if exists {prefix}_insert_auth on {table};")
        db_execute(f"drop policy if exists {prefix}_update_auth on {table};")
        db_execute(f"drop policy if exists {prefix}_delete_auth on {table};")

    member_active = """
      exists (
        select 1 from app.workspace_members wm
        where wm.workspace_id = workspace_id
          and wm.user_id = auth.uid()
          and coalesce(wm.status, 'active') = 'active'
      )
      or exists (
        select 1 from app.workspaces w
        where w.id = workspace_id
          and w.owner_id = auth.uid()
      )
    """
    member_admin = """
      exists (
        select 1 from app.workspace_members wm
        where wm.workspace_id = workspace_id
          and wm.user_id = auth.uid()
          and coalesce(wm.status, 'active') = 'active'
          and coalesce(wm.role, '') in ('owner','admin')
      )
      or exists (
        select 1 from app.workspaces w
        where w.id = workspace_id
          and w.owner_id = auth.uid()
      )
    """

    # Locations
    db_execute(
        f"""
        create policy attendance_locations_select_auth
          on app.attendance_locations
          for select
          to authenticated
          using ({member_active});
        """
    )
    db_execute(
        f"""
        create policy attendance_locations_insert_auth
          on app.attendance_locations
          for insert
          to authenticated
          with check ({member_admin});
        """
    )
    db_execute(
        f"""
        create policy attendance_locations_update_auth
          on app.attendance_locations
          for update
          to authenticated
          using ({member_admin})
          with check ({member_admin});
        """
    )
    db_execute(
        f"""
        create policy attendance_locations_delete_auth
          on app.attendance_locations
          for delete
          to authenticated
          using ({member_admin});
        """
    )

    # Devices
    db_execute(
        f"""
        create policy attendance_devices_select_auth
          on app.attendance_devices
          for select
          to authenticated
          using ({member_active});
        """
    )
    db_execute(
        f"""
        create policy attendance_devices_insert_auth
          on app.attendance_devices
          for insert
          to authenticated
          with check ({member_admin});
        """
    )
    db_execute(
        f"""
        create policy attendance_devices_update_auth
          on app.attendance_devices
          for update
          to authenticated
          using ({member_admin})
          with check ({member_admin});
        """
    )
    db_execute(
        f"""
        create policy attendance_devices_delete_auth
          on app.attendance_devices
          for delete
          to authenticated
          using ({member_admin});
        """
    )

    # QR tokens
    db_execute(
        f"""
        create policy attendance_qr_tokens_select_auth
          on app.attendance_qr_tokens
          for select
          to authenticated
          using ({member_active});
        """
    )
    db_execute(
        f"""
        create policy attendance_qr_tokens_insert_auth
          on app.attendance_qr_tokens
          for insert
          to authenticated
          with check ({member_admin});
        """
    )
    db_execute(
        f"""
        create policy attendance_qr_tokens_update_auth
          on app.attendance_qr_tokens
          for update
          to authenticated
          using ({member_admin})
          with check ({member_admin});
        """
    )
    db_execute(
        f"""
        create policy attendance_qr_tokens_delete_auth
          on app.attendance_qr_tokens
          for delete
          to authenticated
          using ({member_admin});
        """
    )

    # Events
    db_execute(
        """
        create policy attendance_events_select_auth
          on app.attendance_events
          for select
          to authenticated
          using (
            user_id = auth.uid()
            or exists (
              select 1 from app.workspace_members wm
              where wm.workspace_id = attendance_events.workspace_id
                and wm.user_id = auth.uid()
                and coalesce(wm.status,'active') = 'active'
                and coalesce(wm.role,'') in ('owner','admin')
            )
            or exists (
              select 1 from app.workspaces w
              where w.id = attendance_events.workspace_id
                and w.owner_id = auth.uid()
            )
          );
        """
    )
    db_execute(
        """
        create policy attendance_events_insert_auth
          on app.attendance_events
          for insert
          to authenticated
          with check (
            user_id = auth.uid()
            and (
              exists (
                select 1 from app.workspace_members wm
                where wm.workspace_id = attendance_events.workspace_id
                  and wm.user_id = auth.uid()
                  and coalesce(wm.status,'active') = 'active'
              )
              or exists (
                select 1 from app.workspaces w
                where w.id = attendance_events.workspace_id
                  and w.owner_id = auth.uid()
              )
            )
          );
        """
    )
    db_execute(
        """
        create policy attendance_events_update_auth
          on app.attendance_events
          for update
          to authenticated
          using (false)
          with check (false);
        """
    )
    db_execute(
        """
        create policy attendance_events_delete_auth
          on app.attendance_events
          for delete
          to authenticated
          using (false);
        """
    )

    # Daily
    db_execute(
        """
        create policy attendance_daily_select_auth
          on app.attendance_daily
          for select
          to authenticated
          using (
            user_id = auth.uid()
            or exists (
              select 1 from app.workspace_members wm
              where wm.workspace_id = attendance_daily.workspace_id
                and wm.user_id = auth.uid()
                and coalesce(wm.status,'active') = 'active'
                and coalesce(wm.role,'') in ('owner','admin')
            )
            or exists (
              select 1 from app.workspaces w
              where w.id = attendance_daily.workspace_id
                and w.owner_id = auth.uid()
            )
          );
        """
    )
    db_execute(
        """
        create policy attendance_daily_insert_auth
          on app.attendance_daily
          for insert
          to authenticated
          with check (
            exists (
              select 1 from app.workspace_members wm
              where wm.workspace_id = attendance_daily.workspace_id
                and wm.user_id = auth.uid()
                and coalesce(wm.status,'active') = 'active'
            )
            or exists (
              select 1 from app.workspaces w
              where w.id = attendance_daily.workspace_id
                and w.owner_id = auth.uid()
            )
          );
        """
    )
    db_execute(
        """
        create policy attendance_daily_update_auth
          on app.attendance_daily
          for update
          to authenticated
          using (
            exists (
              select 1 from app.workspace_members wm
              where wm.workspace_id = attendance_daily.workspace_id
                and wm.user_id = auth.uid()
                and coalesce(wm.status,'active') = 'active'
                and coalesce(wm.role,'') in ('owner','admin')
            )
            or exists (
              select 1 from app.workspaces w
              where w.id = attendance_daily.workspace_id
                and w.owner_id = auth.uid()
            )
          )
          with check (true);
        """
    )
    db_execute(
        """
        create policy attendance_daily_delete_auth
          on app.attendance_daily
          for delete
          to authenticated
          using (false);
        """
    )


def ensure_myplanning_enterprise_ops_tables() -> None:
    # Enterprise modules: departments + n8n integration outbox.
    if not POOL:
        return

    db_execute("create extension if not exists pgcrypto;")
    db_execute("grant usage on schema app to authenticated;")

    db_execute(
        """
        create or replace function app.is_workspace_member(ws_id uuid, uid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = app, public
        set row_security = off
        as $$
          select exists (
            select 1
            from app.workspaces w
            where w.id = ws_id
              and (
                w.owner_id = uid
                or exists (
                  select 1
                  from app.workspace_members wm
                  where wm.workspace_id = ws_id
                    and wm.user_id = uid
                    and coalesce(wm.status, 'active') = 'active'
                )
              )
          );
        $$;
        """
    )
    db_execute(
        """
        create or replace function app.is_workspace_admin(ws_id uuid, uid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = app, public
        set row_security = off
        as $$
          select exists (
            select 1
            from app.workspaces w
            where w.id = ws_id
              and (
                w.owner_id = uid
                or exists (
                  select 1
                  from app.workspace_members wm
                  where wm.workspace_id = ws_id
                    and wm.user_id = uid
                    and coalesce(wm.status, 'active') = 'active'
                    and coalesce(wm.role, '') in ('owner', 'admin')
                )
              )
          );
        $$;
        """
    )
    db_execute("grant execute on function app.is_workspace_member(uuid, uuid) to authenticated;")
    db_execute("grant execute on function app.is_workspace_admin(uuid, uuid) to authenticated;")

    db_execute(
        """
        create table if not exists app.departments (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          name text not null,
          created_by uuid not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute("create unique index if not exists departments_workspace_name_key on app.departments(workspace_id, lower(name));")
    db_execute("create index if not exists departments_workspace_created_idx on app.departments(workspace_id, created_at desc);")

    db_execute(
        """
        create table if not exists app.integration_endpoints (
          workspace_id uuid primary key references app.workspaces(id) on delete cascade,
          n8n_webhook_url text null,
          secret text not null default encode(gen_random_bytes(32), 'hex'),
          enabled boolean not null default false,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        """
    )
    db_execute("create index if not exists integration_endpoints_enabled_idx on app.integration_endpoints(enabled);")

    db_execute(
        """
        create table if not exists app.integration_events (
          id bigserial primary key,
          owner_id uuid not null,
          workspace_id uuid not null references app.workspaces(id) on delete cascade,
          type text not null,
          event_type text null,
          payload_json jsonb not null default '{}'::jsonb,
          status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
          attempts int not null default 0,
          response_code int null,
          http_code int null,
          last_error text null,
          created_at timestamptz not null default now(),
          delivered_at timestamptz null
        );
        """
    )
    db_execute("alter table app.integration_events add column if not exists event_type text null;")
    db_execute("alter table app.integration_events add column if not exists http_code int null;")
    db_execute("update app.integration_events set event_type = type where event_type is null;")
    db_execute("update app.integration_events set http_code = response_code where http_code is null and response_code is not null;")
    db_execute("create index if not exists integration_events_status_created_idx on app.integration_events(status, created_at);")
    db_execute("create index if not exists integration_events_workspace_created_idx on app.integration_events(workspace_id, created_at desc);")
    db_execute("create index if not exists integration_events_owner_created_idx on app.integration_events(owner_id, created_at desc);")
    db_execute("create index if not exists integration_events_event_type_created_idx on app.integration_events(event_type, created_at desc);")

    db_execute(
        """
        create table if not exists app.integration_mock_receipts (
          id bigserial primary key,
          event_id bigint null references app.integration_events(id) on delete set null,
          owner_id uuid null,
          workspace_id uuid null references app.workspaces(id) on delete set null,
          event_type text not null default 'manual.test',
          request_url text null,
          headers_json jsonb not null default '{}'::jsonb,
          payload_json jsonb not null default '{}'::jsonb,
          received_at timestamptz not null default now()
        );
        """
    )
    db_execute("create index if not exists integration_mock_receipts_event_id_idx on app.integration_mock_receipts(event_id);")
    db_execute("create index if not exists integration_mock_receipts_received_idx on app.integration_mock_receipts(received_at desc);")

    db_execute(
        """
        do $$
        begin
          if exists (
            select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'app'
              and c.relname = 'integration_events_id_seq'
          ) then
            execute 'grant usage, select on sequence app.integration_events_id_seq to authenticated';
          end if;
        end $$;
        """
    )

    db_execute("grant select, insert, update, delete on app.departments to authenticated;")
    db_execute("grant select, insert, update, delete on app.integration_endpoints to authenticated;")
    db_execute("grant select, insert, update, delete on app.integration_events to authenticated;")
    db_execute("grant select, insert on app.integration_mock_receipts to authenticated;")

    db_execute(
        """
        create or replace function app.set_enterprise_ops_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$;
        """
    )
    db_execute("drop trigger if exists trg_departments_updated_at on app.departments;")
    db_execute(
        """
        create trigger trg_departments_updated_at
        before update on app.departments
        for each row
        execute function app.set_enterprise_ops_updated_at();
        """
    )
    db_execute("drop trigger if exists trg_integration_endpoints_updated_at on app.integration_endpoints;")
    db_execute(
        """
        create trigger trg_integration_endpoints_updated_at
        before update on app.integration_endpoints
        for each row
        execute function app.set_enterprise_ops_updated_at();
        """
    )

    db_execute("alter table app.departments enable row level security;")
    db_execute("alter table app.integration_endpoints enable row level security;")
    db_execute("alter table app.integration_events enable row level security;")
    db_execute("alter table app.integration_mock_receipts enable row level security;")

    db_execute("drop policy if exists departments_select_member on app.departments;")
    db_execute("drop policy if exists departments_insert_admin on app.departments;")
    db_execute("drop policy if exists departments_update_admin on app.departments;")
    db_execute("drop policy if exists departments_delete_admin on app.departments;")
    db_execute("drop policy if exists integration_endpoints_select_member on app.integration_endpoints;")
    db_execute("drop policy if exists integration_endpoints_insert_admin on app.integration_endpoints;")
    db_execute("drop policy if exists integration_endpoints_update_admin on app.integration_endpoints;")
    db_execute("drop policy if exists integration_endpoints_delete_admin on app.integration_endpoints;")
    db_execute("drop policy if exists integration_events_select_member on app.integration_events;")
    db_execute("drop policy if exists integration_events_insert_member on app.integration_events;")
    db_execute("drop policy if exists integration_events_update_admin on app.integration_events;")
    db_execute("drop policy if exists integration_events_delete_admin on app.integration_events;")
    db_execute("drop policy if exists integration_mock_receipts_select_member on app.integration_mock_receipts;")
    db_execute("drop policy if exists integration_mock_receipts_insert_member on app.integration_mock_receipts;")

    db_execute(
        """
        create policy departments_select_member
          on app.departments
          for select
          to authenticated
          using (app.is_workspace_member(departments.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy departments_insert_admin
          on app.departments
          for insert
          to authenticated
          with check (
            app.is_workspace_admin(departments.workspace_id, auth.uid())
            and created_by = auth.uid()
          );
        """
    )
    db_execute(
        """
        create policy departments_update_admin
          on app.departments
          for update
          to authenticated
          using (app.is_workspace_admin(departments.workspace_id, auth.uid()))
          with check (app.is_workspace_admin(departments.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy departments_delete_admin
          on app.departments
          for delete
          to authenticated
          using (app.is_workspace_admin(departments.workspace_id, auth.uid()));
        """
    )

    db_execute(
        """
        create policy integration_endpoints_select_member
          on app.integration_endpoints
          for select
          to authenticated
          using (app.is_workspace_member(integration_endpoints.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy integration_endpoints_insert_admin
          on app.integration_endpoints
          for insert
          to authenticated
          with check (app.is_workspace_admin(integration_endpoints.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy integration_endpoints_update_admin
          on app.integration_endpoints
          for update
          to authenticated
          using (app.is_workspace_admin(integration_endpoints.workspace_id, auth.uid()))
          with check (app.is_workspace_admin(integration_endpoints.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy integration_endpoints_delete_admin
          on app.integration_endpoints
          for delete
          to authenticated
          using (app.is_workspace_admin(integration_endpoints.workspace_id, auth.uid()));
        """
    )

    db_execute(
        """
        create policy integration_events_select_member
          on app.integration_events
          for select
          to authenticated
          using (
            owner_id = auth.uid()
            or app.is_workspace_member(integration_events.workspace_id, auth.uid())
          );
        """
    )
    db_execute(
        """
        create policy integration_events_insert_member
          on app.integration_events
          for insert
          to authenticated
          with check (
            owner_id = auth.uid()
            and app.is_workspace_member(integration_events.workspace_id, auth.uid())
          );
        """
    )
    db_execute(
        """
        create policy integration_events_update_admin
          on app.integration_events
          for update
          to authenticated
          using (app.is_workspace_admin(integration_events.workspace_id, auth.uid()))
          with check (app.is_workspace_admin(integration_events.workspace_id, auth.uid()));
        """
    )
    db_execute(
        """
        create policy integration_events_delete_admin
          on app.integration_events
          for delete
          to authenticated
          using (app.is_workspace_admin(integration_events.workspace_id, auth.uid()));
        """
    )

    db_execute(
        """
        create policy integration_mock_receipts_select_member
          on app.integration_mock_receipts
          for select
          to authenticated
          using (
            owner_id = auth.uid()
            or app.is_workspace_member(integration_mock_receipts.workspace_id, auth.uid())
          );
        """
    )
    db_execute(
        """
        create policy integration_mock_receipts_insert_member
          on app.integration_mock_receipts
          for insert
          to authenticated
          with check (
            owner_id = auth.uid()
            and app.is_workspace_member(integration_mock_receipts.workspace_id, auth.uid())
          );
        """
    )


def _client_ip(request: Request) -> str:
    xff = (request.headers.get("x-forwarded-for") or "").strip()
    if xff:
        return xff.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _check_lead_rate_limit(client_ip: str) -> bool:
    now = time.monotonic()
    with _LEAD_RATE_LOCK:
        recent = [
            ts
            for ts in _LEAD_RATE_BUCKETS.get(client_ip, [])
            if (now - ts) < LEAD_RATE_LIMIT_WINDOW_S
        ]
        if len(recent) >= LEAD_RATE_LIMIT_MAX:
            _LEAD_RATE_BUCKETS[client_ip] = recent
            return False
        recent.append(now)
        _LEAD_RATE_BUCKETS[client_ip] = recent
    return True


def _read_env_file_value(var_name: str, path: str = "/etc/innovaplus/backend.env") -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                if key.strip() != var_name:
                    continue
                value = value.strip().strip('"').strip("'")
                return value
    except Exception:
        return ""
    return ""


def _derive_supabase_url_from_dsn(dsn: str) -> str:
    match = re.search(r"postgres\.([a-z0-9]+)", dsn or "")
    if not match:
        return ""
    return f"https://{match.group(1)}.supabase.co"


def _resolve_admin_token() -> str:
    token = (os.environ.get("ADMIN_TOKEN") or "").strip()
    if not token:
        token = _read_env_file_value("ADMIN_TOKEN").strip()
    if token:
        return token

    # Fallback so current deployments remain operable until ADMIN_TOKEN is set.
    token = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not token:
        token = _read_env_file_value("SUPABASE_SERVICE_ROLE_KEY").strip()
    if token:
        logger.warning("ADMIN_TOKEN not set; falling back to SUPABASE_SERVICE_ROLE_KEY")
    return token


def _require_admin_token(request: Request) -> None:
    configured = _resolve_admin_token()
    if not configured:
        raise HTTPException(status_code=500, detail="Admin token not configured")
    provided = (request.headers.get("X-Admin-Token") or "").strip()
    if not provided or not hmac.compare_digest(provided, configured):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _resolve_webhook_secret() -> str:
    token = (os.environ.get("WEBHOOK_SECRET") or "").strip()
    if not token:
        token = _read_env_file_value("WEBHOOK_SECRET").strip()
    if token:
        return token

    token = (os.environ.get("ENTERPRISE_WEBHOOK_SECRET") or "").strip()
    if not token:
        token = _read_env_file_value("ENTERPRISE_WEBHOOK_SECRET").strip()
    if token:
        return token

    # Fallback for bootstrapping in existing environments.
    token = _resolve_admin_token()
    if token:
        logger.warning("WEBHOOK_SECRET not set; falling back to ADMIN_TOKEN")
    return token


def _require_webhook_secret(request: Request) -> None:
    configured = _resolve_webhook_secret()
    if not configured:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    provided = (request.headers.get("X-Webhook-Secret") or "").strip()
    if not provided or not hmac.compare_digest(provided, configured):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _extract_lead_id_from_webhook(payload: dict[str, Any]) -> Any:
    if isinstance(payload.get("record"), dict):
        return payload["record"].get("id")
    if isinstance(payload.get("new"), dict):
        return payload["new"].get("id")
    if isinstance(payload.get("data"), dict):
        return payload["data"].get("id")
    return payload.get("id")


def _get_postgrest_base_and_key() -> tuple[str, str]:
    base_url = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")
    service_key = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not service_key:
        # Fallback for environments where the systemd env file contains
        # "KEY = value" formatting and systemd ignores the variable.
        service_key = _read_env_file_value("SUPABASE_SERVICE_ROLE_KEY").strip()

    if not base_url:
        base_url = _read_env_file_value("SUPABASE_URL").strip().rstrip("/")
    if not base_url:
        dsn = (os.environ.get("DATABASE_URL") or "").strip()
        if not dsn:
            dsn = _read_env_file_value("DATABASE_URL").strip()
        base_url = _derive_supabase_url_from_dsn(dsn).rstrip("/")

    if not base_url or not service_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return base_url, service_key


def postgrest_insert_enterprise_lead(payload: dict[str, Any]) -> dict[str, Any]:
    base_url, service_key = _get_postgrest_base_and_key()

    endpoint = f"{base_url}/rest/v1/enterprise_leads"
    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    req = urlrequest.Request(endpoint, data=body, method="POST")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")

    try:
        with urlrequest.urlopen(req, timeout=float(os.environ.get("POSTGREST_TIMEOUT_S", "10"))) as response:
            raw = response.read().decode("utf-8", errors="replace")
            parsed: Any = json.loads(raw) if raw else {}
            if isinstance(parsed, list):
                return parsed[0] if parsed else {}
            if isinstance(parsed, dict):
                return parsed
            return {}
    except urlerror.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        logger.exception("PostgREST insert failed status=%s body=%s", exc.code, err_body[:1000])
        raise HTTPException(status_code=500, detail="Lead capture error")
    except Exception:
        logger.exception("PostgREST insert failed")
        raise HTTPException(status_code=500, detail="Lead capture error")


def postgrest_list_enterprise_leads(
    limit: int,
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None,
) -> list[dict[str, Any]]:
    base_url, service_key = _get_postgrest_base_and_key()

    select_cols = (
        "id,name,email,company,role,team_size,need,message,"
        "source_page,source_ts,created_at,updated_at,status,assigned_to,notes,contacted_at,"
        "client_ip,user_agent,metadata"
    )
    filters = [f"select={select_cols}", "order=created_at.desc", f"limit={int(limit)}"]
    if status:
        filters.append(f"status=eq.{status}")
    endpoint = f"{base_url}/rest/v1/enterprise_leads?{'&'.join(filters)}"

    req = urlrequest.Request(endpoint, method="GET")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")

    try:
        with urlrequest.urlopen(req, timeout=float(os.environ.get("POSTGREST_TIMEOUT_S", "10"))) as response:
            raw = response.read().decode("utf-8", errors="replace")
            parsed: Any = json.loads(raw) if raw else []
            if isinstance(parsed, list):
                return [p for p in parsed if isinstance(p, dict)]
            return []
    except urlerror.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        logger.exception("PostgREST list failed status=%s body=%s", exc.code, err_body[:1000])
        raise HTTPException(status_code=500, detail="Lead list error")
    except Exception:
        logger.exception("PostgREST list failed")
        raise HTTPException(status_code=500, detail="Lead list error")


def postgrest_patch_enterprise_lead(lead_id: int, updates: dict[str, Any]) -> dict[str, Any]:
    base_url, service_key = _get_postgrest_base_and_key()
    endpoint = f"{base_url}/rest/v1/enterprise_leads?id=eq.{int(lead_id)}"
    body = json.dumps(updates, ensure_ascii=False, default=str).encode("utf-8")

    req = urlrequest.Request(endpoint, data=body, method="PATCH")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")

    try:
        with urlrequest.urlopen(req, timeout=float(os.environ.get("POSTGREST_TIMEOUT_S", "10"))) as response:
            raw = response.read().decode("utf-8", errors="replace")
            parsed: Any = json.loads(raw) if raw else []
            if isinstance(parsed, list):
                return parsed[0] if parsed else {}
            if isinstance(parsed, dict):
                return parsed
            return {}
    except urlerror.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        logger.exception("PostgREST patch failed status=%s body=%s", exc.code, err_body[:1000])
        raise HTTPException(status_code=500, detail="Lead update error")
    except Exception:
        logger.exception("PostgREST patch failed")
        raise HTTPException(status_code=500, detail="Lead update error")


def init_cohere_client() -> None:
    global CO
    key = (os.environ.get("COHERE_API_KEY") or "").strip()
    if not key:
        logger.warning("COHERE_API_KEY is not set; AI report endpoints are disabled")
        CO = None
        return
    CO = cohere.Client(key)


def cohere_generate_report(prompt: str) -> str:
    global CO
    if not CO:
        raise HTTPException(status_code=500, detail="AI not configured")

    model = (
        os.environ.get("LLM_MODEL")
        or os.environ.get("COHERE_MODEL")
        or "command-r-plus-08-2024"
    )
    max_tokens = int(os.environ.get("AI_MAX_TOKENS", "500"))

    # Cohere Generate API is deprecated; use Chat API.
    resp = CO.chat(
        model=model,
        message=prompt,
        max_tokens=max_tokens,
        temperature=0.2,
    )
    text = getattr(resp, "text", "") or ""
    text = text.strip()
    if not text:
        raise HTTPException(status_code=500, detail="AI empty response")
    return text


def build_project_prompt(project: dict[str, Any]) -> str:
    payload = json.dumps(project, ensure_ascii=False, sort_keys=True, default=str)
    return f"""
Tu es un assistant de reporting pour un logiciel de gestion de projet.
Règles STRICTES:
- Utilise uniquement les données JSON fournies. N'invente rien.
- Si une information manque, dis "non disponible".
- Rends un rapport court, clair, actionnable, en français.
- Inclure: (1) Résumé, (2) Indicateurs clés, (3) Alertes (si applicable), (4) Prochaines actions (3 bullets max).

Données JSON:
{payload}
""".strip()


def build_portfolio_prompt(overview: dict[str, Any], top_risks: list[dict[str, Any]]) -> str:
    payload = json.dumps(
        {"overview": overview, "top_risks": top_risks},
        ensure_ascii=False,
        sort_keys=True,
        default=str,
    )
    return f"""
Tu es un assistant de reporting pour un SaaS de productivité.
Règles STRICTES:
- Utilise uniquement les données JSON fournies. N'invente rien.
- Rends un rapport en français structuré: (1) Vue d'ensemble, (2) Points d'attention, (3) Recommandations (5 bullets max).
- Ne cite pas de sources externes.

Données JSON:
{payload}
""".strip()

raw_origins = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
cors_origins = {origin.rstrip("/") for origin in raw_origins}

frontend_url = (settings.FRONTEND_BASE_URL or "").strip()
if frontend_url:
    cors_origins.add(frontend_url.rstrip("/"))
    parsed = urlparse(frontend_url)
    host = parsed.hostname or ""
    scheme = parsed.scheme or "https"
    if host and not host.startswith("www."):
        cors_origins.add(f"{scheme}://www.{host}".rstrip("/"))

if not cors_origins:
    cors_origins = {"https://innovaplus.africa", "https://www.innovaplus.africa"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(cors_origins),
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    # Include PATCH/PUT/DELETE for task updates (MyPlanning) and other mutations
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    # Allow lab APIs that use custom headers (e.g. X-API-Key).
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Admin-Token"],
)


@app.on_event("startup")
async def on_startup():
    await connect_to_mongo()
    # Verify embedding dimension dynamically and adjust if needed
    try:
        actual = detect_embed_dim()
        if actual != settings.EMBED_DIM:
            import logging
            logging.getLogger(__name__).warning(
                "EMBED_DIM mismatch: env=%s detected=%s -> using detected",
                settings.EMBED_DIM,
                actual,
            )
            settings.EMBED_DIM = actual
    except Exception:
        pass
    
    # Ensure indexes
    try:
        from app.db.mongo import get_db
        from fastapi import Depends
        db = await get_db()  # type: ignore
        await db["market_offers"].create_index([("status", 1), ("created_at", -1)])
        await db["market_offers"].create_index([("country", 1)])
        await db["mission_offers"].create_index([("mission_id", 1), ("prestataire_id", 1)])
        await db["missions"].create_index([("user_id", 1), ("status", 1)])
        await db["mission_events"].create_index([("mission_id", 1), ("ts", -1)])
        await db["mission_messages"].create_index([("mission_id", 1), ("created_at", 1)])
        await db["mission_milestones"].create_index([("mission_id", 1)])
        await db["mission_escalations"].create_index([("decided_at", -1)])
        await db["assignments"].create_index([("offer_id", 1), ("user_id", 1)], unique=True)
        await db["meet_posts"].create_index([("country", 1), ("created_at", -1)])
        await db["notifications"].create_index([("user_id", 1), ("created_at", -1)])
        await db["metrics_product"].create_index([("name", 1), ("ts", -1)])
        await db["me_profiles"].create_index([("user_id", 1)], unique=True)
        await db["decisions_audit"].create_index([("offer_id", 1), ("ts", -1)])
        await db["myplanning_tasks"].create_index([("user_id", 1), ("kanban_state", 1), ("due_datetime", 1)])
        await db["myplanning_tasks"].create_index([("user_id", 1), ("created_at", -1)])
        await db["myplanning_onboarding"].create_index([("user_id", 1)], unique=True)
    except Exception:
        pass
    init_pg_pool()
    try:
        ensure_enterprise_leads_table()
    except Exception:
        logger.exception("Failed to ensure enterprise_leads table")
    try:
        ensure_myplanning_team_tables()
    except Exception:
        logger.exception("Failed to ensure myplanning team postgres tables/policies")
    try:
        ensure_myplanning_org_tables()
    except Exception:
        logger.exception("Failed to ensure myplanning org postgres tables/policies")
    try:
        ensure_myplanning_tasks_tables()
    except Exception:
        logger.exception("Failed to ensure myplanning tasks postgres table/policies")
    try:
        ensure_myplanning_alerts_tables()
    except Exception:
        logger.exception("Failed to ensure myplanning alerts postgres tables/policies")
    try:
        ensure_myplanning_attendance_tables()
    except Exception:
        logger.exception("Failed to ensure myplanning attendance postgres tables/policies")
    try:
        ensure_myplanning_enterprise_ops_tables()
    except Exception:
        logger.exception("Failed to ensure myplanning enterprise ops postgres tables/policies")
    init_cohere_client()


@app.on_event("shutdown")
async def on_shutdown():
    close_pg_pool()
    await close_mongo_connection()


START_TIME = __import__("time").time()


@app.middleware("http")
async def normalize_forwarded_prefix(request: Request, call_next):
    # Accept both nginx style forwarded prefix and direct prefixed requests.
    header_prefix = _normalize_prefix(request.headers.get(FORWARDED_PREFIX_HEADER))
    prefix = header_prefix or API_PROXY_PREFIX
    scope = request.scope
    path = scope.get("path", "")

    new_scope = scope
    if path == prefix or path.startswith(f"{prefix}/"):
        stripped = path[len(prefix):] or "/"
        # Handle accidental doubled prefixes: /innova/api/innova/api/*
        while stripped == prefix or stripped.startswith(f"{prefix}/"):
            stripped = stripped[len(prefix):] or "/"

        new_scope = dict(scope)
        new_scope["path"] = stripped
        if scope.get("raw_path") is not None:
            new_scope["raw_path"] = stripped.encode("utf-8")
        new_scope["root_path"] = prefix
    elif header_prefix:
        new_scope = dict(scope)
        new_scope["root_path"] = header_prefix

    if new_scope is scope:
        return await call_next(request)
    return await call_next(Request(new_scope, receive=request.receive))


@app.get("/", include_in_schema=not MYPLANNING_ONLY)
async def root():
    return {"status": "ok", "service": settings.APP_NAME, "docs": "/docs"}


@app.get("/health")
async def health(db: AsyncIOMotorDatabase = Depends(get_db)):
    ok = False
    try:
        await db.command("ping")
        ok = True
    except Exception:
        ok = False
    uptime = int(__import__("time").time() - START_TIME)
    # env checks
    required = [
        # add critical keys here, optional in dev
        # "MONGODB_URI",
    ]
    missing = [k for k in required if not os.getenv(k)]
    vector_index = True  # placeholder
    queue_depth = 0      # placeholder
    return {
        "status": "ok" if ok else "down",
        "db": settings.DB_NAME,
        "mongo": "ok" if ok else "fail",
        "vector_index": vector_index,
        "env_missing": missing,
        "queue_depth": queue_depth,
        "uptime_s": uptime,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "commit_sha": (os.getenv("COMMIT_SHA") or (__import__("subprocess").run(["git","-C", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")), "rev-parse","--short","HEAD"], capture_output=True, text=True).stdout.strip() or "unknown")),
    }


@app.get("/mart/app-overview")
def mart_app_overview():
    try:
        row = db_fetchone("select * from mart.v_app_overview;")
        if row is None:
            raise HTTPException(status_code=404, detail="No data")
        return _json_safe(row)
    except HTTPException:
        raise
    except Exception:
        # Hide raw DB details in production responses.
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/mart/projects")
def mart_projects(
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort: Literal["project_id", "project_name", "start_date", "end_date", "progress", "priority"] = "project_id",
    order: Literal["asc", "desc"] = "asc",
    q: str | None = None,
):
    """
    List projects from mart.v_projects_list
    - pagination: limit/offset
    - basic search: q applies on project_id/project_name/company_name
    - safe sorting: whitelisted columns only
    """
    try:
        # Keep API-compatible sort keys even if the underlying mart view currently
        # exposes fewer columns.
        sort_col = {
            "project_id": "project_id",
            "project_name": "project_name",
            "start_date": "project_id",
            "end_date": "project_id",
            "progress": "project_id",
            "priority": "project_id",
        }[sort]
        order_sql = "ASC" if order == "asc" else "DESC"

        where_sql = ""
        params: list[Any] = []
        if q:
            where_sql = """
            where project_id ilike %s
               or project_name ilike %s
               or company_name ilike %s
            """
            like = f"%{q}%"
            params.extend([like, like, like])

        sql = f"""
        select *
        from mart.v_projects_list
        {where_sql}
        order by {sort_col} {order_sql}
        limit %s offset %s;
        """
        params.extend([limit, offset])
        rows = db_fetchall(sql, tuple(params))
        return [_json_safe(r) for r in rows]
    except Exception:
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/mart/projects/{project_id}")
def mart_project_detail(project_id: str):
    """
    One project detail from mart.v_project_detail
    """
    try:
        row = db_fetchone(
            "select * from mart.v_project_detail where project_id = %s;",
            (project_id,),
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Not found")
        return _json_safe(row)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/mart/projects/{project_id}/presence")
def mart_project_presence(project_id: str):
    """
    Daily presence series (30 rows) from mart.v_project_presence_daily
    """
    try:
        rows = db_fetchall(
            """
            select project_id, presence_date, is_present
            from mart.v_project_presence_daily
            where project_id = %s
            order by presence_date;
            """,
            (project_id,),
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Not found")
        return [_json_safe(r) for r in rows]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/ai/report/project/{project_id}")
def ai_report_project(project_id: str):
    """
    Returns:
      - data: raw metrics from mart
      - alerts: simple rule-based alerts
      - report: Cohere generated narrative (grounded)
    """
    try:
        detail = db_fetchone(
            """
            select
              project_id, project_name,
              null::text as project_status,
              null::text as priority,
              null::double precision as progress,
              null::numeric as budget,
              null::numeric as actual_cost,
              company_id, company_name, sector, country,
              date_min as presence_date_min,
              date_max as presence_date_max,
              n_days, n_present_days, n_absent_days, presence_rate
            from mart.v_project_detail
            where project_id = %s;
            """,
            (project_id,),
        )
        if not detail:
            raise HTTPException(status_code=404, detail="Not found")

        d = _json_safe(detail)

        alerts: list[str] = []
        if d.get("presence_rate") is not None and float(d["presence_rate"]) < 0.4:
            alerts.append("Présence faible (< 40%) sur la période observée.")
        if d.get("budget") is not None and d.get("actual_cost") is not None:
            try:
                if float(d["actual_cost"]) > float(d["budget"]):
                    alerts.append("Coût réel supérieur au budget.")
            except Exception:
                pass
        if d.get("progress") is not None:
            try:
                if float(d["progress"]) < 0.3:
                    alerts.append("Progression faible (< 30%).")
            except Exception:
                pass

        prompt = build_project_prompt({**d, "alerts": alerts})
        report = cohere_generate_report(prompt)
        return {"data": d, "alerts": alerts, "report": report}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="AI report error")


@app.get("/ai/report/portfolio")
def ai_report_portfolio():
    """
    Portfolio report using:
      - mart.v_app_overview
      - top risk projects based on low presence_rate
    """
    try:
        overview = db_fetchone("select * from mart.v_app_overview;")
        if not overview:
            raise HTTPException(status_code=404, detail="No data")
        o = _json_safe(overview)

        top_risks = db_fetchall(
            """
            select
              project_id,
              project_name,
              company_name,
              presence_rate,
              n_present_days,
              n_days,
              null::text as project_status,
              null::text as priority,
              null::double precision as progress
            from mart.v_project_detail
            order by presence_rate asc nulls last
            limit 10;
            """,
        )
        risks = [_json_safe(r) for r in top_risks]

        prompt = build_portfolio_prompt(o, risks)
        report = cohere_generate_report(prompt)
        return {"data": {"overview": o, "top_risks": risks}, "report": report}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="AI report error")


@app.post("/enterprise/leads")
def create_enterprise_lead(payload: EnterpriseLeadIn, request: Request):
    try:
        client_ip = _client_ip(request)
        if not _check_lead_rate_limit(client_ip):
            raise HTTPException(status_code=429, detail="Too many requests")

        # Honeypot: bots often fill hidden fields.
        if payload.website and payload.website.strip():
            raise HTTPException(status_code=400, detail="Spam detected")

        user_agent = (request.headers.get("user-agent") or "")[:512]
        referer = (request.headers.get("referer") or "")[:512]
        source_ts = payload.source_ts or datetime.now(timezone.utc)
        metadata = {
            "source_page": payload.source_page,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "referer": referer,
        }

        row = postgrest_insert_enterprise_lead(
            {
                "name": payload.name.strip(),
                "email": str(payload.email).strip(),
                "company": payload.company.strip(),
                "role": payload.role.strip(),
                "team_size": payload.team_size.strip(),
                "need": payload.need.strip(),
                "message": payload.message.strip(),
                "source_page": payload.source_page.strip(),
                "source_ts": source_ts.isoformat(),
                "status": "new",
                "client_ip": client_ip,
                "user_agent": user_agent,
                "metadata": metadata,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        lead_id = row.get("id") if isinstance(row, dict) else None
        return {"ok": True, "lead_id": lead_id}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead capture error")


@app.get("/enterprise/leads")
def list_enterprise_leads(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None,
):
    try:
        _require_admin_token(request)
        rows = postgrest_list_enterprise_leads(limit=limit, status=status)
        return rows
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead list error")


@app.get("/enterprise/leads/export.csv")
def export_enterprise_leads_csv(
    request: Request,
    limit: int = Query(50, ge=1, le=2000),
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None,
):
    try:
        _require_admin_token(request)
        rows = postgrest_list_enterprise_leads(limit=limit, status=status)
        output = io.StringIO()
        writer = csv.writer(output)
        header = [
            "id",
            "created_at",
            "name",
            "email",
            "company",
            "role",
            "team_size",
            "need",
            "status",
            "assigned_to",
            "contacted_at",
            "updated_at",
        ]
        writer.writerow(header)
        for row in rows:
            writer.writerow(
                [
                    row.get("id", ""),
                    row.get("created_at", ""),
                    row.get("name", ""),
                    row.get("email", ""),
                    row.get("company", ""),
                    row.get("role", ""),
                    row.get("team_size", ""),
                    row.get("need", ""),
                    row.get("status", ""),
                    row.get("assigned_to", ""),
                    row.get("contacted_at", ""),
                    row.get("updated_at", ""),
                ]
            )

        csv_content = output.getvalue()
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=enterprise_leads.csv"},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead export error")


@app.patch("/enterprise/leads/{lead_id}")
def patch_enterprise_lead(lead_id: int, payload: EnterpriseLeadUpdateIn, request: Request):
    try:
        _require_admin_token(request)
        updates = payload.model_dump(exclude_none=True)
        if "assigned_to" in updates and isinstance(updates["assigned_to"], str):
            updates["assigned_to"] = updates["assigned_to"].strip() or None
        if "notes" in updates and isinstance(updates["notes"], str):
            updates["notes"] = updates["notes"].strip() or None
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        if updates.get("status") == "contacted" and "contacted_at" not in updates:
            updates["contacted_at"] = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        row = postgrest_patch_enterprise_lead(lead_id=lead_id, updates=updates)
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        return {"ok": True, "lead": row}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead update error")


@app.post("/enterprise/leads/webhook")
async def enterprise_leads_webhook(request: Request):
    try:
        _require_webhook_secret(request)
        try:
            payload = await request.json()
        except Exception:
            payload = {}
        if not isinstance(payload, dict):
            payload = {"raw": payload}

        lead_id = _extract_lead_id_from_webhook(payload)
        event = payload.get("type") or payload.get("event") or payload.get("op") or "unknown"
        table = payload.get("table") or payload.get("relation") or "enterprise_leads"
        logger.warning(
            "webhook received lead_id=%s event=%s table=%s",
            lead_id,
            event,
            table,
        )
        return {"ok": True, "lead_id": lead_id, "event": event, "table": table}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Webhook handling error")


if MYPLANNING_ONLY:
    # Minimal footprint: auth, notifications, myplanning.
    # /innova/api prefix is handled by proxy + forwarded-prefix normalization middleware.
    minimal = APIRouter(prefix="")
    minimal.include_router(auth_router)
    minimal.include_router(notifications_router)
    minimal.include_router(myplanning_router)
    minimal.include_router(youtube_router)
    app.include_router(minimal)
    logger.info("PRODUCT_MODE=myplanning -> mounted auth/notifications/myplanning only")
else:
    # Only include module routers (health, etc.) at root; feature APIs live under /plusbook
    app.include_router(innova_router)
    app.include_router(pieagency_router)
    app.include_router(farmlink_router)
    app.include_router(sante_router)
    app.include_router(rag_router)
    app.include_router(chatlaya_router)

    # Mount API routes at root; /innova/api prefix is normalized by middleware.
    innova_api = APIRouter(prefix="")
    # Legacy INNOVA core lists (domains/contributors/technologies) disabled
    # innova_api.include_router(innova_core_router)
    innova_api.include_router(opportunities_router)
    innova_api.include_router(market_router)
    innova_api.include_router(meet_router)
    innova_api.include_router(me_router)
    innova_api.include_router(notifications_router)
    innova_api.include_router(metrics_router)
    innova_api.include_router(email_router)
    innova_api.include_router(invite_router)
    innova_api.include_router(engine_router)
    innova_api.include_router(profiles_router)
    innova_api.include_router(profiles_v1_router)
    innova_api.include_router(missions_router)
    innova_api.include_router(studio_router)
    innova_api.include_router(myplanning_router)
    innova_api.include_router(skills_router)
    innova_api.include_router(studio_missions_router.router)
    innova_api.include_router(school_router.router)
    innova_api.include_router(module6_router)
    innova_api.include_router(youtube_router)
    innova_api.include_router(auth_router)
    app.include_router(innova_api)
    innova_rag = APIRouter(prefix="/innova")
    innova_rag.include_router(rag_router)
    app.include_router(innova_rag)

    # Serve public storage similar to Laravel's /storage symlink
    app.mount("/storage", StaticFiles(directory="storage/public"), name="storage")

    # Mount the same API under /plusbook prefix for unified gateway
    plusbook = APIRouter(prefix="/plusbook")
    plusbook.include_router(ebooks_router)
    plusbook.include_router(posts_router)
    plusbook.include_router(messages_router)
    plusbook.include_router(groups_router)
    plusbook.include_router(contact_router)
    plusbook.include_router(diag_router)

    @plusbook.get("/health")
    async def plusbook_health(db: AsyncIOMotorDatabase = Depends(get_db)):
        ok = False
        try:
            await db.command("ping")
            ok = True
        except Exception:
            ok = False
        return {"status": "ok" if ok else "down", "db": settings.DB_NAME, "mongo": ok}

    app.include_router(plusbook)
