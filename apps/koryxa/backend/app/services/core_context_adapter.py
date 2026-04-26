from __future__ import annotations

from typing import Any

from app.services.postgres_bootstrap import db_fetchone


def _get_latest_trajectory_flow(*, user_id: str | None = None, guest_id: str | None = None) -> dict[str, Any] | None:
    if user_id:
        return db_fetchone(
            """
            select id::text as id, guest_id, user_id::text as user_id, onboarding, diagnostic, progress_plan, verified_profile, updated_at
            from app.trajectory_flows
            where user_id = %s::uuid
            order by updated_at desc
            limit 1;
            """,
            (user_id,),
        )
    if guest_id:
        return db_fetchone(
            """
            select id::text as id, guest_id, user_id::text as user_id, onboarding, diagnostic, progress_plan, verified_profile, updated_at
            from app.trajectory_flows
            where guest_id = %s
            order by updated_at desc
            limit 1;
            """,
            (guest_id,),
        )
    return None


def _get_latest_enterprise_need(*, user_id: str | None = None, guest_id: str | None = None) -> dict[str, Any] | None:
    if user_id:
        return db_fetchone(
            """
            select id::text as id, guest_id, user_id::text as user_id, title, status, created_at
            from app.enterprise_needs
            where user_id = %s::uuid
            order by created_at desc
            limit 1;
            """,
            (user_id,),
        )
    if guest_id:
        return db_fetchone(
            """
            select id::text as id, guest_id, user_id::text as user_id, title, status, created_at
            from app.enterprise_needs
            where guest_id = %s
            order by created_at desc
            limit 1;
            """,
            (guest_id,),
        )
    return None


def _get_mission_for_need(need_id: str) -> dict[str, Any] | None:
    return db_fetchone(
        """
        select id::text as id, need_id::text as need_id, title, status, created_at
        from app.enterprise_missions
        where need_id = %s::uuid
        limit 1;
        """,
        (need_id,),
    )


def _build_trajectory_summary(flow: dict[str, Any] | None) -> dict[str, Any] | None:
    if not flow:
        return None

    onboarding = flow.get("onboarding") or {}
    diagnostic = flow.get("diagnostic") or {}
    progress_plan = flow.get("progress_plan") or {}
    verified_profile = flow.get("verified_profile") or {}

    return {
        "objective": onboarding.get("objective"),
        "recommended_trajectory": (diagnostic.get("recommended_trajectory") or {}).get("title"),
        "readiness_score": (diagnostic.get("readiness") or {}).get("readiness_score"),
        "profile_status": verified_profile.get("profile_status"),
        "next_actions": list(progress_plan.get("next_actions") or [])[:3],
    }


def _build_enterprise_summary(need: dict[str, Any] | None, mission: dict[str, Any] | None) -> dict[str, Any] | None:
    if not need:
        return None

    return {
        "need_title": need.get("title"),
        "need_status": need.get("status"),
        "mission_title": (mission or {}).get("title"),
        "mission_status": (mission or {}).get("status"),
    }


def get_user_trajectory_summary(user_id: str) -> dict[str, Any] | None:
    return _build_trajectory_summary(_get_latest_trajectory_flow(user_id=user_id))


def get_guest_trajectory_summary(guest_id: str) -> dict[str, Any] | None:
    return _build_trajectory_summary(_get_latest_trajectory_flow(guest_id=guest_id))


def get_user_enterprise_summary(user_id: str) -> dict[str, Any] | None:
    need = _get_latest_enterprise_need(user_id=user_id)
    mission = _get_mission_for_need(need["id"]) if need else None
    return _build_enterprise_summary(need, mission)


def get_guest_enterprise_summary(guest_id: str) -> dict[str, Any] | None:
    need = _get_latest_enterprise_need(guest_id=guest_id)
    mission = _get_mission_for_need(need["id"]) if need else None
    return _build_enterprise_summary(need, mission)
