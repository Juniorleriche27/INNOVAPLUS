from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from app.services.postgres_bootstrap import db_execute, db_fetchall, db_fetchone


def _json_load(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default
    return default


def _normalize_need(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["_id"] = row["id"]
    return row


def _normalize_mission(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["_id"] = row["id"]
    row["steps"] = _json_load(row.get("steps"), [])
    return row


def _normalize_opportunity(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["_id"] = row["id"]
    row["highlights"] = _json_load(row.get("highlights"), [])
    return row


def create_need(*, payload: dict[str, Any], guest_id: str | None, user_id: str | None, now: datetime) -> dict[str, Any]:
    row = db_fetchone(
        """
        insert into app.enterprise_needs(
          guest_id, user_id, title, company_name, primary_goal, need_type, expected_result, urgency,
          treatment_preference, recommended_treatment_mode, team_context, support_preference, short_brief,
          status, qualification_score, clarity_level, structured_summary, next_recommended_action, created_at, updated_at
        )
        values (
          %s, %s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        returning id::text as id, guest_id, user_id::text as user_id, title, company_name, primary_goal, need_type,
                  expected_result, urgency, treatment_preference, recommended_treatment_mode, team_context, support_preference,
                  short_brief, status, qualification_score, clarity_level, structured_summary, next_recommended_action,
                  created_at, updated_at;
        """,
        (
            guest_id,
            user_id,
            payload["title"],
            payload["company_name"],
            payload["primary_goal"],
            payload["need_type"],
            payload["expected_result"],
            payload["urgency"],
            payload["treatment_preference"],
            payload["recommended_treatment_mode"],
            payload["team_context"],
            payload["support_preference"],
            payload.get("short_brief"),
            payload["status"],
            payload["qualification_score"],
            payload["clarity_level"],
            payload["structured_summary"],
            payload["next_recommended_action"],
            now,
            now,
        ),
    )
    return _normalize_need(row) or {}


def create_mission(*, need_id: str, guest_id: str | None, user_id: str | None, payload: dict[str, Any], status: str, now: datetime) -> dict[str, Any]:
    row = db_fetchone(
        """
        insert into app.enterprise_missions(
          need_id, guest_id, user_id, title, summary, deliverable, execution_mode, status, steps, created_at, updated_at
        )
        values (%s::uuid, %s, %s::uuid, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
        returning id::text as id, need_id::text as need_id, guest_id, user_id::text as user_id, title, summary, deliverable, execution_mode, status, steps, created_at, updated_at;
        """,
        (need_id, guest_id, user_id, payload["title"], payload["summary"], payload["deliverable"], payload["execution_mode"], status, json.dumps(payload["steps"]), now, now),
    )
    return _normalize_mission(row) or {}


def create_opportunity(*, need_id: str, mission_id: str, payload: dict[str, Any], status: str, now: datetime) -> dict[str, Any]:
    row = db_fetchone(
        """
        insert into app.enterprise_opportunities(
          need_id, mission_id, type, title, summary, status, highlights, published_at, created_at, updated_at
        )
        values (%s::uuid, %s::uuid, %s, %s, %s, %s, %s::jsonb, %s, %s, %s)
        returning id::text as id, need_id::text as need_id, mission_id::text as mission_id, type, title, summary, status, highlights, published_at, created_at, updated_at;
        """,
        (need_id, mission_id, payload["type"], payload["title"], payload["summary"], status, json.dumps(payload["highlights"]), now, now, now),
    )
    return _normalize_opportunity(row) or {}


def get_need_for_user(need_id: str, user_id: str) -> dict[str, Any] | None:
    return _normalize_need(db_fetchone("select id::text as id, guest_id, user_id::text as user_id, title, company_name, primary_goal, need_type, expected_result, urgency, treatment_preference, recommended_treatment_mode, team_context, support_preference, short_brief, status, qualification_score, clarity_level, structured_summary, next_recommended_action, created_at, updated_at from app.enterprise_needs where id = %s::uuid and user_id = %s::uuid limit 1;", (need_id, user_id)))


def get_need_for_guest(need_id: str, guest_id: str) -> dict[str, Any] | None:
    return _normalize_need(db_fetchone("select id::text as id, guest_id, user_id::text as user_id, title, company_name, primary_goal, need_type, expected_result, urgency, treatment_preference, recommended_treatment_mode, team_context, support_preference, short_brief, status, qualification_score, clarity_level, structured_summary, next_recommended_action, created_at, updated_at from app.enterprise_needs where id = %s::uuid and guest_id = %s limit 1;", (need_id, guest_id)))


def claim_need_for_user(need_id: str, user_id: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        update app.enterprise_needs
        set user_id = %s::uuid, updated_at = timezone('utc', now())
        where id = %s::uuid and user_id is null
        returning id::text as id, guest_id, user_id::text as user_id, title, company_name, primary_goal, need_type, expected_result, urgency, treatment_preference, recommended_treatment_mode, team_context, support_preference, short_brief, status, qualification_score, clarity_level, structured_summary, next_recommended_action, created_at, updated_at;
        """,
        (user_id, need_id),
    )
    return _normalize_need(row)


def sync_need_related_user(need_id: str, user_id: str) -> None:
    db_execute("update app.enterprise_missions set user_id = %s::uuid, updated_at = timezone('utc', now()) where need_id = %s::uuid and user_id is distinct from %s::uuid;", (user_id, need_id, user_id))
    db_execute("update app.enterprise_opportunities set user_id = %s::uuid, updated_at = timezone('utc', now()) where need_id = %s::uuid and user_id is distinct from %s::uuid;", (user_id, need_id, user_id))


def list_user_needs(user_id: str) -> list[dict[str, Any]]:
    return [_normalize_need(r) for r in db_fetchall("select id::text as id, guest_id, user_id::text as user_id, title, company_name, primary_goal, need_type, expected_result, urgency, treatment_preference, recommended_treatment_mode, team_context, support_preference, short_brief, status, qualification_score, clarity_level, structured_summary, next_recommended_action, created_at, updated_at from app.enterprise_needs where user_id = %s::uuid order by created_at desc limit 50;", (user_id,)) if r]


def get_mission_for_need(need_id: str) -> dict[str, Any] | None:
    return _normalize_mission(db_fetchone("select id::text as id, need_id::text as need_id, guest_id, user_id::text as user_id, title, summary, deliverable, execution_mode, status, steps, created_at, updated_at from app.enterprise_missions where need_id = %s::uuid limit 1;", (need_id,)))


def get_opportunity_for_need(need_id: str) -> dict[str, Any] | None:
    return _normalize_opportunity(db_fetchone("select id::text as id, need_id::text as need_id, mission_id::text as mission_id, user_id::text as user_id, type, title, summary, status, highlights, published_at, created_at, updated_at from app.enterprise_opportunities where need_id = %s::uuid limit 1;", (need_id,)))


def list_public_opportunities() -> list[dict[str, Any]]:
    return [_normalize_opportunity(r) for r in db_fetchall("select id::text as id, need_id::text as need_id, mission_id::text as mission_id, user_id::text as user_id, type, title, summary, status, highlights, published_at, created_at, updated_at from app.enterprise_opportunities where status = 'published' order by published_at desc nulls last limit 24;") if r]


def list_task_bindings(need_id: str, user_id: str) -> list[dict[str, Any]]:
    return db_fetchall("select id::text as id, need_id::text as need_id, user_id::text as user_id, context_id, step_key, step_title, created_at, updated_at from app.enterprise_task_bindings where need_id = %s::uuid and user_id = %s::uuid order by created_at asc;", (need_id, user_id))


def create_task_binding(*, need_id: str, user_id: str, context_id: str, step_key: str, step_title: str, now: datetime) -> dict[str, Any] | None:
    return db_fetchone(
        """
        insert into app.enterprise_task_bindings(need_id, user_id, context_id, step_key, step_title, created_at, updated_at)
        values (%s::uuid, %s::uuid, %s, %s, %s, %s, %s)
        on conflict (need_id, user_id, step_key) do update
        set context_id = excluded.context_id, step_title = excluded.step_title, updated_at = excluded.updated_at
        returning id::text as id, need_id::text as need_id, user_id::text as user_id, context_id, step_key, step_title, created_at, updated_at;
        """,
        (need_id, user_id, context_id, step_key, step_title, now, now),
    )
