from __future__ import annotations

import logging
import os
import json
from typing import Any

from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from app.services.formation_seed import FORMATION_MODULES, FORMATION_RESOURCES, FORMATION_TRACKS

logger = logging.getLogger(__name__)
POOL: SimpleConnectionPool | None = None


def _resolve_database_url() -> str:
    return (os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DATABASE_URL") or "").strip()

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
    dsn = _resolve_database_url()
    if not dsn:
        logger.warning("DATABASE_URL/SUPABASE_DATABASE_URL is not set; postgres-backed features are disabled")
        return
    dsn = _dsn_with_supabase_defaults(dsn)
    try:
        POOL = SimpleConnectionPool(
            minconn=int(os.environ.get("PGPOOL_MIN", "1")),
            maxconn=int(os.environ.get("PGPOOL_MAX", "5")),
            dsn=dsn,
        )
    except Exception as exc:  # noqa: BLE001
        POOL = None
        logger.warning("Postgres pool init failed; postgres-backed features are disabled: %s", exc)


def close_pg_pool() -> None:
    global POOL
    if POOL:
        POOL.closeall()
        POOL = None


def pg_pool_ready() -> bool:
    return POOL is not None


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


def _pg_relation_exists(qualified_name: str) -> bool:
    row = db_fetchone(
        "select to_regclass(%s)::text as relation_name;",
        (qualified_name,),
    )
    return bool(row and row.get("relation_name"))


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
          source_page text not null default '/entreprise',
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


def ensure_auth_tables() -> None:
    if not POOL:
        return
    db_execute("create extension if not exists pgcrypto;")
    db_execute("create schema if not exists app;")
    db_execute(
        """
        create or replace function app.set_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin
          new.updated_at = timezone('utc', now());
          return new;
        end;
        $$;
        """
    )
    db_execute(
        """
        create table if not exists app.auth_users (
          id uuid primary key default gen_random_uuid(),
          email text not null unique,
          google_subject text null unique,
          password_hash text not null,
          first_name text not null,
          last_name text not null,
          country text null,
          account_type text null check (account_type in ('learner', 'company', 'organization')),
          workspace_role text null check (workspace_role in ('demandeur', 'prestataire')),
          plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
          roles jsonb not null default '["user"]'::jsonb,
          password_updated_at timestamptz null,
          created_at timestamptz not null default timezone('utc', now()),
          updated_at timestamptz not null default timezone('utc', now())
        );
        """
    )
    db_execute(
        "alter table app.auth_users add column if not exists google_subject text;"
    )
    db_execute(
        "create unique index if not exists auth_users_email_lower_key on app.auth_users ((lower(email)));"
    )
    db_execute(
        "create unique index if not exists auth_users_google_subject_key on app.auth_users (google_subject) where google_subject is not null;"
    )
    db_execute("drop trigger if exists trg_auth_users_updated_at on app.auth_users;")
    db_execute(
        """
        create trigger trg_auth_users_updated_at
        before update on app.auth_users
        for each row execute function app.set_updated_at();
        """
    )
    db_execute(
        """
        create table if not exists app.sessions (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references app.auth_users(id) on delete cascade,
          token_hash text not null unique,
          issued_at timestamptz not null default timezone('utc', now()),
          expires_at timestamptz not null,
          revoked boolean not null default false,
          ip text null,
          ua text null,
          last_seen_at timestamptz not null default timezone('utc', now())
        );
        """
    )
    db_execute(
        "create index if not exists sessions_user_revoked_idx on app.sessions (user_id, revoked, expires_at desc);"
    )
    db_execute(
        """
        create table if not exists app.login_otps (
          id uuid primary key default gen_random_uuid(),
          email text not null,
          code_hash text not null,
          intent text not null default 'login',
          meta jsonb not null default '{}'::jsonb,
          expires_at timestamptz not null,
          consumed_at timestamptz null,
          created_at timestamptz not null default timezone('utc', now())
        );
        """
    )
    db_execute(
        "alter table app.login_otps add column if not exists meta jsonb not null default '{}'::jsonb;"
    )
    db_execute(
        "create index if not exists login_otps_email_created_idx on app.login_otps (lower(email), created_at desc);"
    )


def ensure_chatlaya_tables() -> None:
    if not POOL:
        return
    ensure_auth_tables()
    db_execute(
        """
        create table if not exists app.chatlaya_conversations (
          id uuid primary key,
          guest_id text,
          user_id uuid references app.auth_users(id) on delete cascade,
          title text not null default 'Nouvelle conversation',
          assistant_mode text not null default 'general',
          archived boolean not null default false,
          created_at timestamptz not null default timezone('utc', now()),
          updated_at timestamptz not null default timezone('utc', now()),
          constraint chatlaya_conversations_owner_check
            check (
              (user_id is not null and guest_id is null)
              or (user_id is null and guest_id is not null)
            )
        );
        """
    )
    db_execute(
        """
        create table if not exists app.chatlaya_messages (
          id uuid primary key,
          conversation_id uuid not null references app.chatlaya_conversations(id) on delete cascade,
          guest_id text,
          user_id uuid references app.auth_users(id) on delete cascade,
          role text not null,
          content text not null,
          meta jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default timezone('utc', now()),
          constraint chatlaya_messages_role_check check (role in ('user', 'assistant'))
        );
        """
    )
    db_execute(
        "create index if not exists idx_chatlaya_conversations_user_updated_at on app.chatlaya_conversations (user_id, updated_at desc) where archived = false;"
    )
    db_execute(
        "create index if not exists idx_chatlaya_conversations_guest_updated_at on app.chatlaya_conversations (guest_id, updated_at desc) where archived = false;"
    )
    db_execute(
        "create index if not exists idx_chatlaya_messages_conversation_created_at on app.chatlaya_messages (conversation_id, created_at asc);"
    )


def ensure_formation_tables() -> None:
    if not POOL:
        return
    ensure_auth_tables()
    db_execute(
        """
        create table if not exists app.formation_tracks (
          id uuid primary key default gen_random_uuid(),
          track_key text not null unique,
          title text not null,
          summary text not null,
          description text not null,
          domain text null,
          difficulty text null,
          estimated_duration text null,
          skills jsonb not null default '[]'::jsonb,
          is_published boolean not null default false,
          created_at timestamptz not null default timezone('utc', now()),
          updated_at timestamptz not null default timezone('utc', now())
        );
        """
    )
    db_execute(
        """
        create table if not exists app.formation_modules (
          id uuid primary key default gen_random_uuid(),
          track_id uuid not null references app.formation_tracks(id) on delete cascade,
          module_key text not null unique,
          title text not null,
          description text not null,
          order_index integer not null default 0,
          duration text null,
          notebook_path text null,
          lesson_count integer not null default 0,
          skills jsonb not null default '[]'::jsonb,
          is_published boolean not null default false,
          created_at timestamptz not null default timezone('utc', now()),
          updated_at timestamptz not null default timezone('utc', now()),
          constraint formation_modules_order_unique unique (track_id, order_index)
        );
        """
    )
    db_execute(
        """
        create table if not exists app.formation_module_resources (
          id uuid primary key default gen_random_uuid(),
          module_id uuid not null references app.formation_modules(id) on delete cascade,
          title text not null,
          url text not null,
          resource_type text not null check (resource_type in ('document', 'notebook', 'dataset', 'video', 'article')),
          description text null,
          order_index integer not null default 0,
          created_at timestamptz not null default timezone('utc', now()),
          constraint formation_module_resources_unique unique (module_id, url)
        );
        """
    )
    db_execute(
        """
        create table if not exists app.formation_progress (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references app.auth_users(id) on delete cascade,
          track_id uuid not null references app.formation_tracks(id) on delete cascade,
          module_id uuid not null references app.formation_modules(id) on delete cascade,
          completed boolean not null default false,
          completed_at timestamptz null,
          created_at timestamptz not null default timezone('utc', now()),
          updated_at timestamptz not null default timezone('utc', now()),
          constraint formation_progress_user_module_unique unique (user_id, module_id)
        );
        """
    )
    db_execute(
        """
        create table if not exists app.formation_certificates (
          id uuid primary key default gen_random_uuid(),
          track_id uuid not null references app.formation_tracks(id) on delete cascade,
          user_id uuid not null references app.auth_users(id) on delete cascade,
          issued_at timestamptz not null default timezone('utc', now()),
          certificate_url text null,
          created_at timestamptz not null default timezone('utc', now()),
          updated_at timestamptz not null default timezone('utc', now()),
          constraint formation_certificates_user_track_unique unique (user_id, track_id)
        );
        """
    )
    db_execute(
        "create index if not exists idx_formation_tracks_published on app.formation_tracks (is_published, created_at desc);"
    )
    db_execute(
        "create index if not exists idx_formation_modules_track_order on app.formation_modules (track_id, order_index asc);"
    )
    db_execute(
        "create index if not exists idx_formation_resources_module_order on app.formation_module_resources (module_id, order_index asc);"
    )
    db_execute(
        "create index if not exists idx_formation_progress_user_track on app.formation_progress (user_id, track_id, updated_at desc);"
    )
    db_execute(
        "create index if not exists idx_formation_certificates_user on app.formation_certificates (user_id, issued_at desc);"
    )
    db_execute("drop trigger if exists trg_formation_tracks_updated_at on app.formation_tracks;")
    db_execute(
        """
        create trigger trg_formation_tracks_updated_at
        before update on app.formation_tracks
        for each row execute function app.set_updated_at();
        """
    )
    db_execute("drop trigger if exists trg_formation_modules_updated_at on app.formation_modules;")
    db_execute(
        """
        create trigger trg_formation_modules_updated_at
        before update on app.formation_modules
        for each row execute function app.set_updated_at();
        """
    )
    db_execute("drop trigger if exists trg_formation_progress_updated_at on app.formation_progress;")
    db_execute(
        """
        create trigger trg_formation_progress_updated_at
        before update on app.formation_progress
        for each row execute function app.set_updated_at();
        """
    )
    db_execute("drop trigger if exists trg_formation_certificates_updated_at on app.formation_certificates;")
    db_execute(
        """
        create trigger trg_formation_certificates_updated_at
        before update on app.formation_certificates
        for each row execute function app.set_updated_at();
        """
    )

    for track in FORMATION_TRACKS:
        db_execute(
            """
            insert into app.formation_tracks(
              track_key, title, summary, description, domain, difficulty, estimated_duration, skills, is_published
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
            on conflict (track_key) do update
            set title = excluded.title,
                summary = excluded.summary,
                description = excluded.description,
                domain = excluded.domain,
                difficulty = excluded.difficulty,
                estimated_duration = excluded.estimated_duration,
                skills = excluded.skills,
                is_published = excluded.is_published;
            """,
            (
                track["track_key"],
                track["title"],
                track["summary"],
                track["description"],
                track.get("domain"),
                track.get("difficulty"),
                track.get("estimated_duration"),
                json.dumps(track.get("skills") or []),
                bool(track.get("is_published", False)),
            ),
        )

    for module in FORMATION_MODULES:
        db_execute(
            """
            insert into app.formation_modules(
              track_id, module_key, title, description, order_index, duration, notebook_path, lesson_count, skills, is_published
            )
            select
              t.id,
              %s,
              %s,
              %s,
              %s,
              %s,
              %s,
              %s,
              %s::jsonb,
              %s
            from app.formation_tracks t
            where t.track_key = %s
            on conflict (module_key) do update
            set title = excluded.title,
                description = excluded.description,
                order_index = excluded.order_index,
                duration = excluded.duration,
                notebook_path = excluded.notebook_path,
                lesson_count = excluded.lesson_count,
                skills = excluded.skills,
                is_published = excluded.is_published;
            """,
            (
                module["module_key"],
                module["title"],
                module["description"],
                int(module.get("order_index") or 0),
                module.get("duration"),
                module.get("notebook_path"),
                int(module.get("lesson_count") or 0),
                json.dumps(module.get("skills") or []),
                bool(module.get("is_published", False)),
                module["track_key"],
            ),
        )

    for resource in FORMATION_RESOURCES:
        db_execute(
            """
            insert into app.formation_module_resources(
              module_id, title, url, resource_type, description, order_index
            )
            select
              m.id,
              %s,
              %s,
              %s,
              %s,
              %s
            from app.formation_modules m
            where m.module_key = %s
            on conflict (module_id, url) do update
            set title = excluded.title,
                resource_type = excluded.resource_type,
                description = excluded.description,
                order_index = excluded.order_index;
            """,
            (
                resource["title"],
                resource["url"],
                resource["resource_type"],
                resource.get("description"),
                int(resource.get("order_index") or 0),
                resource["module_key"],
            ),
        )
