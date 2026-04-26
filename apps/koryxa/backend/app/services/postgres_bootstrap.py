from __future__ import annotations

import logging
import os
from typing import Any

from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

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


def ensure_chatlaya_tables() -> None:
    if not POOL:
        return
    db_execute("create schema if not exists app;")
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
