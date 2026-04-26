from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from app.services.postgres_bootstrap import db_execute, db_fetchone


def _parse_roles(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(v) for v in parsed]
        except Exception:
            return [value]
    return ["user"]


def _normalize_user(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["_id"] = row["id"]
    row["roles"] = _parse_roles(row.get("roles"))
    return row


def get_user_by_email(email: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select id, email, password_hash, first_name, last_name, country,
               account_type, workspace_role, plan, roles, created_at, updated_at
        from app.auth_users
        where lower(email) = lower(%s)
        limit 1;
        """,
        (email,),
    )
    return _normalize_user(row)


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select id, email, password_hash, first_name, last_name, country,
               account_type, workspace_role, plan, roles, created_at, updated_at
        from app.auth_users
        where id = %s::uuid
        limit 1;
        """,
        (user_id,),
    )
    return _normalize_user(row)


def create_user(*, email: str, password_hash: str, first_name: str, last_name: str, country: str, account_type: str) -> dict[str, Any]:
    row = db_fetchone(
        """
        insert into app.auth_users(email, password_hash, first_name, last_name, country, account_type, roles, plan)
        values (%s, %s, %s, %s, %s, %s, '["user"]'::jsonb, 'free')
        returning id, email, password_hash, first_name, last_name, country,
                  account_type, workspace_role, plan, roles, created_at, updated_at;
        """,
        (email, password_hash, first_name, last_name, country, account_type),
    )
    return _normalize_user(row) or {}


def update_user_fields(user_id: str, *, first_name: str | None = None, last_name: str | None = None, workspace_role: str | None = None, password_hash: str | None = None) -> dict[str, Any] | None:
    assignments: list[str] = []
    params: list[Any] = []
    if first_name is not None:
        assignments.append("first_name = %s")
        params.append(first_name)
    if last_name is not None:
        assignments.append("last_name = %s")
        params.append(last_name)
    if workspace_role is not None:
        assignments.append("workspace_role = %s")
        params.append(workspace_role)
    if password_hash is not None:
        assignments.append("password_hash = %s")
        params.append(password_hash)
        assignments.append("password_updated_at = timezone('utc', now())")
    if not assignments:
        return get_user_by_id(user_id)
    params.append(user_id)
    row = db_fetchone(
        f"""
        update app.auth_users
        set {", ".join(assignments)}
        where id = %s::uuid
        returning id, email, password_hash, first_name, last_name, country,
                  account_type, workspace_role, plan, roles, created_at, updated_at;
        """,
        tuple(params),
    )
    return _normalize_user(row)


def upsert_dev_user(payload: dict[str, Any]) -> dict[str, Any]:
    row = db_fetchone(
        """
        insert into app.auth_users(email, password_hash, first_name, last_name, country, account_type, workspace_role, plan, roles)
        values (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
        on conflict (email) do update
        set password_hash = excluded.password_hash,
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            country = excluded.country,
            account_type = excluded.account_type,
            workspace_role = excluded.workspace_role,
            plan = excluded.plan,
            roles = excluded.roles
        returning id, email, password_hash, first_name, last_name, country,
                  account_type, workspace_role, plan, roles, created_at, updated_at;
        """,
        (
            payload["email"],
            payload["password_hash"],
            payload["first_name"],
            payload["last_name"],
            payload["country"],
            payload["account_type"],
            payload["workspace_role"],
            payload["plan"],
            json.dumps(payload["roles"]),
        ),
    )
    return _normalize_user(row) or {}


def create_session(*, user_id: str, token_hash: str, expires_at: datetime, ip: str | None, ua: str | None) -> None:
    db_execute(
        """
        insert into app.sessions(user_id, token_hash, issued_at, expires_at, revoked, ip, ua, last_seen_at)
        values (%s::uuid, %s, timezone('utc', now()), %s, false, %s, %s, timezone('utc', now()));
        """,
        (user_id, token_hash, expires_at, ip, ua),
    )


def get_active_session(token_hash: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select id, user_id::text as user_id, token_hash, issued_at, expires_at, revoked, ip, ua, last_seen_at
        from app.sessions
        where token_hash = %s
          and revoked = false
          and expires_at > timezone('utc', now())
        limit 1;
        """,
        (token_hash,),
    )
    return row


def touch_session(session_id: str) -> None:
    db_execute(
        "update app.sessions set last_seen_at = timezone('utc', now()) where id = %s::uuid;",
        (session_id,),
    )


def revoke_session_by_token(token_hash: str) -> None:
    db_execute(
        """
        update app.sessions
        set revoked = true, last_seen_at = timezone('utc', now())
        where token_hash = %s and revoked = false;
        """,
        (token_hash,),
    )


def revoke_sessions_for_user(user_id: str) -> None:
    db_execute(
        "update app.sessions set revoked = true, last_seen_at = timezone('utc', now()) where user_id = %s::uuid and revoked = false;",
        (user_id,),
    )


def upsert_otp(*, email: str, code_hash: str, expires_at: datetime, intent: str, meta: dict[str, Any] | None = None) -> None:
    db_execute(
        """
        insert into app.login_otps(email, code_hash, expires_at, intent, meta, created_at)
        values (%s, %s, %s, %s, %s::jsonb, timezone('utc', now()))
        on conflict (id) do nothing;
        """,
        (email, code_hash, expires_at, intent, json.dumps(meta or {})),
    )
    db_execute("delete from app.login_otps where lower(email) = lower(%s) and expires_at <= timezone('utc', now());", (email,))


def replace_otp(*, email: str, code_hash: str, expires_at: datetime, intent: str, meta: dict[str, Any] | None = None) -> None:
    db_execute("delete from app.login_otps where lower(email) = lower(%s);", (email,))
    upsert_otp(email=email, code_hash=code_hash, expires_at=expires_at, intent=intent, meta=meta)


def get_latest_otp(email: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select id, email, code_hash, expires_at, intent, meta, consumed_at, created_at
        from app.login_otps
        where lower(email) = lower(%s)
        order by created_at desc
        limit 1;
        """,
        (email,),
    )
    if row and isinstance(row.get("meta"), str):
        try:
            row["meta"] = json.loads(row["meta"])
        except Exception:
            row["meta"] = {}
    elif row and row.get("meta") is None:
        row["meta"] = {}
    return row


def delete_otp(otp_id: str) -> None:
    db_execute("delete from app.login_otps where id = %s::uuid;", (otp_id,))


def create_reset_token(*, user_id: str, token_hash: str, expires_at: datetime) -> None:
    db_execute(
        """
        insert into app.password_reset_tokens(user_id, token_hash, expires_at, used, created_at)
        values (%s::uuid, %s, %s, false, timezone('utc', now()));
        """,
        (user_id, token_hash, expires_at),
    )


def get_valid_reset_token(*, user_id: str, token_hash: str) -> dict[str, Any] | None:
    return db_fetchone(
        """
        select id, user_id::text as user_id, token_hash, expires_at, used, created_at
        from app.password_reset_tokens
        where user_id = %s::uuid
          and token_hash = %s
          and used = false
          and expires_at > timezone('utc', now())
        limit 1;
        """,
        (user_id, token_hash),
    )


def mark_reset_token_used(token_id: str) -> None:
    db_execute(
        "update app.password_reset_tokens set used = true where id = %s::uuid;",
        (token_id,),
    )
