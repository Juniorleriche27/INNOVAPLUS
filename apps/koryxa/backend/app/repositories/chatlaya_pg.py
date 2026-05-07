from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from uuid import uuid4

from app.services.postgres_bootstrap import db_execute, db_fetchall, db_fetchone


def _owner_where_clause(*, user_id: str | None, guest_id: str | None) -> tuple[str, tuple[Any, ...]]:
    if user_id:
        return "user_id = %s::uuid", (user_id,)
    if guest_id:
        return "guest_id = %s", (guest_id,)
    raise ValueError("user_id or guest_id is required")


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


def _normalize_problem_report(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    for key in ("id", "conversation_id", "message_id", "user_id"):
        if row.get(key) is not None:
            row[key] = str(row[key])
    raw_payload = row.get("raw_payload")
    if isinstance(raw_payload, str):
        try:
            row["raw_payload"] = json.loads(raw_payload)
        except Exception:
            row["raw_payload"] = {}
    elif raw_payload is None:
        row["raw_payload"] = {}
    return row


def get_latest_active_conversation(*, user_id: str | None, guest_id: str | None) -> dict[str, Any] | None:
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    row = db_fetchone(
        f"""
        select id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at
        from app.chatlaya_conversations
        where {where_sql}
          and archived = false
        order by updated_at desc
        limit 1;
        """,
        params,
    )
    return _normalize_conversation(row)


def create_conversation(
    *,
    user_id: str | None,
    guest_id: str | None,
    title: str,
    assistant_mode: str,
    now: datetime,
) -> dict[str, Any]:
    conversation_id = str(uuid4())
    row = db_fetchone(
        """
        insert into app.chatlaya_conversations(
          id, guest_id, user_id, title, assistant_mode, archived, created_at, updated_at
        )
        values (%s::uuid, %s, %s::uuid, %s, %s, false, %s, %s)
        returning id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at;
        """,
        (conversation_id, guest_id, user_id, title, assistant_mode, now, now),
    )
    return _normalize_conversation(row) or {}


def list_conversations(
    *,
    user_id: str | None,
    guest_id: str | None,
    limit: int,
    offset: int,
) -> list[dict[str, Any]]:
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    rows = db_fetchall(
        f"""
        select id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at
        from app.chatlaya_conversations
        where {where_sql}
          and archived = false
        order by updated_at desc
        limit %s offset %s;
        """,
        (*params, limit, offset),
    )
    return [_normalize_conversation(row) for row in rows if row]


def get_conversation(
    *,
    conversation_id: str,
    user_id: str | None,
    guest_id: str | None,
) -> dict[str, Any] | None:
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    row = db_fetchone(
        f"""
        select id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at
        from app.chatlaya_conversations
        where id = %s::uuid
          and {where_sql}
        limit 1;
        """,
        (conversation_id, *params),
    )
    return _normalize_conversation(row)


def get_message(
    *,
    message_id: str,
    user_id: str | None,
    guest_id: str | None,
) -> dict[str, Any] | None:
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    row = db_fetchone(
        f"""
        select id::text as id, conversation_id::text as conversation_id, guest_id, user_id::text as user_id, role, content, meta, created_at
        from app.chatlaya_messages
        where id = %s::uuid
          and {where_sql}
        limit 1;
        """,
        (message_id, *params),
    )
    return _normalize_message(row)


def update_conversation_mode(
    *,
    conversation_id: str,
    user_id: str | None,
    guest_id: str | None,
    assistant_mode: str,
    updated_at: datetime,
) -> dict[str, Any] | None:
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    row = db_fetchone(
        f"""
        update app.chatlaya_conversations
        set assistant_mode = %s,
            updated_at = %s
        where id = %s::uuid
          and {where_sql}
        returning id::text as id, guest_id, user_id::text as user_id, title, assistant_mode, archived, created_at, updated_at;
        """,
        (assistant_mode, updated_at, conversation_id, *params),
    )
    return _normalize_conversation(row)


def archive_conversation(
    *,
    conversation_id: str,
    user_id: str | None,
    guest_id: str | None,
    updated_at: datetime,
) -> bool:
    where_sql, params = _owner_where_clause(user_id=user_id, guest_id=guest_id)
    row = db_fetchone(
        f"""
        update app.chatlaya_conversations
        set archived = true,
            updated_at = %s
        where id = %s::uuid
          and {where_sql}
        returning id::text as id;
        """,
        (updated_at, conversation_id, *params),
    )
    return bool(row)


def touch_conversation(
    *,
    conversation_id: str,
    title: str,
    updated_at: datetime,
) -> None:
    db_execute(
        """
        update app.chatlaya_conversations
        set title = %s,
            updated_at = %s
        where id = %s::uuid;
        """,
        (title, updated_at, conversation_id),
    )


def create_message(
    *,
    conversation_id: str,
    role: str,
    content: str,
    user_id: str | None,
    guest_id: str | None,
    meta: dict[str, Any] | None,
    created_at: datetime,
) -> dict[str, Any]:
    message_id = str(uuid4())
    row = db_fetchone(
        """
        insert into app.chatlaya_messages(
          id, conversation_id, guest_id, user_id, role, content, meta, created_at
        )
        values (%s::uuid, %s::uuid, %s, %s::uuid, %s, %s, %s::jsonb, %s)
        returning id::text as id, conversation_id::text as conversation_id, guest_id, user_id::text as user_id, role, content, meta, created_at;
        """,
        (message_id, conversation_id, guest_id, user_id, role, content, json.dumps(meta or {}), created_at),
    )
    return _normalize_message(row) or {}


def list_messages(*, conversation_id: str) -> list[dict[str, Any]]:
    rows = db_fetchall(
        """
        select id::text as id, conversation_id::text as conversation_id, guest_id, user_id::text as user_id, role, content, meta, created_at
        from app.chatlaya_messages
        where conversation_id = %s::uuid
        order by created_at asc;
        """,
        (conversation_id,),
    )
    return [_normalize_message(row) for row in rows if row]


def list_recent_messages(*, conversation_id: str, limit: int) -> list[dict[str, Any]]:
    rows = db_fetchall(
        """
        select id::text as id, conversation_id::text as conversation_id, guest_id, user_id::text as user_id, role, content, meta, created_at
        from app.chatlaya_messages
        where conversation_id = %s::uuid
        order by created_at desc
        limit %s;
        """,
        (conversation_id, limit),
    )
    rows.reverse()
    return [_normalize_message(row) for row in rows if row]


def create_problem_report(
    *,
    user_id: str | None,
    conversation_id: str | None,
    message_id: str | None,
    country: str,
    region: str | None,
    city: str | None,
    commune: str | None,
    zone_type: str | None,
    domain: str,
    sector: str | None,
    problem_title: str | None,
    problem_description: str,
    affected_population: str | None,
    severity: str | None,
    frequency: str | None,
    perceived_cause: str | None,
    proposed_solution: str | None,
    evidence_type: str | None,
    consent_anonymized: bool,
    source_channel: str,
    raw_payload: dict[str, Any],
) -> dict[str, Any]:
    row = db_fetchone(
        """
        insert into app.problem_reports(
          user_id,
          conversation_id,
          message_id,
          country,
          region,
          city,
          commune,
          zone_type,
          domain,
          sector,
          problem_title,
          problem_description,
          affected_population,
          severity,
          frequency,
          perceived_cause,
          proposed_solution,
          evidence_type,
          consent_anonymized,
          source_channel,
          raw_payload
        )
        values (
          %s::uuid,
          %s::uuid,
          %s::uuid,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s,
          %s::jsonb
        )
        returning
          id::text as id,
          conversation_id::text as conversation_id,
          message_id::text as message_id,
          user_id::text as user_id,
          country,
          region,
          city,
          commune,
          zone_type,
          domain,
          sector,
          problem_title,
          problem_description,
          affected_population,
          severity,
          frequency,
          perceived_cause,
          proposed_solution,
          evidence_type,
          consent_anonymized,
          source_channel,
          raw_payload,
          status,
          created_at,
          updated_at;
        """,
        (
            user_id,
            conversation_id,
            message_id,
            country,
            region,
            city,
            commune,
            zone_type,
            domain,
            sector,
            problem_title,
            problem_description,
            affected_population,
            severity,
            frequency,
            perceived_cause,
            proposed_solution,
            evidence_type,
            consent_anonymized,
            source_channel,
            json.dumps(raw_payload or {}),
        ),
    )
    return _normalize_problem_report(row) or {}
