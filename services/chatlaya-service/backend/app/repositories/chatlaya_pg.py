from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from uuid import uuid4

import asyncpg

from app.services.postgres_bootstrap import get_pool


def _owner_where_clause(
    *,
    user_id: str | None,
    guest_id: str | None,
    start_index: int = 1,
) -> tuple[str, tuple[Any, ...]]:
    if user_id:
        return f"user_id = ${start_index}::uuid", (user_id,)
    if guest_id:
        return f"guest_id = ${start_index}", (guest_id,)
    raise ValueError("user_id or guest_id is required")


def _get_pool_or_raise() -> asyncpg.Pool:
    pool = get_pool()
    if pool is None:
        raise RuntimeError("chatlaya-service Postgres pool is not initialized")
    return pool


def _record_to_dict(row: asyncpg.Record | dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


def _normalize_conversation(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["_id"] = row["id"]
    return row


def _normalize_message(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["_id"] = row["id"]
    meta = row.get("meta")
    if isinstance(meta, str):
        try:
            row["meta"] = json.loads(meta)
        except Exception:
            row["meta"] = {}
    elif meta is None:
        row["meta"] = {}
    return row


async def get_latest_active_conversation(*, user_id: str | None, guest_id: str | None) -> dict[str, Any] | None:
    pool = _get_pool_or_raise()
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
        select id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at
        from app.chatlaya_conversations
        where {where_sql}
          and archived = false
        order by updated_at desc
        limit 1;
        """,
            *params,
        )
    return _normalize_conversation(_record_to_dict(row))


async def create_conversation(
    *,
    user_id: str | None,
    guest_id: str | None,
    title: str,
    assistant_mode: str,
    now: datetime,
) -> dict[str, Any]:
    pool = _get_pool_or_raise()
    conversation_id = str(uuid4())
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
        insert into app.chatlaya_conversations(
          id, guest_id, user_id, title, assistant_mode, archived, created_at, updated_at
        )
        values ($1::uuid, $2, $3::uuid, $4, $5, false, $6, $7)
        returning id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at;
        """,
            conversation_id,
            guest_id,
            user_id,
            title,
            assistant_mode,
            now,
            now,
        )
    return _normalize_conversation(_record_to_dict(row)) or {}


async def list_conversations(
    *,
    user_id: str | None,
    guest_id: str | None,
    limit: int,
    offset: int,
) -> list[dict[str, Any]]:
    pool = _get_pool_or_raise()
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
        select id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at
        from app.chatlaya_conversations
        where {where_sql}
          and archived = false
        order by updated_at desc
        limit ${len(params) + 1} offset ${len(params) + 2};
        """,
            *params,
            limit,
            offset,
        )
    return [_normalize_conversation(_record_to_dict(row)) for row in rows if row]


async def get_conversation(
    *,
    conversation_id: str,
    user_id: str | None,
    guest_id: str | None,
) -> dict[str, Any] | None:
    pool = _get_pool_or_raise()
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id, start_index=2)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
        select id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at
        from app.chatlaya_conversations
        where id = $1::uuid
          and {where_sql}
        limit 1;
        """,
            conversation_id,
            *params,
        )
    return _normalize_conversation(_record_to_dict(row))


async def update_conversation_mode(
    *,
    conversation_id: str,
    user_id: str | None,
    guest_id: str | None,
    assistant_mode: str,
    updated_at: datetime,
) -> dict[str, Any] | None:
    pool = _get_pool_or_raise()
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id, start_index=4)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
        update app.chatlaya_conversations
        set assistant_mode = $1,
            updated_at = $2
        where id = $3::uuid
          and {where_sql}
        returning id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at;
        """,
            assistant_mode,
            updated_at,
            conversation_id,
            *params,
        )
    return _normalize_conversation(_record_to_dict(row))


async def archive_conversation(
    *,
    conversation_id: str,
    user_id: str | None,
    guest_id: str | None,
    updated_at: datetime,
) -> bool:
    pool = _get_pool_or_raise()
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id, start_index=3)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
        update app.chatlaya_conversations
        set archived = true,
            updated_at = $1
        where id = $2::uuid
          and {where_sql}
        returning id::text as id;
        """,
            updated_at,
            conversation_id,
            *params,
        )
    return bool(row)


async def touch_conversation(
    *,
    conversation_id: str,
    title: str,
    updated_at: datetime,
) -> None:
    pool = _get_pool_or_raise()
    async with pool.acquire() as conn:
        await conn.execute(
            """
        update app.chatlaya_conversations
        set title = $1,
            updated_at = $2
        where id = $3::uuid;
        """,
            title,
            updated_at,
            conversation_id,
        )


async def create_message(
    *,
    conversation_id: str,
    role: str,
    content: str,
    user_id: str | None,
    guest_id: str | None,
    meta: dict[str, Any] | None,
    created_at: datetime,
) -> dict[str, Any]:
    pool = _get_pool_or_raise()
    message_id = str(uuid4())
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
        insert into app.chatlaya_messages(
          id, conversation_id, guest_id, user_id, role, content, meta, created_at
        )
        values ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6, $7::jsonb, $8)
        returning id::text as id, conversation_id::text as conversation_id, guest_id, user_id::text as user_id, role, content, meta, created_at;
        """,
            message_id,
            conversation_id,
            guest_id,
            user_id,
            role,
            content,
            json.dumps(meta or {}, default=str),
            created_at,
        )
    return _normalize_message(_record_to_dict(row)) or {}


async def list_messages(*, conversation_id: str) -> list[dict[str, Any]]:
    pool = _get_pool_or_raise()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
        select id::text as id, conversation_id::text as conversation_id, guest_id, user_id::text as user_id, role, content, meta, created_at
        from app.chatlaya_messages
        where conversation_id = $1::uuid
        order by created_at asc;
        """,
            conversation_id,
        )
    return [_normalize_message(_record_to_dict(row)) for row in rows if row]


async def list_recent_messages(*, conversation_id: str, limit: int) -> list[dict[str, Any]]:
    pool = _get_pool_or_raise()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
        select id::text as id, conversation_id::text as conversation_id, guest_id, user_id::text as user_id, role, content, meta, created_at
        from app.chatlaya_messages
        where conversation_id = $1::uuid
        order by created_at desc
        limit $2;
        """,
            conversation_id,
            limit,
        )
    rows.reverse()
    return [_normalize_message(_record_to_dict(row)) for row in rows if row]
