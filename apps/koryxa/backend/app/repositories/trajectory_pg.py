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


def _normalize_flow(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["_id"] = row["id"]
    row["onboarding"] = _json_load(row.get("onboarding"), {})
    row["diagnostic"] = _json_load(row.get("diagnostic"), None)
    row["progress_plan"] = _json_load(row.get("progress_plan"), None)
    row["final_recommendation"] = _json_load(row.get("final_recommendation"), None)
    row["proofs"] = _json_load(row.get("proofs"), [])
    row["verified_profile"] = _json_load(row.get("verified_profile"), None)
    row["opportunity_targets"] = _json_load(row.get("opportunity_targets"), [])
    row["submitted_to_team"] = bool(row.get("submitted_to_team", False))
    return row


def create_flow(*, guest_id: str | None, user_id: str | None, onboarding: dict[str, Any], status: str, now: datetime) -> dict[str, Any]:
    row = db_fetchone(
        """
        insert into app.trajectory_flows(
          guest_id, user_id, status, onboarding, diagnostic, progress_plan, final_recommendation, submitted_to_team, proofs, verified_profile, opportunity_targets, created_at, updated_at
        )
        values (
          %s, %s::uuid, %s, %s::jsonb, null, null, null, false, '[]'::jsonb, null, '[]'::jsonb, %s, %s
        )
        returning id::text as id, guest_id, user_id::text as user_id, status, onboarding, diagnostic, progress_plan, final_recommendation, submitted_to_team, proofs, verified_profile, opportunity_targets, enrolled_at, created_at, updated_at;
        """,
        (guest_id, user_id, status, json.dumps(onboarding), now, now),
    )
    return _normalize_flow(row) or {}


def get_flow_for_user(flow_id: str, user_id: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select id::text as id, guest_id, user_id::text as user_id, status, onboarding, diagnostic, progress_plan, final_recommendation, submitted_to_team, proofs, verified_profile, opportunity_targets, enrolled_at, created_at, updated_at
        from app.trajectory_flows
        where id = %s::uuid and user_id = %s::uuid
        limit 1;
        """,
        (flow_id, user_id),
    )
    return _normalize_flow(row)


def get_flow_for_guest(flow_id: str, guest_id: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select id::text as id, guest_id, user_id::text as user_id, status, onboarding, diagnostic, progress_plan, final_recommendation, submitted_to_team, proofs, verified_profile, opportunity_targets, enrolled_at, created_at, updated_at
        from app.trajectory_flows
        where id = %s::uuid and guest_id = %s
        limit 1;
        """,
        (flow_id, guest_id),
    )
    return _normalize_flow(row)


def claim_flow_for_user(flow_id: str, user_id: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        update app.trajectory_flows
        set user_id = %s::uuid, updated_at = timezone('utc', now())
        where id = %s::uuid and user_id is null
        returning id::text as id, guest_id, user_id::text as user_id, status, onboarding, diagnostic, progress_plan, final_recommendation, submitted_to_team, proofs, verified_profile, opportunity_targets, enrolled_at, created_at, updated_at;
        """,
        (user_id, flow_id),
    )
    return _normalize_flow(row)


def update_flow_state(flow_id: str, *, diagnostic: dict[str, Any], progress_plan: dict[str, Any], final_recommendation: dict[str, Any] | None, proofs: list[dict[str, Any]], verified_profile: dict[str, Any], opportunity_targets: list[dict[str, Any]], status: str, updated_at: datetime) -> None:
    db_execute(
        """
        update app.trajectory_flows
        set diagnostic = %s::jsonb,
            progress_plan = %s::jsonb,
            final_recommendation = %s::jsonb,
            proofs = %s::jsonb,
            verified_profile = %s::jsonb,
            opportunity_targets = %s::jsonb,
            status = %s,
            updated_at = %s
        where id = %s::uuid;
        """,
        (
            json.dumps(diagnostic),
            json.dumps(progress_plan),
            json.dumps(final_recommendation) if final_recommendation is not None else None,
            json.dumps(proofs),
            json.dumps(verified_profile),
            json.dumps(opportunity_targets),
            status,
            updated_at,
            flow_id,
        ),
    )


def submit_flow_lead(*, flow_id: str, first_name: str, last_name: str, email: str, whatsapp_country_code: str, whatsapp_number: str, submitted_at: datetime) -> None:
    db_execute(
        """
        insert into app.training_diagnostic_leads(
          flow_id, first_name, last_name, email, whatsapp_country_code, whatsapp_number, submitted_at
        )
        values (%s::uuid, %s, %s, %s, %s, %s, %s)
        on conflict (flow_id) do update
        set first_name = excluded.first_name,
            last_name = excluded.last_name,
            email = excluded.email,
            whatsapp_country_code = excluded.whatsapp_country_code,
            whatsapp_number = excluded.whatsapp_number,
            submitted_at = excluded.submitted_at;
        """,
        (flow_id, first_name, last_name, email, whatsapp_country_code, whatsapp_number, submitted_at),
    )
    db_execute(
        "update app.trajectory_flows set submitted_to_team = true, updated_at = %s where id = %s::uuid;",
        (submitted_at, flow_id),
    )


def mark_flow_enrolled(flow_id: str, enrolled_at: datetime) -> None:
    db_execute(
        """
        update app.trajectory_flows
        set enrolled_at = coalesce(enrolled_at, %s), updated_at = %s
        where id = %s::uuid;
        """,
        (enrolled_at, enrolled_at, flow_id),
    )


def list_bindings(flow_id: str, user_id: str) -> list[dict[str, Any]]:
    return db_fetchall(
        """
        select id::text as id, flow_id::text as flow_id, user_id::text as user_id, context_id,
               koryxa_stage_key, koryxa_task_key, proof_required, feature_gate, created_at, updated_at
        from app.trajectory_task_bindings
        where flow_id = %s::uuid and user_id = %s::uuid
        order by created_at asc;
        """,
        (flow_id, user_id),
    )


def create_binding(*, flow_id: str, user_id: str, context_id: str, stage_key: str, task_key: str, proof_required: bool, feature_gate: str | None, now: datetime) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        insert into app.trajectory_task_bindings(
          flow_id, user_id, context_id, koryxa_stage_key, koryxa_task_key, proof_required, feature_gate, created_at, updated_at
        )
        values (%s::uuid, %s::uuid, %s, %s, %s, %s, %s, %s, %s)
        on conflict (flow_id, user_id, koryxa_task_key) do update
        set context_id = excluded.context_id,
            koryxa_stage_key = excluded.koryxa_stage_key,
            proof_required = excluded.proof_required,
            feature_gate = excluded.feature_gate,
            updated_at = excluded.updated_at
        returning id::text as id, flow_id::text as flow_id, user_id::text as user_id, context_id,
                  koryxa_stage_key, koryxa_task_key, proof_required, feature_gate, created_at, updated_at;
        """,
        (flow_id, user_id, context_id, stage_key, task_key, proof_required, feature_gate, now, now),
    )
    return row
