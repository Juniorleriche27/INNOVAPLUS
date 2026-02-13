from __future__ import annotations

import logging
import re
import os
import uuid
import json
import base64
import hmac
import csv
import io
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional
import time
from zoneinfo import ZoneInfo

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field

from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.myplanning import (
    AiPlanDayRequest,
    AiPlanDayResponse,
    AiReplanRequest,
    AiReplanResponse,
    AiSuggestTasksRequest,
    AiSuggestTasksResponse,
    OnboardingCompletePayload,
    OnboardingCompleteResponse,
    OnboardingGeneratePayload,
    OnboardingGenerateResponse,
    OnboardingStateResponse,
    OnboardingUpdatePayload,
    LearningPlanGenerateRequest,
    LearningPlanGenerateResponse,
    LearningPlanImportRequest,
    TaskCreatePayload,
    TaskListResponse,
    TaskResponse,
    TaskUpdatePayload,
    WorkspaceCreatePayload,
    WorkspaceListResponse,
    WorkspaceMemberAddPayload,
    WorkspaceMemberResponse,
    WorkspaceMembersResponse,
    WorkspaceResponse,
)
from app.services.myplanning_ai import plan_day_with_llama, replan_with_time_limit, suggest_tasks_from_text
from app.utils.ids import to_object_id
from app.core.auth import normalize_email

from app.services.alerts_v1 import generate_notifications_now, worker_tick_async
from app.services.attendance_v1 import (
    clamp_date_window,
    decode_qr_payload,
    issue_qr_token,
    parse_day,
    render_qr_svg,
    sha256_hex,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/myplanning", tags=["myplanning"])

COLLECTION = "myplanning_tasks"
ONBOARDING_COLLECTION = "myplanning_onboarding"
WORKSPACES_COLLECTION = "myplanning_workspaces"
WORKSPACE_MEMBERS_COLLECTION = "myplanning_workspace_members"
_RATE_LIMIT_BUCKETS: dict[str, List[float]] = {}
TASKS_STORE_MODES = {"mongo", "postgres", "dual"}
MONGO_OBJECT_ID_RE = re.compile(r"^[0-9a-fA-F]{24}$")


class NotificationPreferencesOut(BaseModel):
    owner_id: str
    email_enabled: bool
    whatsapp_enabled: bool
    whatsapp_e164: str | None = None
    daily_digest_enabled: bool
    digest_time_local: str
    timezone: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class NotificationPreferencesPatch(BaseModel):
    email_enabled: bool | None = None
    whatsapp_enabled: bool | None = None
    whatsapp_e164: str | None = None
    daily_digest_enabled: bool | None = None
    digest_time_local: str | None = None
    timezone: str | None = None


class AlertRuleIn(BaseModel):
    rule_type: Literal["TASK_DUE_SOON", "TASK_OVERDUE", "TASK_STALE", "DAILY_DIGEST"]
    channel: Literal["email", "whatsapp"]
    workspace_id: str | None = None
    is_enabled: bool = True
    params: dict[str, Any] = Field(default_factory=dict)


class AlertRuleOut(BaseModel):
    id: str
    owner_id: str
    workspace_id: str | None = None
    rule_type: str
    channel: str
    is_enabled: bool
    params: dict[str, Any]
    last_run_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AlertRulePatch(BaseModel):
    is_enabled: bool | None = None
    params: dict[str, Any] | None = None


class NotificationOut(BaseModel):
    id: int
    owner_id: str
    workspace_id: str | None = None
    channel: str
    template: str
    payload: dict[str, Any]
    status: str
    provider_message_id: str | None = None
    error: str | None = None
    dedupe_key: str | None = None
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    created_at: datetime | None = None


def _validate_e164(value: str | None) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None
    if not re.match(r"^\\+[1-9]\\d{7,14}$", raw):
        raise HTTPException(status_code=400, detail="whatsapp_e164 must be E.164 format (ex: +22890000000)")
    return raw


def _validate_time_local(value: str | None) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None
    parts = raw.split(":")
    if len(parts) not in {2, 3}:
        raise HTTPException(status_code=400, detail="digest_time_local must be HH:MM or HH:MM:SS")
    try:
        hh = int(parts[0])
        mm = int(parts[1])
        ss = int(parts[2]) if len(parts) == 3 else 0
    except Exception as exc:
        raise HTTPException(status_code=400, detail="digest_time_local must be HH:MM or HH:MM:SS") from exc
    if not (0 <= hh <= 23 and 0 <= mm <= 59 and 0 <= ss <= 59):
        raise HTTPException(status_code=400, detail="digest_time_local must be valid time")
    return f"{hh:02d}:{mm:02d}:{ss:02d}"


def _validate_timezone(value: str | None) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        _ = ZoneInfo(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="timezone must be a valid IANA name (ex: Africa/Lome)") from exc
    return raw


def _rate_limit(key: str, limit: int = 30, window_seconds: int = 60) -> None:
    now = time.time()
    bucket = _RATE_LIMIT_BUCKETS.get(key, [])
    bucket = [ts for ts in bucket if now - ts < window_seconds]
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Trop de requêtes. Réessayez dans quelques instants.")
    bucket.append(now)
    _RATE_LIMIT_BUCKETS[key] = bucket


def _myplanning_store() -> str:
    return (os.environ.get("MYPLANNING_STORE") or "mongo").strip().lower()


def _myplanning_tasks_store() -> str:
    override = (os.environ.get("MYPLANNING_TASKS_STORE_OVERRIDE") or "").strip().lower()
    if override in TASKS_STORE_MODES:
        return override
    mode = (os.environ.get("MYPLANNING_TASKS_STORE") or "mongo").strip().lower()
    if mode not in TASKS_STORE_MODES:
        return "mongo"
    return mode


def _looks_like_object_id(raw: str | None) -> bool:
    value = (raw or "").strip()
    return bool(value and MONGO_OBJECT_ID_RE.match(value))


def _resolve_admin_token_for_myplanning() -> str:
    token = (os.environ.get("ADMIN_TOKEN") or "").strip()
    if token:
        return token
    fallback = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if fallback:
        logger.warning("ADMIN_TOKEN not set for MyPlanning; falling back to SUPABASE_SERVICE_ROLE_KEY")
    return fallback


def _require_admin_token_for_myplanning(request: Request) -> None:
    configured = _resolve_admin_token_for_myplanning()
    if not configured:
        raise HTTPException(status_code=500, detail="Admin token not configured")
    provided = (request.headers.get("X-Admin-Token") or "").strip()
    if not provided or not hmac.compare_digest(provided, configured):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _pg_dsn() -> str:
    dsn = (os.environ.get("DATABASE_URL") or "").strip().strip('"').strip("'")
    if not dsn:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    return dsn


def _extract_jwt_sub_if_uuid(token: str | None) -> str | None:
    raw = (token or "").strip()
    if not raw or raw.count(".") != 2:
        return None
    try:
        payload_b64 = raw.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))
        sub = str(payload.get("sub") or "").strip()
        if not sub:
            return None
        return str(uuid.UUID(sub))
    except Exception:
        return None


async def _resolve_pg_actor_id(
    db: AsyncIOMotorDatabase,
    current: dict,
    bearer_token: str | None,
) -> str:
    jwt_sub = _extract_jwt_sub_if_uuid(bearer_token)
    if jwt_sub:
        return jwt_sub

    existing = current.get("pg_actor_id")
    if isinstance(existing, str):
        try:
            return str(uuid.UUID(existing))
        except Exception:
            pass

    generated = str(uuid.uuid5(uuid.NAMESPACE_URL, f"koryxa-user:{str(current.get('_id'))}"))
    await db["users"].update_one(
        {"_id": current["_id"]},
        {"$set": {"pg_actor_id": generated, "updated_at": datetime.utcnow()}},
    )
    return generated


def _user_plan(current: dict) -> str:
    raw = str(current.get("plan", "free")).lower()
    if raw in {"free", "pro", "team"}:
        return raw
    roles = {str(role).lower() for role in (current.get("roles") or [])}
    if "admin" in roles or "myplanning_team" in roles or "team" in roles:
        return "team"
    if "myplanning_pro" in roles or "pro" in roles:
        return "pro"
    return "free"


def _require_pro(current: dict) -> None:
    plan = _user_plan(current)
    if plan not in {"pro", "team"}:
        raise HTTPException(
            status_code=403,
            detail="Fonctionnalité Pro (bêta) — Passe à l’offre Pro pour y accéder.",
        )


def _serialize_datetime(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _serialize_task(doc: dict) -> TaskResponse:
    collaborators = doc.get("collaborator_ids") or []
    if collaborators and isinstance(collaborators[0], ObjectId):
        collaborators = [str(cid) for cid in collaborators]
    payload = {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id")),
        "workspace_id": str(doc.get("workspace_id")) if doc.get("workspace_id") else None,
        "project_id": str(doc.get("project_id")) if doc.get("project_id") else None,
        "title": doc.get("title", ""),
        "description": doc.get("description"),
        "category": doc.get("category"),
        "context_type": doc.get("context_type") or "personal",
        "context_id": doc.get("context_id"),
        "priority_eisenhower": doc.get("priority_eisenhower"),
        "kanban_state": doc.get("kanban_state"),
        "high_impact": bool(doc.get("high_impact")),
        "estimated_duration_minutes": doc.get("estimated_duration_minutes"),
        "start_datetime": _serialize_datetime(doc.get("start_datetime")),
        "due_datetime": _serialize_datetime(doc.get("due_datetime")),
        "completed_at": _serialize_datetime(doc.get("completed_at")),
        "linked_goal": doc.get("linked_goal"),
        "moscow": doc.get("moscow"),
        "status": doc.get("status"),
        "energy_level": doc.get("energy_level"),
        "pomodoro_estimated": doc.get("pomodoro_estimated"),
        "pomodoro_done": doc.get("pomodoro_done"),
        "comments": doc.get("comments"),
        "assignee_user_id": str(doc.get("assignee_user_id")) if doc.get("assignee_user_id") else None,
        "assignee_id": str(doc.get("assignee_id")) if doc.get("assignee_id") else None,
        "collaborator_ids": collaborators,
        "source": doc.get("source") or "manual",
        "priority": doc.get("priority"),
        "due_date": doc.get("due_date"),
        "start_at": _serialize_datetime(doc.get("start_at")),
        "end_at": _serialize_datetime(doc.get("end_at")),
        "estimated_minutes": doc.get("estimated_minutes"),
        "spent_minutes": doc.get("spent_minutes"),
        "created_at": _serialize_datetime(doc.get("created_at")),
        "updated_at": _serialize_datetime(doc.get("updated_at")),
    }
    return TaskResponse(**payload)


def _workspace_role(member_doc: dict) -> str:
    return str(member_doc.get("role") or "member").lower()


def _workspace_role_can_manage(member_doc: dict) -> bool:
    return _workspace_role(member_doc) in {"owner", "admin"}


async def _get_workspace_membership(
    db: AsyncIOMotorDatabase,
    workspace_oid: ObjectId,
    user_oid: ObjectId,
) -> dict:
    membership = await db[WORKSPACE_MEMBERS_COLLECTION].find_one(
        {"workspace_id": workspace_oid, "user_id": user_oid, "status": "active"}
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Workspace introuvable")
    return membership


async def _get_workspace_for_member(
    db: AsyncIOMotorDatabase,
    workspace_oid: ObjectId,
    user_oid: ObjectId,
) -> tuple[dict, dict]:
    membership = await _get_workspace_membership(db, workspace_oid, user_oid)
    workspace = await db[WORKSPACES_COLLECTION].find_one({"_id": workspace_oid})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace introuvable")
    return workspace, membership


async def _workspace_member_count(db: AsyncIOMotorDatabase, workspace_oid: ObjectId) -> int:
    return await db[WORKSPACE_MEMBERS_COLLECTION].count_documents(
        {"workspace_id": workspace_oid, "status": "active"}
    )


def _prepare_task_payload(payload: dict) -> dict:
    doc = payload.copy()
    if "assignee_user_id" in doc and doc["assignee_user_id"]:
        raw = doc["assignee_user_id"]
        if isinstance(raw, ObjectId):
            pass
        elif isinstance(raw, str) and _looks_like_object_id(raw):
            try:
                doc["assignee_user_id"] = to_object_id(raw)
            except HTTPException:
                doc["assignee_user_id"] = raw
        else:
            doc["assignee_user_id"] = raw
    if "collaborator_ids" in doc and doc["collaborator_ids"]:
        converted: List[Any] = []
        for value in doc["collaborator_ids"]:
            if isinstance(value, ObjectId):
                converted.append(value)
                continue
            if isinstance(value, str) and _looks_like_object_id(value):
                try:
                    converted.append(to_object_id(value))
                    continue
                except HTTPException:
                    pass
            converted.append(value)
        doc["collaborator_ids"] = converted
    return doc


def _validate_dates(doc: dict) -> None:
    start_dt = _serialize_datetime(doc.get("start_datetime"))
    due_dt = _serialize_datetime(doc.get("due_datetime"))
    if start_dt and due_dt and start_dt > due_dt:
        raise HTTPException(status_code=400, detail="La date de début ne peut pas dépasser l'échéance.")


def _parse_date_filter(date_str: Optional[str]) -> Optional[tuple[datetime, datetime]]:
    if not date_str:
        return None
    try:
        day = datetime.fromisoformat(date_str).date()
    except ValueError:
        return None
    start = datetime.combine(day, datetime.min.time())
    end = start + timedelta(days=1)
    return start, end


def _daily_budget_to_minutes(value: str) -> int:
    mapping = {
        "30_minutes": 30,
        "1_hour": 60,
        "2_hours": 120,
        "plus_2_hours": 180,
    }
    return mapping.get(value, 60)


def _intent_to_text(value: str) -> str:
    mapping = {
        "study_learn": "Étudier / apprendre",
        "work_deliver": "Travailler / livrer",
        "build_project": "Construire un projet",
        "organize_better": "Mieux m’organiser",
    }
    return mapping.get(value, value)


def _serialize_onboarding_state(doc: Optional[Dict[str, Any]]) -> OnboardingStateResponse:
    if not doc:
        return OnboardingStateResponse()
    goal = doc.get("main_goal_mid_term") or doc.get("main_goal")
    return OnboardingStateResponse(
        user_intent=doc.get("user_intent"),
        main_goal_mid_term=goal,
        daily_focus_hint=doc.get("daily_focus_hint"),
        daily_time_budget=doc.get("daily_time_budget"),
        onboarding_completed=bool(doc.get("onboarding_completed")),
        generated_tasks=doc.get("generated_tasks") or [],
        updated_at=_serialize_datetime(doc.get("updated_at")),
    )


def _build_onboarding_brief(intent: str, goal: str, daily_focus_hint: str | None, daily_budget: str) -> str:
    minutes = _daily_budget_to_minutes(daily_budget)
    focus = (daily_focus_hint or "").strip()
    focus_line = f"Focus du jour suggéré: {focus}.\n" if focus else ""
    return (
        f"Contexte d'usage: {_intent_to_text(intent)}.\n"
        f"Objectif moyen terme (1-4 semaines): {goal.strip()}.\n"
        f"{focus_line}"
        f"Temps réel par jour: {minutes} minutes.\n"
        "Retourne des tâches pour aujourd'hui qui contribuent directement à l'objectif moyen terme. "
        "Évite les routines génériques (réveil, douche, petit-déjeuner) si elles ne font pas avancer l'objectif."
    )


def _fallback_onboarding_tasks(main_goal: str, daily_focus_hint: str | None, daily_minutes: int) -> List[Dict[str, Any]]:
    main_block = max(20, min(120, int(daily_minutes * 0.6)))
    prep_block = max(10, min(40, int(daily_minutes * 0.2)))
    close_block = max(10, min(30, int(daily_minutes * 0.2)))
    focus_title = (daily_focus_hint or "").strip()
    prep_title = focus_title if focus_title else f"Clarifier le livrable lié à {main_goal.strip()[:80]}"
    return [
        {
            "title": prep_title,
            "estimated_time": prep_block,
            "impact_level": "moyen",
        },
        {
            "title": f"Bloc principal : {main_goal.strip()[:120]}",
            "estimated_time": main_block,
            "impact_level": "élevé",
        },
        {
            "title": "Bilan rapide + prochaine étape",
            "estimated_time": close_block,
            "impact_level": "moyen",
        },
    ]


def _tokenize_for_match(text: str) -> set[str]:
    words = re.findall(r"[a-zA-ZÀ-ÿ0-9]{3,}", text.lower())
    stopwords = {
        "pour", "avec", "dans", "sans", "une", "des", "les", "sur", "mon", "ton", "son", "leur",
        "faire", "plus", "tres", "objectif", "aujourdhui", "aujourd", "hui", "prochaines", "semaines",
    }
    return {w for w in words if w not in stopwords}


def _is_generic_routine(title: str) -> bool:
    t = title.lower()
    routine_markers = [
        "réveil", "reveil", "petit-déjeuner", "petit dejeuner", "douche", "sieste",
        "pause déjeuner", "pause dejeuner", "déjeuner", "dejeuner", "manger", "sport 20h",
    ]
    return any(marker in t for marker in routine_markers)


def _is_task_related_to_goal(title: str, goal: str, daily_focus_hint: str | None) -> bool:
    title_tokens = _tokenize_for_match(title)
    if not title_tokens:
        return False
    goal_tokens = _tokenize_for_match(goal)
    focus_tokens = _tokenize_for_match(daily_focus_hint or "")
    # Require at least one shared token with goal/focus to ensure direct contribution.
    if goal_tokens and title_tokens.intersection(goal_tokens):
        return True
    if focus_tokens and title_tokens.intersection(focus_tokens):
        return True
    # If no lexical overlap and routine marker detected, reject directly.
    if _is_generic_routine(title):
        return False
    return False


def _normalize_onboarding_tasks(
    candidates: List[Dict[str, Any]],
    goal: str,
    daily_focus_hint: str | None,
    daily_budget: str,
) -> List[Dict[str, Any]]:
    daily_minutes = _daily_budget_to_minutes(daily_budget)
    normalized: List[Dict[str, Any]] = []
    seen_titles: set[str] = set()
    for item in candidates:
        if len(normalized) >= 3:
            break
        title = str(item.get("title") or "").strip()
        if len(title) < 3:
            continue
        if not _is_task_related_to_goal(title, goal, daily_focus_hint):
            continue
        key = title.lower()
        if key in seen_titles:
            continue
        estimated = item.get("estimated_duration_minutes")
        if isinstance(estimated, str) and estimated.isdigit():
            estimated = int(estimated)
        if not isinstance(estimated, int) or estimated <= 0:
            estimated = max(15, min(90, int(daily_minutes / 3)))
        estimated = max(10, min(240, estimated))
        impact_level = "élevé" if bool(item.get("high_impact")) else "moyen"
        normalized.append(
            {
                "title": title[:160],
                "estimated_time": estimated,
                "impact_level": impact_level,
            }
        )
        seen_titles.add(key)

    if len(normalized) < 3:
        for fallback in _fallback_onboarding_tasks(goal, daily_focus_hint, daily_minutes):
            if len(normalized) >= 3:
                break
            key = fallback["title"].lower()
            if key in seen_titles:
                continue
            normalized.append(fallback)
            seen_titles.add(key)
    return normalized[:3]


@router.get("/onboarding", response_model=OnboardingStateResponse)
async def get_onboarding_state(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> OnboardingStateResponse:
    doc = await db[ONBOARDING_COLLECTION].find_one({"user_id": current["_id"]})
    return _serialize_onboarding_state(doc)


@router.put("/onboarding", response_model=OnboardingStateResponse)
async def update_onboarding_state(
    payload: OnboardingUpdatePayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> OnboardingStateResponse:
    updates = payload.dict(exclude_unset=True)
    if not updates:
        doc = await db[ONBOARDING_COLLECTION].find_one({"user_id": current["_id"]})
        return _serialize_onboarding_state(doc)
    if "onboarding_completed" in updates:
        raise HTTPException(status_code=400, detail="Utilisez /myplanning/onboarding/complete pour terminer l’onboarding.")
    if "main_goal_mid_term" in updates and isinstance(updates["main_goal_mid_term"], str):
        updates["main_goal_mid_term"] = updates["main_goal_mid_term"].strip()
    if "daily_focus_hint" in updates and isinstance(updates["daily_focus_hint"], str):
        updates["daily_focus_hint"] = updates["daily_focus_hint"].strip()
    if "generated_tasks" in updates and updates["generated_tasks"] is not None:
        updates["generated_tasks"] = updates["generated_tasks"][:3]
    now = datetime.utcnow()
    updates["updated_at"] = now
    await db[ONBOARDING_COLLECTION].update_one(
        {"user_id": current["_id"]},
        {
            "$set": updates,
            "$setOnInsert": {
                "user_id": current["_id"],
                "created_at": now,
                "onboarding_completed": False,
            },
        },
        upsert=True,
    )
    doc = await db[ONBOARDING_COLLECTION].find_one({"user_id": current["_id"]})
    return _serialize_onboarding_state(doc)


@router.post("/onboarding/generate", response_model=OnboardingGenerateResponse)
async def generate_onboarding_tasks(
    payload: OnboardingGeneratePayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> OnboardingGenerateResponse:
    _rate_limit(f"onboarding_generate:{current['_id']}", limit=20, window_seconds=60)
    goal = payload.main_goal_mid_term.strip()
    daily_focus_hint = (payload.daily_focus_hint or "").strip() or None
    brief = _build_onboarding_brief(payload.user_intent, goal, daily_focus_hint, payload.daily_time_budget)
    drafts, _used_fallback = await suggest_tasks_from_text(brief, "fr", None)
    generated_tasks = _normalize_onboarding_tasks(drafts, goal, daily_focus_hint, payload.daily_time_budget)
    now = datetime.utcnow()
    await db[ONBOARDING_COLLECTION].update_one(
        {"user_id": current["_id"]},
        {
            "$set": {
                "user_intent": payload.user_intent,
                "main_goal_mid_term": goal,
                "daily_focus_hint": daily_focus_hint,
                "daily_time_budget": payload.daily_time_budget,
                "generated_tasks": generated_tasks,
                "onboarding_completed": False,
                "updated_at": now,
            },
            "$setOnInsert": {"user_id": current["_id"], "created_at": now},
        },
        upsert=True,
    )
    return OnboardingGenerateResponse(generated_tasks=generated_tasks)


@router.post("/onboarding/complete", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    payload: OnboardingCompletePayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> OnboardingCompleteResponse:
    doc = await db[ONBOARDING_COLLECTION].find_one({"user_id": current["_id"]})
    if not doc:
        raise HTTPException(status_code=400, detail="Onboarding introuvable. Reprenez depuis l’étape 1.")
    if doc.get("onboarding_completed"):
        raise HTTPException(status_code=409, detail="Onboarding déjà terminé.")
    goal = doc.get("main_goal_mid_term") or doc.get("main_goal")
    if not doc.get("user_intent") or not goal or not doc.get("daily_time_budget"):
        raise HTTPException(status_code=400, detail="Onboarding incomplet. Terminez d’abord les étapes 1 à 5.")

    generated_tasks = [item.dict() for item in payload.generated_tasks][:3]
    now = datetime.utcnow()
    due_dt = now.replace(hour=20, minute=0, second=0, microsecond=0)
    if due_dt < now:
        due_dt = due_dt + timedelta(days=1)

    docs_to_insert: List[Dict[str, Any]] = []
    for task in generated_tasks:
        impact_level = task.get("impact_level") or "moyen"
        docs_to_insert.append(
            {
                "user_id": current["_id"],
                "title": task["title"],
                "description": f"Objectif moyen terme: {goal}",
                "category": "Onboarding MyPlanning",
                "priority_eisenhower": "urgent_important" if impact_level == "élevé" else "important_not_urgent",
                "kanban_state": "todo",
                "high_impact": impact_level == "élevé",
                "estimated_duration_minutes": int(task["estimated_time"]),
                "due_datetime": due_dt,
                "linked_goal": str(goal),
                "source": "ia",
                "created_at": now,
                "updated_at": now,
            }
        )

    created_tasks: List[TaskResponse] = []
    if docs_to_insert:
        result = await db[COLLECTION].insert_many(docs_to_insert)
        for oid, task_doc in zip(result.inserted_ids, docs_to_insert):
            task_doc["_id"] = oid
            created_tasks.append(_serialize_task(task_doc))

    await db[ONBOARDING_COLLECTION].update_one(
        {"user_id": current["_id"]},
        {
            "$set": {
                "generated_tasks": generated_tasks,
                "onboarding_completed": True,
                "updated_at": now,
                "completed_at": now,
            }
        },
    )
    return OnboardingCompleteResponse(created_tasks=created_tasks, onboarding_completed=True)


def _parse_bearer_token(request: Request) -> str | None:
    authz = (request.headers.get("authorization") or "").strip()
    if authz.lower().startswith("bearer "):
        token = authz[7:].strip()
        return token or None
    return None


async def _ensure_pg_actor_id_for_user_doc(db: AsyncIOMotorDatabase, user_doc: dict) -> str:
    existing = user_doc.get("pg_actor_id")
    if isinstance(existing, str):
        try:
            return str(uuid.UUID(existing))
        except Exception:
            pass
    generated = str(uuid.uuid5(uuid.NAMESPACE_URL, f"koryxa-user:{str(user_doc.get('_id'))}"))
    await db["users"].update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"pg_actor_id": generated, "updated_at": datetime.utcnow()}},
    )
    return generated


def _pg_upsert_auth_user(cur, actor_id: str, email: str) -> None:
    actor_email = (email or f"{actor_id}@koryxa.local").strip().lower()
    cur.execute(
        """
        insert into auth.users (
          id, aud, role, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
        )
        values (
          %s::uuid, 'authenticated', 'authenticated', %s, now(), now(), '{}'::jsonb, '{}'::jsonb
        )
        on conflict (id) do update
          set email = coalesce(auth.users.email, excluded.email),
              updated_at = now();
        """,
        (actor_id, actor_email),
    )


def _pg_set_rls_actor(cur, actor_id: str) -> None:
    cur.execute("set local role authenticated;")
    cur.execute("set local request.jwt.claim.role = 'authenticated';")
    cur.execute("set local request.jwt.claim.sub = %s;", (actor_id,))


def _coerce_uuid_text(raw: Any) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, uuid.UUID):
        return str(raw)
    value = str(raw).strip()
    if not value:
        return None
    try:
        return str(uuid.UUID(value))
    except Exception:
        return None


def _coerce_datetime_or_none(raw: Any) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, date):
        return datetime.combine(raw, datetime.min.time())
    try:
        return datetime.fromisoformat(str(raw))
    except Exception:
        return None


def _coerce_iso_datetime_or_400(raw: str | None, field_name: str) -> datetime | None:
    value = (raw or "").strip()
    if not value:
        return None
    candidate = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        try:
            parsed = datetime.combine(date.fromisoformat(value), datetime.min.time())
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"{field_name} must be an ISO date or datetime") from exc
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _resolve_stats_window(from_raw: str | None, to_raw: str | None) -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    parsed_from = _coerce_iso_datetime_or_400(from_raw, "from")
    parsed_to = _coerce_iso_datetime_or_400(to_raw, "to")
    if parsed_from is None and parsed_to is None:
        parsed_to = now
        parsed_from = now - timedelta(days=30)
    elif parsed_from is None:
        parsed_to = parsed_to or now
        parsed_from = parsed_to - timedelta(days=30)
    elif parsed_to is None:
        parsed_to = now
    if parsed_from >= parsed_to:
        raise HTTPException(status_code=400, detail="'from' must be earlier than 'to'")
    return parsed_from, parsed_to


def _coerce_date_or_none(raw: Any) -> date | None:
    if raw is None:
        return None
    if isinstance(raw, date):
        return raw
    if isinstance(raw, datetime):
        return raw.date()
    try:
        return date.fromisoformat(str(raw))
    except Exception:
        return None


def _coerce_pg_collaborator_ids(raw: Any) -> list[str]:
    if not isinstance(raw, list):
        return []
    values: list[str] = []
    for item in raw:
        parsed = _coerce_uuid_text(item)
        if parsed:
            values.append(parsed)
    return values


def _mongo_task_to_pg_task_doc(mongo_task: dict[str, Any]) -> dict[str, Any]:
    now = datetime.utcnow()
    title = str(mongo_task.get("title") or "").strip()[:260]
    if not title:
        title = "Task"
    doc: dict[str, Any] = {
        "workspace_id": _coerce_uuid_text(mongo_task.get("workspace_id")),
        "project_id": _coerce_uuid_text(mongo_task.get("project_id")),
        "title": title,
        "description": mongo_task.get("description"),
        "category": mongo_task.get("category"),
        "context_type": mongo_task.get("context_type"),
        "context_id": mongo_task.get("context_id"),
        "priority_eisenhower": mongo_task.get("priority_eisenhower"),
        "kanban_state": mongo_task.get("kanban_state"),
        "high_impact": bool(mongo_task.get("high_impact")),
        "estimated_duration_minutes": mongo_task.get("estimated_duration_minutes"),
        "start_datetime": _coerce_datetime_or_none(mongo_task.get("start_datetime")),
        "due_datetime": _coerce_datetime_or_none(mongo_task.get("due_datetime")),
        "linked_goal": mongo_task.get("linked_goal"),
        "moscow": mongo_task.get("moscow"),
        "status": mongo_task.get("status"),
        "energy_level": mongo_task.get("energy_level"),
        "pomodoro_estimated": mongo_task.get("pomodoro_estimated"),
        "pomodoro_done": mongo_task.get("pomodoro_done"),
        "comments": mongo_task.get("comments"),
        "assignee_user_id": _coerce_uuid_text(mongo_task.get("assignee_user_id")),
        "assignee_id": _coerce_uuid_text(mongo_task.get("assignee_id") or mongo_task.get("assignee_user_id")),
        "collaborator_ids": _coerce_pg_collaborator_ids(mongo_task.get("collaborator_ids")),
        "source": mongo_task.get("source"),
        "completed_at": _coerce_datetime_or_none(mongo_task.get("completed_at")),
        "done_at": _coerce_datetime_or_none(mongo_task.get("done_at"))
        or _coerce_datetime_or_none(mongo_task.get("completed_at")),
        "priority": mongo_task.get("priority"),
        "due_date": _coerce_date_or_none(mongo_task.get("due_date")),
        "start_at": _coerce_datetime_or_none(mongo_task.get("start_at")),
        "end_at": _coerce_datetime_or_none(mongo_task.get("end_at")),
        "estimated_minutes": mongo_task.get("estimated_minutes"),
        "spent_minutes": mongo_task.get("spent_minutes"),
    }
    normalized = _normalize_pg_task_payload(doc, now=now, for_update=False)
    normalized["created_at"] = _coerce_datetime_or_none(mongo_task.get("created_at")) or now
    normalized["updated_at"] = _coerce_datetime_or_none(mongo_task.get("updated_at")) or now
    return normalized


async def _pg_upsert_task_id_map(
    actor_id: str,
    email: str,
    mongo_id: str,
    pg_id: str,
) -> None:
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                insert into app.task_id_map(mongo_id, pg_id, owner_id, created_at)
                values (%s, %s::uuid, %s::uuid, now())
                on conflict (mongo_id) do update
                  set pg_id = excluded.pg_id,
                      owner_id = excluded.owner_id;
                """,
                (mongo_id, pg_id, actor_id),
            )
        conn.commit()
    except Exception:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


async def _pg_find_pg_id_by_mongo_id(actor_id: str, email: str, mongo_id: str) -> str | None:
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                "select pg_id::text as pg_id from app.task_id_map where mongo_id = %s limit 1;",
                (mongo_id,),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except Exception:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    pg_id = row.get("pg_id")
    return str(pg_id) if pg_id else None


async def _pg_find_mongo_id_by_pg_id(actor_id: str, email: str, pg_id: str) -> str | None:
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                "select mongo_id from app.task_id_map where pg_id = %s::uuid limit 1;",
                (pg_id,),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except Exception:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    mongo_id = row.get("mongo_id")
    return str(mongo_id) if mongo_id else None


async def _pg_delete_task_id_map(actor_id: str, email: str, *, pg_id: str | None = None, mongo_id: str | None = None) -> None:
    if not pg_id and not mongo_id:
        return
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, email)
            _pg_set_rls_actor(cur, actor_id)
            if pg_id and mongo_id:
                cur.execute("delete from app.task_id_map where pg_id = %s::uuid or mongo_id = %s;", (pg_id, mongo_id))
            elif pg_id:
                cur.execute("delete from app.task_id_map where pg_id = %s::uuid;", (pg_id,))
            else:
                cur.execute("delete from app.task_id_map where mongo_id = %s;", (mongo_id,))
        conn.commit()
    except Exception:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


async def _mongo_list_workspaces(
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceListResponse:
    memberships = await db[WORKSPACE_MEMBERS_COLLECTION].find(
        {"user_id": current["_id"], "status": "active"}
    ).to_list(length=500)
    if not memberships:
        return WorkspaceListResponse(items=[])

    workspace_ids = [m.get("workspace_id") for m in memberships if m.get("workspace_id")]
    if not workspace_ids:
        return WorkspaceListResponse(items=[])

    workspace_docs = await db[WORKSPACES_COLLECTION].find({"_id": {"$in": workspace_ids}}).to_list(length=500)
    workspaces_map = {doc["_id"]: doc for doc in workspace_docs}
    counts_cursor = db[WORKSPACE_MEMBERS_COLLECTION].aggregate(
        [
            {"$match": {"workspace_id": {"$in": workspace_ids}, "status": "active"}},
            {"$group": {"_id": "$workspace_id", "count": {"$sum": 1}}},
        ]
    )
    counts: Dict[ObjectId, int] = {}
    async for row in counts_cursor:
        counts[row["_id"]] = int(row.get("count") or 0)

    items: List[WorkspaceResponse] = []
    for membership in memberships:
        workspace = workspaces_map.get(membership.get("workspace_id"))
        if not workspace:
            continue
        owner_id = workspace.get("owner_user_id") or workspace.get("created_by")
        items.append(
            WorkspaceResponse(
                id=str(workspace["_id"]),
                name=str(workspace.get("name") or "Workspace"),
                role=_workspace_role(membership),  # type: ignore[arg-type]
                owner_user_id=str(owner_id) if owner_id else "",
                member_count=counts.get(workspace["_id"], 0),
                created_at=_serialize_datetime(workspace.get("created_at")),
                updated_at=_serialize_datetime(workspace.get("updated_at")),
            )
        )
    return WorkspaceListResponse(items=items)


async def _mongo_create_workspace(
    payload: WorkspaceCreatePayload,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceResponse:
    now = datetime.utcnow()
    name = payload.name.strip()
    workspace_doc = {
        "name": name,
        "owner_user_id": current["_id"],
        "created_by": current["_id"],
        "created_at": now,
        "updated_at": now,
    }
    result = await db[WORKSPACES_COLLECTION].insert_one(workspace_doc)
    workspace_doc["_id"] = result.inserted_id

    await db[WORKSPACE_MEMBERS_COLLECTION].insert_one(
        {
            "workspace_id": result.inserted_id,
            "user_id": current["_id"],
            "email": current.get("email"),
            "role": "owner",
            "status": "active",
            "joined_at": now,
            "created_at": now,
            "updated_at": now,
            "created_by": current["_id"],
        }
    )
    return WorkspaceResponse(
        id=str(result.inserted_id),
        name=name,
        role="owner",
        owner_user_id=str(current["_id"]),
        member_count=1,
        created_at=now,
        updated_at=now,
    )


async def _pg_list_workspaces(
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceListResponse:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select
                  w.id::text as id,
                  w.name,
                  w.owner_id::text as owner_id,
                  coalesce(wm.role, 'owner') as role,
                  coalesce(mc.member_count, 0)::int as member_count,
                  w.created_at,
                  w.updated_at
                from app.workspaces w
                left join app.workspace_members wm
                  on wm.workspace_id = w.id
                 and wm.user_id = %s::uuid
                left join (
                  select workspace_id, count(*)::int as member_count
                  from app.workspace_members
                  group by workspace_id
                ) mc on mc.workspace_id = w.id
                where w.owner_id = %s::uuid
                   or exists (
                        select 1
                        from app.workspace_members me
                        where me.workspace_id = w.id
                          and me.user_id = %s::uuid
                   )
                order by w.created_at desc;
                """,
                (actor_id, actor_id, actor_id),
            )
            rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except Exception as exc:
        try:
            if conn is not None:
                conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"postgres workspace list error: {exc.__class__.__name__}")
    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass

    items = [
        WorkspaceResponse(
            id=str(r["id"]),
            name=str(r["name"]),
            role=str(r["role"]),  # type: ignore[arg-type]
            owner_user_id=str(r["owner_id"]),
            member_count=int(r.get("member_count") or 0),
            created_at=_serialize_datetime(r.get("created_at")),
            updated_at=_serialize_datetime(r.get("updated_at")),
        )
        for r in rows
    ]
    return WorkspaceListResponse(items=items)


async def _pg_create_workspace(
    payload: WorkspaceCreatePayload,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceResponse:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    workspace_id = str(uuid.uuid4())
    now = datetime.utcnow()
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                insert into app.workspaces(id, name, owner_id, created_at, updated_at)
                values (%s::uuid, %s, %s::uuid, %s, %s);
                """,
                (workspace_id, payload.name.strip(), actor_id, now, now),
            )
            cur.execute(
                """
                insert into app.workspace_members(workspace_id, user_id, role, created_at)
                values (%s::uuid, %s::uuid, 'owner', %s);
                """,
                (workspace_id, actor_id, now),
            )
        conn.commit()
    except Exception as exc:
        try:
            if conn is not None:
                conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"postgres workspace create error: {exc.__class__.__name__}")
    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass

    return WorkspaceResponse(
        id=workspace_id,
        name=payload.name.strip(),
        role="owner",
        owner_user_id=actor_id,
        member_count=1,
        created_at=now,
        updated_at=now,
    )


async def _pg_get_workspace(
    workspace_id: str,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceResponse:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select
                  w.id::text as id,
                  w.name,
                  w.owner_id::text as owner_id,
                  coalesce(wm.role, 'owner') as role,
                  coalesce(mc.member_count, 0)::int as member_count,
                  w.created_at,
                  w.updated_at
                from app.workspaces w
                left join app.workspace_members wm
                  on wm.workspace_id = w.id
                 and wm.user_id = %s::uuid
                left join (
                  select workspace_id, count(*)::int as member_count
                  from app.workspace_members
                  group by workspace_id
                ) mc on mc.workspace_id = w.id
                where w.id = %s::uuid
                limit 1;
                """,
                (actor_id, workspace_id),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except Exception as exc:
        try:
            if conn is not None:
                conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"postgres workspace get error: {exc.__class__.__name__}")
    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass

    if not row:
        raise HTTPException(status_code=404, detail="Workspace introuvable")
    return WorkspaceResponse(
        id=str(row["id"]),
        name=str(row["name"]),
        role=str(row["role"]),  # type: ignore[arg-type]
        owner_user_id=str(row["owner_id"]),
        member_count=int(row.get("member_count") or 0),
        created_at=_serialize_datetime(row.get("created_at")),
        updated_at=_serialize_datetime(row.get("updated_at")),
    )


async def _mongo_get_workspace(
    workspace_id: str,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceResponse:
    workspace_oid = to_object_id(workspace_id)
    workspace, membership = await _get_workspace_for_member(db, workspace_oid, current["_id"])
    owner_id = workspace.get("owner_user_id") or workspace.get("created_by")
    member_count = await _workspace_member_count(db, workspace_oid)
    return WorkspaceResponse(
        id=str(workspace["_id"]),
        name=str(workspace.get("name") or "Workspace"),
        role=_workspace_role(membership),  # type: ignore[arg-type]
        owner_user_id=str(owner_id) if owner_id else "",
        member_count=member_count,
        created_at=_serialize_datetime(workspace.get("created_at")),
        updated_at=_serialize_datetime(workspace.get("updated_at")),
    )


async def _pg_list_workspace_members(
    workspace_id: str,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceMembersResponse:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select w.id::text as workspace_id, w.owner_id::text as owner_id
                from app.workspaces w
                where w.id = %s::uuid
                limit 1;
                """,
                (workspace_id,),
            )
            workspace = dict(cur.fetchone() or {})
            if not workspace:
                raise HTTPException(status_code=404, detail="Workspace introuvable")
            cur.execute(
                """
                select user_id::text as user_id, role, created_at as joined_at
                from app.workspace_members
                where workspace_id = %s::uuid
                order by created_at asc;
                """,
                (workspace_id,),
            )
            members = [dict(r) for r in cur.fetchall()]
            cur.execute(
                """
                select email, role, status, invited_at, accepted_at
                from app.workspace_invites
                where workspace_id = %s::uuid
                order by invited_at desc;
                """,
                (workspace_id,),
            )
            invites = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except HTTPException:
        raise
    except Exception as exc:
        try:
            if conn is not None:
                conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"postgres members list error: {exc.__class__.__name__}")
    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass

    pg_ids = [m.get("user_id") for m in members if m.get("user_id")]
    users_map: Dict[str, dict] = {}
    if pg_ids:
        user_docs = await db["users"].find({"pg_actor_id": {"$in": pg_ids}}).to_list(length=1000)
        users_map = {str(u.get("pg_actor_id")): u for u in user_docs if u.get("pg_actor_id")}

    items: List[WorkspaceMemberResponse] = []
    for m in members:
        uid = str(m.get("user_id") or "")
        user_doc = users_map.get(uid, {})
        email = str(user_doc.get("email") or "")
        if uid == actor_id and current.get("email"):
            email = str(current.get("email"))
        items.append(
            WorkspaceMemberResponse(
                user_id=uid or None,
                email=email or None,
                first_name=user_doc.get("first_name"),
                last_name=user_doc.get("last_name"),
                role=str(m.get("role") or "member"),  # type: ignore[arg-type]
                status="active",
                joined_at=_serialize_datetime(m.get("joined_at")),
                invited_at=None,
            )
        )
    for inv in invites:
        items.append(
            WorkspaceMemberResponse(
                user_id=None,
                email=str(inv.get("email") or ""),
                first_name=None,
                last_name=None,
                role=str(inv.get("role") or "member"),  # type: ignore[arg-type]
                status=str(inv.get("status") or "pending"),  # type: ignore[arg-type]
                joined_at=_serialize_datetime(inv.get("accepted_at")),
                invited_at=_serialize_datetime(inv.get("invited_at")),
            )
        )
    return WorkspaceMembersResponse(workspace_id=workspace_id, items=items)


async def _mongo_list_workspace_members(
    workspace_id: str,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceMembersResponse:
    workspace_oid = to_object_id(workspace_id)
    await _get_workspace_membership(db, workspace_oid, current["_id"])

    member_docs = await db[WORKSPACE_MEMBERS_COLLECTION].find(
        {"workspace_id": workspace_oid, "status": {"$in": ["active", "pending"]}}
    ).to_list(length=1000)
    user_ids = [m["user_id"] for m in member_docs if m.get("user_id")]
    users_map: Dict[ObjectId, dict] = {}
    if user_ids:
        users = await db["users"].find({"_id": {"$in": user_ids}}).to_list(length=1000)
        users_map = {u["_id"]: u for u in users}

    items: List[WorkspaceMemberResponse] = []
    for member in member_docs:
        user = users_map.get(member.get("user_id"))
        items.append(
            WorkspaceMemberResponse(
                user_id=str(member["user_id"]) if member.get("user_id") else None,
                email=str(member.get("email") or (user or {}).get("email") or ""),
                first_name=(user or {}).get("first_name"),
                last_name=(user or {}).get("last_name"),
                role=_workspace_role(member),  # type: ignore[arg-type]
                status=str(member.get("status") or "active"),  # type: ignore[arg-type]
                joined_at=_serialize_datetime(member.get("joined_at")),
                invited_at=_serialize_datetime(member.get("invited_at")),
            )
        )

    return WorkspaceMembersResponse(workspace_id=workspace_id, items=items)


async def _pg_add_workspace_member(
    workspace_id: str,
    payload: WorkspaceMemberAddPayload,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceMemberResponse:
    role = payload.role
    if role == "owner":
        raise HTTPException(status_code=400, detail="Le rôle owner ne peut pas être attribué via cette route")
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    email = normalize_email(payload.email)
    now = datetime.utcnow()
    user = await db["users"].find_one({"email": email})
    target_actor_id = await _ensure_pg_actor_id_for_user_doc(db, user) if user else None

    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            if target_actor_id:
                _pg_upsert_auth_user(cur, target_actor_id, email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select w.owner_id::text as owner_id, wm.role
                from app.workspaces w
                left join app.workspace_members wm
                  on wm.workspace_id = w.id
                 and wm.user_id = %s::uuid
                where w.id = %s::uuid
                limit 1;
                """,
                (actor_id, workspace_id),
            )
            authz_row = dict(cur.fetchone() or {})
            if not authz_row:
                raise HTTPException(status_code=404, detail="Workspace introuvable")
            requester_role = "owner" if authz_row.get("owner_id") == actor_id else str(authz_row.get("role") or "")
            if requester_role not in {"owner", "admin"}:
                raise HTTPException(status_code=403, detail="Permissions insuffisantes")

            if target_actor_id:
                cur.execute(
                    """
                    insert into app.workspace_members(workspace_id, user_id, role, created_at)
                    values (%s::uuid, %s::uuid, %s, %s)
                    on conflict (workspace_id, user_id) do nothing
                    returning user_id::text as user_id;
                    """,
                    (workspace_id, target_actor_id, role, now),
                )
                inserted = cur.fetchone()
                if not inserted:
                    raise HTTPException(status_code=409, detail="Utilisateur déjà membre du workspace")
                cur.execute(
                    """
                    delete from app.workspace_invites
                    where workspace_id = %s::uuid
                      and lower(email) = lower(%s);
                    """,
                    (workspace_id, email),
                )
            else:
                invite_id = str(uuid.uuid4())
                invite_token = str(uuid.uuid4())
                cur.execute(
                    """
                    insert into app.workspace_invites(
                      id, workspace_id, email, role, token, status, invited_by, invited_at, accepted_at
                    )
                    values (
                      %s::uuid, %s::uuid, %s, %s, %s, 'pending', %s::uuid, %s, null
                    )
                    on conflict (workspace_id, email)
                    do update set
                      role = excluded.role,
                      token = excluded.token,
                      status = 'pending',
                      invited_by = excluded.invited_by,
                      invited_at = excluded.invited_at,
                      accepted_at = null;
                    """,
                    (invite_id, workspace_id, email, role, invite_token, actor_id, now),
                )
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres member add error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    if target_actor_id:
        return WorkspaceMemberResponse(
            user_id=target_actor_id,
            email=email,
            first_name=user.get("first_name") if user else None,
            last_name=user.get("last_name") if user else None,
            role=role,
            status="active",
            joined_at=now,
            invited_at=now,
        )
    return WorkspaceMemberResponse(
        user_id=None,
        email=email,
        first_name=None,
        last_name=None,
        role=role,
        status="pending",
        joined_at=None,
        invited_at=now,
    )


async def _mongo_add_workspace_member(
    workspace_id: str,
    payload: WorkspaceMemberAddPayload,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> WorkspaceMemberResponse:
    workspace_oid = to_object_id(workspace_id)
    _, requester_membership = await _get_workspace_for_member(db, workspace_oid, current["_id"])
    if not _workspace_role_can_manage(requester_membership):
        raise HTTPException(status_code=403, detail="Permissions insuffisantes")

    role = payload.role
    if role == "owner":
        raise HTTPException(status_code=400, detail="Le rôle owner ne peut pas être attribué via cette route")
    email = normalize_email(payload.email)
    now = datetime.utcnow()

    user = await db["users"].find_one({"email": email})
    if user:
        existing = await db[WORKSPACE_MEMBERS_COLLECTION].find_one(
            {"workspace_id": workspace_oid, "user_id": user["_id"], "status": "active"}
        )
        if existing:
            raise HTTPException(status_code=409, detail="Utilisateur déjà membre du workspace")

        await db[WORKSPACE_MEMBERS_COLLECTION].insert_one(
            {
                "workspace_id": workspace_oid,
                "user_id": user["_id"],
                "email": email,
                "role": role,
                "status": "active",
                "joined_at": now,
                "invited_at": now,
                "invited_by": current["_id"],
                "created_at": now,
                "updated_at": now,
            }
        )
        return WorkspaceMemberResponse(
            user_id=str(user["_id"]),
            email=email,
            first_name=user.get("first_name"),
            last_name=user.get("last_name"),
            role=role,
            status="active",
            joined_at=now,
            invited_at=now,
        )

    existing_invite = await db[WORKSPACE_MEMBERS_COLLECTION].find_one(
        {"workspace_id": workspace_oid, "email": email, "status": "pending"}
    )
    if existing_invite:
        raise HTTPException(status_code=409, detail="Invitation déjà envoyée")

    await db[WORKSPACE_MEMBERS_COLLECTION].insert_one(
        {
            "workspace_id": workspace_oid,
            "email": email,
            "role": role,
            "status": "pending",
            "invited_at": now,
            "invited_by": current["_id"],
            "created_at": now,
            "updated_at": now,
        }
    )
    return WorkspaceMemberResponse(
        user_id=None,
        email=email,
        first_name=None,
        last_name=None,
        role=role,
        status="pending",
        joined_at=None,
        invited_at=now,
    )


async def _pg_delete_workspace_member(
    workspace_id: str,
    user_id: str,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> dict:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select w.owner_id::text as owner_id, wm.role
                from app.workspaces w
                left join app.workspace_members wm
                  on wm.workspace_id = w.id
                 and wm.user_id = %s::uuid
                where w.id = %s::uuid
                limit 1;
                """,
                (actor_id, workspace_id),
            )
            authz_row = dict(cur.fetchone() or {})
            if not authz_row:
                raise HTTPException(status_code=404, detail="Workspace introuvable")
            requester_role = "owner" if authz_row.get("owner_id") == actor_id else str(authz_row.get("role") or "")
            if requester_role not in {"owner", "admin"}:
                raise HTTPException(status_code=403, detail="Permissions insuffisantes")
            if str(authz_row.get("owner_id") or "") == user_id:
                raise HTTPException(status_code=400, detail="Le propriétaire ne peut pas être supprimé")

            cur.execute(
                """
                delete from app.workspace_members
                where workspace_id = %s::uuid
                  and user_id = %s::uuid
                returning user_id::text;
                """,
                (workspace_id, user_id),
            )
            deleted = cur.fetchone()
            if not deleted:
                raise HTTPException(status_code=404, detail="Membre introuvable")
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres member delete error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return {"ok": True}


async def _mongo_delete_workspace_member(
    workspace_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> dict:
    workspace_oid = to_object_id(workspace_id)
    _, requester_membership = await _get_workspace_for_member(db, workspace_oid, current["_id"])
    if not _workspace_role_can_manage(requester_membership):
        raise HTTPException(status_code=403, detail="Permissions insuffisantes")

    target_user_oid = to_object_id(user_id)
    target = await db[WORKSPACE_MEMBERS_COLLECTION].find_one(
        {"workspace_id": workspace_oid, "user_id": target_user_oid, "status": "active"}
    )
    if not target:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    if _workspace_role(target) == "owner":
        raise HTTPException(status_code=400, detail="Le propriétaire ne peut pas être supprimé")

    await db[WORKSPACE_MEMBERS_COLLECTION].delete_one(
        {"workspace_id": workspace_oid, "user_id": target_user_oid}
    )
    return {"ok": True}


def _as_uuid_or_none(raw: Any, field_name: str) -> str | None:
    if raw is None:
        return None
    value = str(raw).strip()
    if not value:
        return None
    try:
        return str(uuid.UUID(value))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} must be a UUID") from exc


def _normalize_pg_collaborators(raw: Any) -> list[str] | None:
    if raw is None:
        return None
    if not isinstance(raw, list):
        raise HTTPException(status_code=400, detail="collaborator_ids must be a list")
    result: list[str] = []
    for value in raw:
        parsed = _as_uuid_or_none(value, "collaborator_ids")
        if parsed:
            result.append(parsed)
    return result


def _normalize_pg_task_payload(payload: dict[str, Any], *, now: datetime, for_update: bool) -> dict[str, Any]:
    doc = payload.copy()

    for field_name in ("workspace_id", "project_id", "assignee_user_id", "assignee_id"):
        if field_name in doc:
            doc[field_name] = _as_uuid_or_none(doc.get(field_name), field_name)

    if "assignee_user_id" in doc and "assignee_id" not in doc:
        doc["assignee_id"] = doc.get("assignee_user_id")
    if "assignee_id" in doc and "assignee_user_id" not in doc:
        doc["assignee_user_id"] = doc.get("assignee_id")

    if "collaborator_ids" in doc:
        doc["collaborator_ids"] = _normalize_pg_collaborators(doc.get("collaborator_ids"))

    if "estimated_duration_minutes" in doc and "estimated_minutes" not in doc:
        doc["estimated_minutes"] = doc.get("estimated_duration_minutes")
    if "estimated_minutes" in doc and "estimated_duration_minutes" not in doc:
        doc["estimated_duration_minutes"] = doc.get("estimated_minutes")

    due_datetime = doc.get("due_datetime")
    due_date = doc.get("due_date")
    if due_datetime and not due_date and isinstance(due_datetime, datetime):
        doc["due_date"] = due_datetime.date()
    if due_date and not due_datetime and isinstance(due_date, date):
        doc["due_datetime"] = datetime.combine(due_date, datetime.min.time())

    done_at = _coerce_datetime_or_none(doc.get("done_at"))
    if done_at is not None:
        doc["done_at"] = done_at
    elif "done_at" in doc:
        doc["done_at"] = None

    if not for_update:
        if doc.get("context_type") is None:
            doc["context_type"] = "personal"
        if doc.get("priority_eisenhower") is None:
            doc["priority_eisenhower"] = "important_not_urgent"
        if doc.get("kanban_state") is None:
            doc["kanban_state"] = "todo"
        if doc.get("status") is None:
            doc["status"] = "todo"
        if doc.get("high_impact") is None:
            doc["high_impact"] = False
        if doc.get("source") is None:
            doc["source"] = "manual"
        if doc.get("kanban_state") == "done" and not doc.get("completed_at"):
            doc["completed_at"] = now
        if doc.get("status") == "done" and not doc.get("done_at"):
            doc["done_at"] = now
    else:
        if doc.get("status") is None:
            doc.pop("status", None)
        if "kanban_state" in doc and "completed_at" not in doc:
            if doc.get("kanban_state") == "done":
                doc["completed_at"] = now
            else:
                doc["completed_at"] = None

    return doc


def _pg_task_access_sql(alias: str = "t") -> str:
    return (
        f"({alias}.owner_id = %s::uuid or ("
        f"{alias}.workspace_id is not null and exists ("
        f"select 1 from app.workspace_members wm "
        f"where wm.workspace_id = {alias}.workspace_id "
        f"and wm.user_id = %s::uuid "
        f"and coalesce(wm.status, 'active') = 'active'"
        f")))"
    )


def _pg_task_select_sql(where_sql: str, order_sql: str = "", limit_sql: str = "") -> str:
    return f"""
    select
      t.id::text as id,
      t.owner_id::text as owner_id,
      t.workspace_id::text as workspace_id,
      t.project_id::text as project_id,
      t.title,
      t.description,
      t.category,
      t.context_type,
      t.context_id,
      t.priority_eisenhower,
      t.kanban_state,
      t.high_impact,
      t.estimated_duration_minutes,
      t.start_datetime,
      t.due_datetime,
      t.linked_goal,
      t.moscow,
      t.status,
      t.energy_level,
      t.pomodoro_estimated,
      t.pomodoro_done,
      t.comments,
      t.assignee_user_id::text as assignee_user_id,
      t.collaborator_ids::text[] as collaborator_ids,
      t.source,
      t.completed_at,
      t.done_at,
      t.priority,
      t.due_date,
      t.start_at,
      t.end_at,
      t.estimated_minutes,
      t.spent_minutes,
      t.assignee_id::text as assignee_id,
      t.created_at,
      t.updated_at
    from app.tasks t
    {where_sql}
    {order_sql}
    {limit_sql}
    """


def _serialize_pg_task(row: dict[str, Any]) -> TaskResponse:
    collaborators = row.get("collaborator_ids") or []
    if collaborators and isinstance(collaborators, list):
        collaborators = [str(v) for v in collaborators if v]
    payload = {
        "id": str(row.get("id") or ""),
        "user_id": str(row.get("owner_id") or ""),
        "workspace_id": str(row.get("workspace_id")) if row.get("workspace_id") else None,
        "project_id": str(row.get("project_id")) if row.get("project_id") else None,
        "title": row.get("title") or "",
        "description": row.get("description"),
        "category": row.get("category"),
        "context_type": row.get("context_type") or "personal",
        "context_id": row.get("context_id"),
        "priority_eisenhower": row.get("priority_eisenhower") or "important_not_urgent",
        "kanban_state": row.get("kanban_state") or "todo",
        "high_impact": bool(row.get("high_impact")),
        "estimated_duration_minutes": row.get("estimated_duration_minutes"),
        "start_datetime": _serialize_datetime(row.get("start_datetime")),
        "due_datetime": _serialize_datetime(row.get("due_datetime")),
        "completed_at": _serialize_datetime(row.get("completed_at")),
        "linked_goal": row.get("linked_goal"),
        "moscow": row.get("moscow"),
        "status": row.get("status"),
        "energy_level": row.get("energy_level"),
        "pomodoro_estimated": row.get("pomodoro_estimated"),
        "pomodoro_done": row.get("pomodoro_done"),
        "comments": row.get("comments"),
        "assignee_user_id": str(row.get("assignee_user_id")) if row.get("assignee_user_id") else None,
        "assignee_id": str(row.get("assignee_id")) if row.get("assignee_id") else None,
        "collaborator_ids": collaborators,
        "source": row.get("source") or "manual",
        "priority": row.get("priority"),
        "due_date": row.get("due_date"),
        "start_at": _serialize_datetime(row.get("start_at")),
        "end_at": _serialize_datetime(row.get("end_at")),
        "estimated_minutes": row.get("estimated_minutes"),
        "spent_minutes": row.get("spent_minutes"),
        "created_at": _serialize_datetime(row.get("created_at")),
        "updated_at": _serialize_datetime(row.get("updated_at")),
    }
    return TaskResponse(**payload)


def _pg_assert_workspace_access(cur: RealDictCursor, workspace_id: str, actor_id: str) -> None:
    cur.execute(
        """
        select 1
        from app.workspaces w
        where w.id = %s::uuid
          and (
            w.owner_id = %s::uuid
            or exists (
                select 1
                from app.workspace_members wm
                where wm.workspace_id = w.id
                  and wm.user_id = %s::uuid
                  and coalesce(wm.status, 'active') = 'active'
            )
          )
        limit 1;
        """,
        (workspace_id, actor_id, actor_id),
    )
    if not cur.fetchone():
        raise HTTPException(status_code=403, detail="Workspace access denied")


def _pg_assert_assignee(cur: RealDictCursor, assignee_id: str, workspace_id: str | None, actor_id: str) -> None:
    if not workspace_id:
        if assignee_id != actor_id:
            raise HTTPException(status_code=400, detail="assignee_id requires workspace_id")
        return
    cur.execute(
        """
        select 1
        from app.workspace_members wm
        where wm.workspace_id = %s::uuid
          and wm.user_id = %s::uuid
          and coalesce(wm.status, 'active') = 'active'
        limit 1;
        """,
        (workspace_id, assignee_id),
    )
    if not cur.fetchone():
        raise HTTPException(status_code=400, detail="assignee_id is not an active member of workspace")


async def _pg_list_tasks(
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
    *,
    kanban_state: Optional[str],
    high_impact: Optional[bool],
    context_type: Optional[str],
    context_id: Optional[str],
    workspace_id: Optional[str],
    date_filter: Optional[str],
    week_start: Optional[str],
    page: int,
    limit: int,
) -> TaskListResponse:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    params: list[Any] = [actor_id, actor_id]
    where_clauses: list[str] = [_pg_task_access_sql("t")]
    if kanban_state:
        where_clauses.append("t.kanban_state = %s")
        params.append(kanban_state)
    if high_impact is not None:
        where_clauses.append("t.high_impact = %s")
        params.append(bool(high_impact))
    if context_type:
        where_clauses.append("t.context_type = %s")
        params.append(context_type)
    if context_id:
        where_clauses.append("t.context_id = %s")
        params.append(context_id)
    if workspace_id:
        workspace_uuid = _as_uuid_or_none(workspace_id, "workspace_id")
        if not workspace_uuid:
            raise HTTPException(status_code=400, detail="workspace_id must be a UUID")
        where_clauses.append("t.workspace_id = %s::uuid")
        params.append(workspace_uuid)
    date_range = _parse_date_filter(date_filter)
    if date_range:
        start, end = date_range
        where_clauses.append("((t.start_datetime >= %s and t.start_datetime < %s) or (t.due_datetime >= %s and t.due_datetime < %s))")
        params.extend([start, end, start, end])
    elif week_start:
        weekly = _parse_date_filter(week_start)
        if weekly:
            start, _ = weekly
            end = start + timedelta(days=7)
            where_clauses.append("t.due_datetime >= %s and t.due_datetime <= %s")
            params.extend([start, end])
    where_sql = "where " + " and ".join(where_clauses)
    offset = (page - 1) * limit
    list_sql = _pg_task_select_sql(
        where_sql=where_sql,
        order_sql="order by t.high_impact desc, t.due_datetime asc nulls last, t.created_at desc",
        limit_sql="limit %s offset %s",
    )
    count_sql = f"select count(*)::int as total from app.tasks t {where_sql}"
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(list_sql, tuple(params + [limit, offset]))
            rows = [dict(r) for r in cur.fetchall()]
            cur.execute(count_sql, tuple(params))
            total_row = dict(cur.fetchone() or {})
        conn.commit()
    except Exception as exc:
        try:
            if conn is not None:
                conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"postgres tasks list error: {exc.__class__.__name__}")
    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass

    items = [_serialize_pg_task(row) for row in rows]
    total = int(total_row.get("total") or 0)
    has_more = page * limit < total
    return TaskListResponse(items=items, total=total, has_more=has_more)


async def _pg_create_task(
    payload: TaskCreatePayload,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> TaskResponse:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    now = datetime.utcnow()
    doc = _normalize_pg_task_payload(payload.dict(), now=now, for_update=False)
    _validate_dates(doc)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            workspace_uuid = _as_uuid_or_none(doc.get("workspace_id"), "workspace_id")
            if workspace_uuid:
                _pg_assert_workspace_access(cur, workspace_uuid, actor_id)
            assignee_uuid = _as_uuid_or_none(doc.get("assignee_id"), "assignee_id")
            if assignee_uuid:
                _pg_assert_assignee(cur, assignee_uuid, workspace_uuid, actor_id)
            cur.execute(
                """
                insert into app.tasks(
                  owner_id,workspace_id,project_id,title,description,category,context_type,context_id,
                  priority_eisenhower,kanban_state,high_impact,estimated_duration_minutes,start_datetime,due_datetime,
                  linked_goal,moscow,status,energy_level,pomodoro_estimated,pomodoro_done,comments,
                  assignee_user_id,collaborator_ids,source,completed_at,done_at,
                  priority,due_date,start_at,end_at,estimated_minutes,spent_minutes,assignee_id,created_at,updated_at
                ) values (
                  %s::uuid,%s::uuid,%s::uuid,%s,%s,%s,%s,%s,
                  %s,%s,%s,%s,%s,%s,
                  %s,%s,%s,%s,%s,%s,%s,
                  %s::uuid,%s::uuid[],%s,%s,%s,
                  %s,%s,%s,%s,%s,%s,%s::uuid,%s,%s
                )
                returning id::text as id;
                """,
                (
                    actor_id,
                    workspace_uuid,
                    _as_uuid_or_none(doc.get("project_id"), "project_id"),
                    doc.get("title"),
                    doc.get("description"),
                    doc.get("category"),
                    doc.get("context_type"),
                    doc.get("context_id"),
                    doc.get("priority_eisenhower"),
                    doc.get("kanban_state"),
                    bool(doc.get("high_impact")),
                    doc.get("estimated_duration_minutes"),
                    doc.get("start_datetime"),
                    doc.get("due_datetime"),
                    doc.get("linked_goal"),
                    doc.get("moscow"),
                    doc.get("status"),
                    doc.get("energy_level"),
                    doc.get("pomodoro_estimated"),
                    doc.get("pomodoro_done"),
                    doc.get("comments"),
                    _as_uuid_or_none(doc.get("assignee_user_id"), "assignee_user_id"),
                    doc.get("collaborator_ids") or [],
                    doc.get("source"),
                    doc.get("completed_at"),
                    doc.get("done_at"),
                    doc.get("priority"),
                    doc.get("due_date"),
                    doc.get("start_at"),
                    doc.get("end_at"),
                    doc.get("estimated_minutes"),
                    doc.get("spent_minutes"),
                    assignee_uuid,
                    now,
                    now,
                ),
            )
            created_row = dict(cur.fetchone() or {})
            created_id = str(created_row.get("id") or "")
            if created_id:
                cur.execute(
                    _pg_task_select_sql(where_sql="where t.id = %s::uuid", limit_sql="limit 1"),
                    (created_id,),
                )
                row = dict(cur.fetchone() or {})
            else:
                row = {}
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        logger.exception("postgres task create failed")
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres task create error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    if not row:
        raise HTTPException(status_code=500, detail="postgres task create error")
    return _serialize_pg_task(row)


async def _pg_get_task_for_actor(cur: RealDictCursor, task_id: str, actor_id: str) -> dict[str, Any] | None:
    cur.execute(
        _pg_task_select_sql(where_sql=f"where t.id = %s::uuid and {_pg_task_access_sql('t')}", limit_sql="limit 1"),
        (task_id, actor_id, actor_id),
    )
    row = cur.fetchone()
    return dict(row) if row else None


async def _pg_update_task(
    task_id: str,
    payload: TaskUpdatePayload,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> TaskResponse:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    task_uuid = _as_uuid_or_none(task_id, "task_id")
    if not task_uuid:
        if _looks_like_object_id(task_id):
            mapped_task_uuid = await _pg_find_pg_id_by_mongo_id(actor_id, actor_email, task_id)
            if not mapped_task_uuid:
                raise HTTPException(status_code=404, detail="Tâche introuvable")
            task_uuid = mapped_task_uuid
        else:
            raise HTTPException(status_code=400, detail="task_id must be a UUID or ObjectId")
    updates = payload.dict(exclude_unset=True)
    now = datetime.utcnow()
    updates = _normalize_pg_task_payload(updates, now=now, for_update=True)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            existing = await _pg_get_task_for_actor(cur, task_uuid, actor_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Tâche introuvable")
            if not updates:
                conn.commit()
                return _serialize_pg_task(existing)

            effective_workspace = updates.get("workspace_id", existing.get("workspace_id"))
            if effective_workspace:
                _pg_assert_workspace_access(cur, str(effective_workspace), actor_id)
            effective_assignee = updates.get("assignee_id", updates.get("assignee_user_id"))
            if effective_assignee is None:
                effective_assignee = existing.get("assignee_id") or existing.get("assignee_user_id")
            if effective_assignee:
                _pg_assert_assignee(cur, str(effective_assignee), str(effective_workspace) if effective_workspace else None, actor_id)

            merged = {**existing, **updates}
            _validate_dates(merged)

            allowed_fields = {
                "workspace_id",
                "project_id",
                "title",
                "description",
                "category",
                "context_type",
                "context_id",
                "priority_eisenhower",
                "kanban_state",
                "high_impact",
                "estimated_duration_minutes",
                "start_datetime",
                "due_datetime",
                "linked_goal",
                "moscow",
                "status",
                "energy_level",
                "pomodoro_estimated",
                "pomodoro_done",
                "comments",
                "assignee_user_id",
                "assignee_id",
                "collaborator_ids",
                "source",
                "completed_at",
                "priority",
                "due_date",
                "start_at",
                "end_at",
                "estimated_minutes",
                "spent_minutes",
            }
            set_parts: list[str] = []
            params: list[Any] = []
            for key, value in updates.items():
                if key not in allowed_fields:
                    continue
                if key in {"workspace_id", "project_id", "assignee_user_id", "assignee_id"}:
                    set_parts.append(f"{key} = %s::uuid")
                    params.append(value)
                elif key == "collaborator_ids":
                    set_parts.append("collaborator_ids = %s::uuid[]")
                    params.append(value or [])
                else:
                    set_parts.append(f"{key} = %s")
                    params.append(value)
            # Keep first completion timestamp for analytics history.
            if updates.get("status") == "done":
                set_parts.append("done_at = coalesce(done_at, now())")
            if not set_parts:
                conn.commit()
                return _serialize_pg_task(existing)

            cur.execute(
                f"""
                update app.tasks
                set {', '.join(set_parts)}, updated_at = now()
                where id = %s::uuid
                  and {_pg_task_access_sql('app.tasks')}
                returning id::text as id;
                """,
                tuple(params + [task_uuid, actor_id, actor_id]),
            )
            updated_row = dict(cur.fetchone() or {})
            updated_id = str(updated_row.get("id") or "")
            if not updated_id:
                raise HTTPException(status_code=404, detail="Tâche introuvable")
            cur.execute(
                _pg_task_select_sql(where_sql="where t.id = %s::uuid", limit_sql="limit 1"),
                (updated_id,),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres task update error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    if not row:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    return _serialize_pg_task(row)


async def _pg_delete_task(
    task_id: str,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> str:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    task_uuid = _as_uuid_or_none(task_id, "task_id")
    if not task_uuid:
        if _looks_like_object_id(task_id):
            mapped_task_uuid = await _pg_find_pg_id_by_mongo_id(actor_id, actor_email, task_id)
            if not mapped_task_uuid:
                raise HTTPException(status_code=404, detail="Tâche introuvable")
            task_uuid = mapped_task_uuid
        else:
            raise HTTPException(status_code=400, detail="task_id must be a UUID or ObjectId")
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                f"delete from app.tasks where id = %s::uuid and {_pg_task_access_sql('app.tasks')} returning id::text;",
                (task_uuid, actor_id, actor_id),
            )
            deleted = cur.fetchone()
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres task delete error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    if not deleted:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    deleted_id: str | None = None
    if isinstance(deleted, dict):
        deleted_id = str(deleted.get("id") or "")
    elif isinstance(deleted, (tuple, list)) and deleted:
        deleted_id = str(deleted[0] or "")
    return deleted_id or task_uuid


async def _pg_bulk_create_tasks(
    payload: List[TaskCreatePayload],
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> TaskListResponse:
    if not payload:
        return TaskListResponse(items=[])
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    now = datetime.utcnow()
    docs = [_normalize_pg_task_payload(item.dict(), now=now, for_update=False) for item in payload]
    for doc in docs:
        _validate_dates(doc)
    dsn = _pg_dsn()
    conn = None
    inserted: list[TaskResponse] = []
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            titles = [str(d.get("title") or "") for d in docs if d.get("title")]
            skip_keys: set[tuple[str, date | None]] = set()
            if titles:
                cur.execute(
                    """
                    select title, due_date
                    from app.tasks
                    where owner_id = %s::uuid
                      and source = 'ia'
                      and title = any(%s);
                    """,
                    (actor_id, titles),
                )
                for row in cur.fetchall():
                    rec = dict(row)
                    skip_keys.add((str(rec.get("title") or ""), rec.get("due_date")))

            for doc in docs:
                title = str(doc.get("title") or "")
                dedupe_due = doc.get("due_date")
                if doc.get("source") == "ia" and (title, dedupe_due) in skip_keys:
                    continue
                workspace_uuid = _as_uuid_or_none(doc.get("workspace_id"), "workspace_id")
                if workspace_uuid:
                    _pg_assert_workspace_access(cur, workspace_uuid, actor_id)
                assignee_uuid = _as_uuid_or_none(doc.get("assignee_id"), "assignee_id")
                if assignee_uuid:
                    _pg_assert_assignee(cur, assignee_uuid, workspace_uuid, actor_id)
                cur.execute(
                    """
                    insert into app.tasks(
                      owner_id,workspace_id,project_id,title,description,category,context_type,context_id,
                      priority_eisenhower,kanban_state,high_impact,estimated_duration_minutes,start_datetime,due_datetime,
                      linked_goal,moscow,status,energy_level,pomodoro_estimated,pomodoro_done,comments,
                      assignee_user_id,collaborator_ids,source,completed_at,done_at,
                      priority,due_date,start_at,end_at,estimated_minutes,spent_minutes,assignee_id,created_at,updated_at
                    ) values (
                      %s::uuid,%s::uuid,%s::uuid,%s,%s,%s,%s,%s,
                      %s,%s,%s,%s,%s,%s,
                      %s,%s,%s,%s,%s,%s,%s,
                      %s::uuid,%s::uuid[],%s,%s,%s,
                      %s,%s,%s,%s,%s,%s,%s::uuid,%s,%s
                    )
                    returning id::text as id;
                    """,
                    (
                        actor_id,
                        workspace_uuid,
                        _as_uuid_or_none(doc.get("project_id"), "project_id"),
                        doc.get("title"),
                        doc.get("description"),
                        doc.get("category"),
                        doc.get("context_type"),
                        doc.get("context_id"),
                        doc.get("priority_eisenhower"),
                        doc.get("kanban_state"),
                        bool(doc.get("high_impact")),
                        doc.get("estimated_duration_minutes"),
                        doc.get("start_datetime"),
                        doc.get("due_datetime"),
                        doc.get("linked_goal"),
                        doc.get("moscow"),
                        doc.get("status"),
                        doc.get("energy_level"),
                        doc.get("pomodoro_estimated"),
                        doc.get("pomodoro_done"),
                        doc.get("comments"),
                        _as_uuid_or_none(doc.get("assignee_user_id"), "assignee_user_id"),
                        doc.get("collaborator_ids") or [],
                        doc.get("source"),
                        doc.get("completed_at"),
                        doc.get("done_at"),
                        doc.get("priority"),
                        doc.get("due_date"),
                        doc.get("start_at"),
                        doc.get("end_at"),
                        doc.get("estimated_minutes"),
                        doc.get("spent_minutes"),
                        assignee_uuid,
                        now,
                        now,
                    ),
                )
                created_row = dict(cur.fetchone() or {})
                created_id = str(created_row.get("id") or "")
                if created_id:
                    cur.execute(
                        _pg_task_select_sql(where_sql="where t.id = %s::uuid", limit_sql="limit 1"),
                        (created_id,),
                    )
                    row = dict(cur.fetchone() or {})
                    if row:
                        inserted.append(_serialize_pg_task(row))
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres task bulk create error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return TaskListResponse(items=inserted)


def _coerce_mongo_object_id(raw: Any) -> ObjectId | None:
    if isinstance(raw, ObjectId):
        return raw
    if isinstance(raw, str) and _looks_like_object_id(raw):
        try:
            return ObjectId(raw)
        except Exception:
            return None
    return None


async def _dual_create_task(
    payload: TaskCreatePayload,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> TaskResponse:
    now = datetime.utcnow()
    mongo_doc = _prepare_task_payload(payload.dict())
    _validate_dates(mongo_doc)
    mongo_doc["user_id"] = current["_id"]
    mongo_doc["source"] = mongo_doc.get("source") or "manual"
    if mongo_doc.get("kanban_state") == "done" and not mongo_doc.get("completed_at"):
        mongo_doc["completed_at"] = now
    mongo_doc["created_at"] = now
    mongo_doc["updated_at"] = now
    mongo_insert = await db[COLLECTION].insert_one(mongo_doc)
    mongo_oid = mongo_insert.inserted_id
    mongo_id = str(mongo_oid)
    pg_task: TaskResponse | None = None
    try:
        pg_task = await _pg_create_task(payload, request, db, current)
        actor_id = await _resolve_pg_actor_id(db, current, _parse_bearer_token(request))
        await _pg_upsert_task_id_map(actor_id, str(current.get("email") or ""), mongo_id, pg_task.id)
        await db[COLLECTION].update_one(
            {"_id": mongo_oid},
            {"$set": {"pg_task_id": pg_task.id, "updated_at": datetime.utcnow()}},
        )
        return pg_task
    except HTTPException:
        if pg_task is not None:
            try:
                await _pg_delete_task(pg_task.id, request, db, current)
            except Exception:
                logger.exception("dual create rollback failed for pg task_id=%s", pg_task.id)
        await db[COLLECTION].delete_one({"_id": mongo_oid})
        raise
    except Exception:
        if pg_task is not None:
            try:
                await _pg_delete_task(pg_task.id, request, db, current)
            except Exception:
                logger.exception("dual create rollback failed for pg task_id=%s", pg_task.id)
        await db[COLLECTION].delete_one({"_id": mongo_oid})
        raise


async def _dual_update_task(
    task_id: str,
    payload: TaskUpdatePayload,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> TaskResponse:
    pg_task = await _pg_update_task(task_id, payload, request, db, current)
    updates = payload.dict(exclude_unset=True)
    if not updates:
        return pg_task

    actor_id = await _resolve_pg_actor_id(db, current, _parse_bearer_token(request))
    actor_email = str(current.get("email") or "")
    mongo_id: str | None = task_id if _looks_like_object_id(task_id) else None
    if not mongo_id:
        mongo_id = await _pg_find_mongo_id_by_pg_id(actor_id, actor_email, pg_task.id)
    if not mongo_id or not _looks_like_object_id(mongo_id):
        return pg_task

    mongo_oid = ObjectId(mongo_id)
    existing = await db[COLLECTION].find_one({"_id": mongo_oid, "user_id": current["_id"]})
    if not existing:
        # Tolerate "not found" on one store in dual mode.
        return pg_task

    mongo_updates = _prepare_task_payload(updates)
    _validate_dates({**existing, **mongo_updates})
    now = datetime.utcnow()
    if "kanban_state" in mongo_updates:
        new_state = mongo_updates["kanban_state"]
        if new_state == "done" and not existing.get("completed_at"):
            mongo_updates["completed_at"] = now
        elif new_state != "done":
            mongo_updates["completed_at"] = None
    mongo_updates["updated_at"] = now
    mongo_updates["pg_task_id"] = pg_task.id

    await db[COLLECTION].update_one(
        {"_id": mongo_oid, "user_id": current["_id"]},
        {"$set": mongo_updates},
    )
    return pg_task


async def _dual_delete_task(
    task_id: str,
    request: Request,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> None:
    actor_id = await _resolve_pg_actor_id(db, current, _parse_bearer_token(request))
    actor_email = str(current.get("email") or "")
    mongo_id: str | None = task_id if _looks_like_object_id(task_id) else None

    deleted_pg_id = await _pg_delete_task(task_id, request, db, current)

    if not mongo_id:
        mongo_id = await _pg_find_mongo_id_by_pg_id(actor_id, actor_email, deleted_pg_id)
    if mongo_id and _looks_like_object_id(mongo_id):
        await db[COLLECTION].delete_one({"_id": ObjectId(mongo_id), "user_id": current["_id"]})

    try:
        await _pg_delete_task_id_map(actor_id, actor_email, pg_id=deleted_pg_id, mongo_id=mongo_id)
    except Exception:
        logger.exception("task_id_map cleanup failed for pg_id=%s", deleted_pg_id)


async def _run_mongo_to_pg_tasks_backfill(
    db: AsyncIOMotorDatabase,
    *,
    batch: int,
) -> dict[str, Any]:
    dsn = _pg_dsn()
    conn = None
    processed = 0
    inserted = 0
    updated = 0
    last_id: str | None = None
    user_cache: dict[str, dict] = {}
    checkpoint: str | None = None

    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        migration_actor_id = "00000000-0000-0000-0000-000000000000"
        migration_actor_email = "migration@koryxa.local"
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, migration_actor_id, migration_actor_email)
            _pg_set_rls_actor(cur, migration_actor_id)
            cur.execute("select value from app.migration_state where key = 'tasks_backfill_last_id' limit 1;")
            row = dict(cur.fetchone() or {})
            checkpoint = str(row.get("value") or "").strip() or None

        query: dict[str, Any] = {}
        if checkpoint and _looks_like_object_id(checkpoint):
            query["_id"] = {"$gt": ObjectId(checkpoint)}
        docs = await db[COLLECTION].find(query).sort("_id", 1).limit(batch).to_list(length=batch)
        if not docs:
            if conn is not None:
                conn.commit()
            return {"processed": 0, "inserted": 0, "updated": 0, "last_id": checkpoint}

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            for doc in docs:
                mongo_oid = doc.get("_id")
                if not isinstance(mongo_oid, ObjectId):
                    continue
                mongo_id = str(mongo_oid)
                last_id = mongo_id

                user_oid = _coerce_mongo_object_id(doc.get("user_id"))
                if not user_oid:
                    continue
                cache_key = str(user_oid)
                user_doc = user_cache.get(cache_key)
                if user_doc is None:
                    user_doc = await db["users"].find_one({"_id": user_oid}) or {}
                    user_cache[cache_key] = user_doc
                if not user_doc:
                    continue

                actor_id = await _ensure_pg_actor_id_for_user_doc(db, user_doc)
                _pg_set_rls_actor(cur, actor_id)

                cur.execute(
                    "select pg_id::text as pg_id from app.task_id_map where mongo_id = %s limit 1;",
                    (mongo_id,),
                )
                map_row = dict(cur.fetchone() or {})
                pg_id = str(map_row.get("pg_id") or "") or str(uuid.uuid4())
                cur.execute(
                    """
                    insert into app.task_id_map(mongo_id, pg_id, owner_id, created_at)
                    values (%s, %s::uuid, %s::uuid, now())
                    on conflict (mongo_id) do update
                      set pg_id = excluded.pg_id,
                          owner_id = excluded.owner_id;
                    """,
                    (mongo_id, pg_id, actor_id),
                )

                pg_doc = _mongo_task_to_pg_task_doc(doc)

                workspace_uuid = _coerce_uuid_text(pg_doc.get("workspace_id"))
                if workspace_uuid:
                    cur.execute(
                        """
                        select 1
                        from app.workspace_members wm
                        where wm.workspace_id = %s::uuid
                          and wm.user_id = %s::uuid
                          and coalesce(wm.status, 'active') = 'active'
                        limit 1;
                        """,
                        (workspace_uuid, actor_id),
                    )
                    if not cur.fetchone():
                        workspace_uuid = None

                assignee_uuid = _coerce_uuid_text(pg_doc.get("assignee_id") or pg_doc.get("assignee_user_id"))
                if assignee_uuid and not workspace_uuid and assignee_uuid != actor_id:
                    assignee_uuid = None
                if assignee_uuid and workspace_uuid:
                    cur.execute(
                        """
                        select 1
                        from app.workspace_members wm
                        where wm.workspace_id = %s::uuid
                          and wm.user_id = %s::uuid
                          and coalesce(wm.status, 'active') = 'active'
                        limit 1;
                        """,
                        (workspace_uuid, assignee_uuid),
                    )
                    if not cur.fetchone():
                        assignee_uuid = None

                cur.execute("select 1 from app.tasks where id = %s::uuid limit 1;", (pg_id,))
                existed = cur.fetchone() is not None

                cur.execute(
                    """
                    insert into app.tasks(
                      id,owner_id,workspace_id,project_id,title,description,category,context_type,context_id,
                      priority_eisenhower,kanban_state,high_impact,estimated_duration_minutes,start_datetime,due_datetime,
                      linked_goal,moscow,status,energy_level,pomodoro_estimated,pomodoro_done,comments,
                      assignee_user_id,collaborator_ids,source,completed_at,done_at,
                      priority,due_date,start_at,end_at,estimated_minutes,spent_minutes,assignee_id,created_at,updated_at
                    ) values (
                      %s::uuid,%s::uuid,%s::uuid,%s::uuid,%s,%s,%s,%s,%s,
                      %s,%s,%s,%s,%s,%s,
                      %s,%s,%s,%s,%s,%s,%s,
                      %s::uuid,%s::uuid[],%s,%s,%s,
                      %s,%s,%s,%s,%s,%s,%s::uuid,%s,%s
                    )
                    on conflict (id) do update set
                      owner_id = excluded.owner_id,
                      workspace_id = excluded.workspace_id,
                      project_id = excluded.project_id,
                      title = excluded.title,
                      description = excluded.description,
                      category = excluded.category,
                      context_type = excluded.context_type,
                      context_id = excluded.context_id,
                      priority_eisenhower = excluded.priority_eisenhower,
                      kanban_state = excluded.kanban_state,
                      high_impact = excluded.high_impact,
                      estimated_duration_minutes = excluded.estimated_duration_minutes,
                      start_datetime = excluded.start_datetime,
                      due_datetime = excluded.due_datetime,
                      linked_goal = excluded.linked_goal,
                      moscow = excluded.moscow,
                      status = excluded.status,
                      energy_level = excluded.energy_level,
                      pomodoro_estimated = excluded.pomodoro_estimated,
                      pomodoro_done = excluded.pomodoro_done,
                      comments = excluded.comments,
                      assignee_user_id = excluded.assignee_user_id,
                      collaborator_ids = excluded.collaborator_ids,
                      source = excluded.source,
                      completed_at = excluded.completed_at,
                      done_at = excluded.done_at,
                      priority = excluded.priority,
                      due_date = excluded.due_date,
                      start_at = excluded.start_at,
                      end_at = excluded.end_at,
                      estimated_minutes = excluded.estimated_minutes,
                      spent_minutes = excluded.spent_minutes,
                      assignee_id = excluded.assignee_id,
                      created_at = excluded.created_at,
                      updated_at = excluded.updated_at;
                    """,
                    (
                        pg_id,
                        actor_id,
                        workspace_uuid,
                        _coerce_uuid_text(pg_doc.get("project_id")),
                        pg_doc.get("title"),
                        pg_doc.get("description"),
                        pg_doc.get("category"),
                        pg_doc.get("context_type"),
                        pg_doc.get("context_id"),
                        pg_doc.get("priority_eisenhower"),
                        pg_doc.get("kanban_state"),
                        bool(pg_doc.get("high_impact")),
                        pg_doc.get("estimated_duration_minutes"),
                        pg_doc.get("start_datetime"),
                        pg_doc.get("due_datetime"),
                        pg_doc.get("linked_goal"),
                        pg_doc.get("moscow"),
                        pg_doc.get("status"),
                        pg_doc.get("energy_level"),
                        pg_doc.get("pomodoro_estimated"),
                        pg_doc.get("pomodoro_done"),
                        pg_doc.get("comments"),
                        assignee_uuid,
                        pg_doc.get("collaborator_ids") or [],
                        pg_doc.get("source"),
                        pg_doc.get("completed_at"),
                        pg_doc.get("done_at"),
                        pg_doc.get("priority"),
                        pg_doc.get("due_date"),
                        pg_doc.get("start_at"),
                        pg_doc.get("end_at"),
                        pg_doc.get("estimated_minutes"),
                        pg_doc.get("spent_minutes"),
                        assignee_uuid,
                        pg_doc.get("created_at"),
                        pg_doc.get("updated_at"),
                    ),
                )
                await db[COLLECTION].update_one({"_id": mongo_oid}, {"$set": {"pg_task_id": pg_id}})

                processed += 1
                if existed:
                    updated += 1
                else:
                    inserted += 1

            if last_id:
                cur.execute(
                    """
                    insert into app.migration_state(key, value, updated_at)
                    values ('tasks_backfill_last_id', %s, now())
                    on conflict (key) do update
                      set value = excluded.value,
                          updated_at = now();
                    """,
                    (last_id,),
                )
        conn.commit()
        return {"processed": processed, "inserted": inserted, "updated": updated, "last_id": last_id}
    except Exception:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


@router.get("/workspaces", response_model=WorkspaceListResponse)
async def list_workspaces(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> WorkspaceListResponse:
    if _myplanning_store() == "postgres":
        return await _pg_list_workspaces(request, db, current)
    return await _mongo_list_workspaces(db, current)


@router.post("/workspaces", response_model=WorkspaceResponse)
async def create_workspace(
    payload: WorkspaceCreatePayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> WorkspaceResponse:
    if _myplanning_store() == "postgres":
        return await _pg_create_workspace(payload, request, db, current)
    return await _mongo_create_workspace(payload, db, current)


@router.post("/_sanity/workspace")
async def sanity_postgres_workspace(
    payload: WorkspaceCreatePayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> dict:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")

    workspace = await _pg_create_workspace(payload, request, db, current)
    return {
        "ok": True,
        "store": "postgres",
        "actor_id": workspace.owner_user_id,
        "workspace": workspace.dict(),
    }


@router.get("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> WorkspaceResponse:
    if _myplanning_store() == "postgres":
        return await _pg_get_workspace(workspace_id, request, db, current)
    return await _mongo_get_workspace(workspace_id, db, current)


@router.get("/workspaces/{workspace_id}/members", response_model=WorkspaceMembersResponse)
async def list_workspace_members(
    workspace_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> WorkspaceMembersResponse:
    if _myplanning_store() == "postgres":
        return await _pg_list_workspace_members(workspace_id, request, db, current)
    return await _mongo_list_workspace_members(workspace_id, db, current)


@router.post("/workspaces/{workspace_id}/members", response_model=WorkspaceMemberResponse)
async def add_workspace_member(
    workspace_id: str,
    payload: WorkspaceMemberAddPayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> WorkspaceMemberResponse:
    if _myplanning_store() == "postgres":
        return await _pg_add_workspace_member(workspace_id, payload, request, db, current)
    return await _mongo_add_workspace_member(workspace_id, payload, db, current)


@router.delete("/workspaces/{workspace_id}/members/{user_id}")
async def delete_workspace_member(
    workspace_id: str,
    user_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> dict:
    if _myplanning_store() == "postgres":
        return await _pg_delete_workspace_member(workspace_id, user_id, request, db, current)
    return await _mongo_delete_workspace_member(workspace_id, user_id, db, current)


@router.get("/notifications/preferences", response_model=NotificationPreferencesOut)
async def get_notification_preferences(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> NotificationPreferencesOut:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                insert into app.notification_preferences(owner_id)
                values (%s::uuid)
                on conflict (owner_id) do nothing;
                """,
                (actor_id,),
            )
            cur.execute(
                """
                select owner_id::text as owner_id,
                       email_enabled,
                       whatsapp_enabled,
                       whatsapp_e164,
                       daily_digest_enabled,
                       digest_time_local::text as digest_time_local,
                       timezone,
                       created_at,
                       updated_at
                from app.notification_preferences
                where owner_id = %s::uuid
                limit 1;
                """,
                (actor_id,),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"preferences error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    if not row:
        raise HTTPException(status_code=500, detail="preferences not available")
    return NotificationPreferencesOut(**row)


@router.patch("/notifications/preferences", response_model=NotificationPreferencesOut)
async def patch_notification_preferences(
    payload: NotificationPreferencesPatch,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> NotificationPreferencesOut:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    updates = payload.dict(exclude_unset=True)
    if "whatsapp_e164" in updates:
        updates["whatsapp_e164"] = _validate_e164(updates.get("whatsapp_e164"))
    if "digest_time_local" in updates:
        updates["digest_time_local"] = _validate_time_local(updates.get("digest_time_local"))
    if "timezone" in updates:
        updates["timezone"] = _validate_timezone(updates.get("timezone"))

    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                insert into app.notification_preferences(owner_id)
                values (%s::uuid)
                on conflict (owner_id) do nothing;
                """,
                (actor_id,),
            )

            set_parts: list[str] = []
            params: list[Any] = []
            for key, value in updates.items():
                if key == "digest_time_local":
                    set_parts.append("digest_time_local = %s::time")
                    params.append(value)
                else:
                    set_parts.append(f"{key} = %s")
                    params.append(value)

            if set_parts:
                cur.execute(
                    f"""
                    update app.notification_preferences
                    set {', '.join(set_parts)}
                    where owner_id = %s::uuid;
                    """,
                    tuple(params + [actor_id]),
                )

            cur.execute(
                """
                select owner_id::text as owner_id,
                       email_enabled,
                       whatsapp_enabled,
                       whatsapp_e164,
                       daily_digest_enabled,
                       digest_time_local::text as digest_time_local,
                       timezone,
                       created_at,
                       updated_at
                from app.notification_preferences
                where owner_id = %s::uuid
                limit 1;
                """,
                (actor_id,),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"preferences update error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return NotificationPreferencesOut(**row)


@router.get("/notifications/rules", response_model=list[AlertRuleOut])
async def list_alert_rules(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> list[AlertRuleOut]:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select id::text as id,
                       owner_id::text as owner_id,
                       workspace_id::text as workspace_id,
                       rule_type,
                       channel,
                       is_enabled,
                       params,
                       last_run_at,
                       created_at,
                       updated_at
                from app.alert_rules
                where owner_id = %s::uuid
                order by created_at desc;
                """,
                (actor_id,),
            )
            rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"rules list error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return [AlertRuleOut(**r) for r in rows]


@router.post("/notifications/rules", response_model=AlertRuleOut)
async def create_alert_rule(
    payload: AlertRuleIn,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AlertRuleOut:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    workspace_uuid = _as_uuid_or_none(payload.workspace_id, "workspace_id") if payload.workspace_id else None
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            if workspace_uuid:
                _pg_assert_workspace_access(cur, workspace_uuid, actor_id)
            cur.execute(
                """
                insert into app.alert_rules(owner_id, workspace_id, rule_type, channel, is_enabled, params)
                values (%s::uuid, %s::uuid, %s, %s, %s, %s::jsonb)
                returning id::text as id,
                          owner_id::text as owner_id,
                          workspace_id::text as workspace_id,
                          rule_type,
                          channel,
                          is_enabled,
                          params,
                          last_run_at,
                          created_at,
                          updated_at;
                """,
                (actor_id, workspace_uuid, payload.rule_type, payload.channel, bool(payload.is_enabled), json.dumps(payload.params or {})),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"rules create error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return AlertRuleOut(**row)


@router.patch("/notifications/rules/{rule_id}", response_model=AlertRuleOut)
async def patch_alert_rule(
    rule_id: str,
    payload: AlertRulePatch,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AlertRuleOut:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    rule_uuid = _as_uuid_or_none(rule_id, "rule_id")
    if not rule_uuid:
        raise HTTPException(status_code=400, detail="rule_id must be UUID")
    updates = payload.dict(exclude_unset=True)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            set_parts: list[str] = []
            params: list[Any] = []
            if "is_enabled" in updates:
                set_parts.append("is_enabled = %s")
                params.append(bool(updates["is_enabled"]))
            if "params" in updates:
                set_parts.append("params = %s::jsonb")
                params.append(json.dumps(updates["params"] or {}))
            if set_parts:
                cur.execute(
                    f"""
                    update app.alert_rules
                    set {', '.join(set_parts)}
                    where id = %s::uuid and owner_id = %s::uuid;
                    """,
                    tuple(params + [rule_uuid, actor_id]),
                )
            cur.execute(
                """
                select id::text as id,
                       owner_id::text as owner_id,
                       workspace_id::text as workspace_id,
                       rule_type,
                       channel,
                       is_enabled,
                       params,
                       last_run_at,
                       created_at,
                       updated_at
                from app.alert_rules
                where id = %s::uuid and owner_id = %s::uuid
                limit 1;
                """,
                (rule_uuid, actor_id),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"rules update error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return AlertRuleOut(**row)


@router.delete("/notifications/rules/{rule_id}")
async def delete_alert_rule(
    rule_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> dict:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    rule_uuid = _as_uuid_or_none(rule_id, "rule_id")
    if not rule_uuid:
        raise HTTPException(status_code=400, detail="rule_id must be UUID")
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                "delete from app.alert_rules where id = %s::uuid and owner_id = %s::uuid returning id;",
                (rule_uuid, actor_id),
            )
            deleted = cur.fetchone()
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"rules delete error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@router.get("/notifications", response_model=list[NotificationOut])
async def list_notifications(
    request: Request,
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> list[NotificationOut]:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            where = "where owner_id = %s::uuid"
            params: list[Any] = [actor_id]
            if status:
                where += " and status = %s"
                params.append(status)
            cur.execute(
                f"""
                select id,
                       owner_id::text as owner_id,
                       workspace_id::text as workspace_id,
                       channel,
                       template,
                       payload,
                       status,
                       provider_message_id,
                       error,
                       dedupe_key,
                       scheduled_at,
                       sent_at,
                       created_at
                from app.notifications
                {where}
                order by created_at desc
                limit %s offset %s;
                """,
                tuple(params + [limit, offset]),
            )
            rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"notifications list error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return [NotificationOut(**r) for r in rows]


@router.post("/admin/notifications/run")
async def admin_notifications_run(request: Request) -> dict:
    _require_admin_token_for_myplanning(request)
    try:
        stats = generate_notifications_now()
        return {"ok": True, **stats}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"admin notifications run error: {exc.__class__.__name__}")


@router.post("/admin/notifications/worker-tick")
async def admin_notifications_worker_tick(request: Request, batch: int = Query(default=50, ge=1, le=500)) -> dict:
    _require_admin_token_for_myplanning(request)
    try:
        stats = await worker_tick_async(batch=int(batch))
        return {"ok": True, **stats}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"admin notifications worker-tick error: {exc.__class__.__name__}")


@router.get("/admin/notifications/export.csv")
async def admin_notifications_export_csv(
    request: Request,
    limit: int = Query(default=200, ge=1, le=2000),
    status: Optional[str] = Query(default=None),
) -> Response:
    _require_admin_token_for_myplanning(request)
    dsn = _pg_dsn()
    conn = None
    rows: list[dict[str, Any]] = []
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            where = ""
            params: list[Any] = []
            if status:
                where = "where status = %s"
                params.append(status)
            cur.execute(
                f"""
                select id,
                       owner_id::text as owner_id,
                       workspace_id::text as workspace_id,
                       channel,
                       template,
                       status,
                       provider_message_id,
                       error,
                       dedupe_key,
                       scheduled_at,
                       sent_at,
                       created_at
                from app.notifications
                {where}
                order by created_at desc
                limit %s;
                """,
                tuple(params + [limit]),
            )
            rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"export error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "owner_id",
            "workspace_id",
            "channel",
            "template",
            "status",
            "provider_message_id",
            "error",
            "dedupe_key",
            "scheduled_at",
            "sent_at",
            "created_at",
        ]
    )
    for r in rows:
        writer.writerow(
            [
                r.get("id"),
                r.get("owner_id"),
                r.get("workspace_id"),
                r.get("channel"),
                r.get("template"),
                r.get("status"),
                r.get("provider_message_id"),
                r.get("error"),
                r.get("dedupe_key"),
                r.get("scheduled_at"),
                r.get("sent_at"),
                r.get("created_at"),
            ]
        )
    data = buf.getvalue()
    return Response(content=data, media_type="text/csv")


@router.get("/stats/overview")
async def get_stats_overview(
    request: Request,
    from_: Optional[str] = Query(default=None, alias="from"),
    to: Optional[str] = Query(default=None),
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> dict[str, Any]:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    window_from, window_to = _resolve_stats_window(from_, to)
    workspace_uuid = _as_uuid_or_none(workspace_id, "workspace_id") if workspace_id else None

    if workspace_uuid:
        scope_where = "t.workspace_id = %s::uuid"
        scope_params: list[Any] = [workspace_uuid]
    else:
        scope_where = "t.owner_id = %s::uuid"
        scope_params = [actor_id]

    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            if workspace_uuid:
                _pg_assert_workspace_access(cur, workspace_uuid, actor_id)

            cur.execute(
                f"select count(*)::int as c from app.tasks t where {scope_where};",
                tuple(scope_params),
            )
            tasks_total = int((cur.fetchone() or {}).get("c") or 0)

            cur.execute(
                f"""
                select count(*)::int as c
                from app.tasks t
                where {scope_where}
                  and t.created_at >= %s
                  and t.created_at < %s;
                """,
                tuple(scope_params + [window_from, window_to]),
            )
            tasks_created = int((cur.fetchone() or {}).get("c") or 0)

            cur.execute(
                f"""
                select count(*)::int as c
                from app.tasks t
                where {scope_where}
                  and t.done_at is not null
                  and t.done_at >= %s
                  and t.done_at < %s;
                """,
                tuple(scope_params + [window_from, window_to]),
            )
            tasks_completed = int((cur.fetchone() or {}).get("c") or 0)

            cur.execute(
                f"""
                select coalesce(nullif(t.status, ''), 'todo') as key, count(*)::int as c
                from app.tasks t
                where {scope_where}
                group by 1;
                """,
                tuple(scope_params),
            )
            status_rows = [dict(r) for r in cur.fetchall()]

            cur.execute(
                f"""
                select coalesce(nullif(t.priority_eisenhower, ''), 'unknown') as key, count(*)::int as c
                from app.tasks t
                where {scope_where}
                group by 1;
                """,
                tuple(scope_params),
            )
            prio_e_rows = [dict(r) for r in cur.fetchall()]

            cur.execute(
                f"""
                select coalesce(nullif(t.priority, ''), 'unknown') as key, count(*)::int as c
                from app.tasks t
                where {scope_where}
                group by 1;
                """,
                tuple(scope_params),
            )
            prio_rows = [dict(r) for r in cur.fetchall()]

            cur.execute(
                f"""
                select coalesce(avg(extract(epoch from (t.done_at - t.created_at)) / 3600.0), 0)::float8 as value
                from app.tasks t
                where {scope_where}
                  and t.done_at is not null
                  and t.done_at >= %s
                  and t.done_at < %s;
                """,
                tuple(scope_params + [window_from, window_to]),
            )
            avg_cycle_time_hours = float((cur.fetchone() or {}).get("value") or 0.0)
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres stats overview error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    tasks_by_status: dict[str, int] = {"todo": 0, "doing": 0, "done": 0}
    for row in status_rows:
        key = str(row.get("key") or "todo").strip().lower()
        tasks_by_status[key] = int(row.get("c") or 0)

    tasks_by_priority_eisenhower: dict[str, int] = {
        "urgent_important": 0,
        "important_not_urgent": 0,
        "urgent_not_important": 0,
        "not_urgent_not_important": 0,
    }
    for row in prio_e_rows:
        key = str(row.get("key") or "unknown").strip().lower()
        tasks_by_priority_eisenhower[key] = int(row.get("c") or 0)

    tasks_by_priority: dict[str, int] = {"low": 0, "medium": 0, "high": 0}
    for row in prio_rows:
        key = str(row.get("key") or "unknown").strip().lower()
        tasks_by_priority[key] = int(row.get("c") or 0)

    completion_rate = 0.0
    if tasks_created > 0:
        completion_rate = round(tasks_completed / tasks_created, 4)

    return {
        "scope": {"workspace_id": workspace_uuid},
        "window": {"from": window_from.isoformat(), "to": window_to.isoformat()},
        "tasks_total": tasks_total,
        "tasks_created": tasks_created,
        "tasks_completed": tasks_completed,
        "completion_rate": completion_rate,
        "tasks_by_status": tasks_by_status,
        "tasks_by_priority_eisenhower": tasks_by_priority_eisenhower,
        "tasks_by_priority": tasks_by_priority,
        "avg_cycle_time_hours": round(avg_cycle_time_hours, 2),
    }


@router.get("/stats/timeseries")
async def get_stats_timeseries(
    request: Request,
    metric: Literal["created_per_day", "completed_per_day"] = Query(...),
    from_: Optional[str] = Query(default=None, alias="from"),
    to: Optional[str] = Query(default=None),
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> dict[str, Any]:
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    actor_email = str(current.get("email") or "")
    window_from, window_to = _resolve_stats_window(from_, to)
    workspace_uuid = _as_uuid_or_none(workspace_id, "workspace_id") if workspace_id else None
    day_from = window_from.date()
    day_to = window_to.date()

    if workspace_uuid:
        scope_where = "t.workspace_id = %s::uuid"
        scope_params: list[Any] = [workspace_uuid]
    else:
        scope_where = "t.owner_id = %s::uuid"
        scope_params = [actor_id]

    date_field = "t.created_at" if metric == "created_per_day" else "t.done_at"

    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, actor_email)
            _pg_set_rls_actor(cur, actor_id)
            if workspace_uuid:
                _pg_assert_workspace_access(cur, workspace_uuid, actor_id)

            cur.execute(
                f"""
                with days as (
                  select gs::date as day
                  from generate_series(%s::date, %s::date, interval '1 day') gs
                ),
                agg as (
                  select date_trunc('day', {date_field})::date as day, count(*)::int as value
                  from app.tasks t
                  where {scope_where}
                    and {date_field} is not null
                    and {date_field} >= %s
                    and {date_field} < %s
                  group by 1
                )
                select days.day, coalesce(agg.value, 0)::int as value
                from days
                left join agg on agg.day = days.day
                order by days.day;
                """,
                tuple([day_from, day_to] + scope_params + [window_from, window_to]),
            )
            rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"postgres stats timeseries error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    return {
        "metric": metric,
        "scope": {"workspace_id": workspace_uuid},
        "window": {"from": window_from.isoformat(), "to": window_to.isoformat()},
        "series": [
            {"date": str(row.get("day")), "value": int(row.get("value") or 0)}
            for row in rows
        ],
    }


@router.get("/tasks", response_model=TaskListResponse)
async def list_tasks(
    request: Request,
    kanban_state: Optional[str] = Query(default=None),
    high_impact: Optional[bool] = Query(default=None),
    context_type: Optional[str] = Query(default=None, description="personal|professional|learning"),
    context_id: Optional[str] = Query(default=None, description="Identifier du contexte (ex: certificate_id)"),
    workspace_id: Optional[str] = Query(default=None, description="UUID workspace (Team)"),
    date: Optional[str] = Query(default=None, description="ISO date filter for today view"),
    week_start: Optional[str] = Query(default=None, description="ISO date for the starting Monday"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskListResponse:
    tasks_store = _myplanning_tasks_store()
    if tasks_store in {"postgres", "dual"}:
        return await _pg_list_tasks(
            request,
            db,
            current,
            kanban_state=kanban_state,
            high_impact=high_impact,
            context_type=context_type,
            context_id=context_id,
            workspace_id=workspace_id,
            date_filter=date,
            week_start=week_start,
            page=page,
            limit=limit,
        )
    criteria: Dict[str, Any] = {"user_id": current["_id"]}
    if kanban_state:
        criteria["kanban_state"] = kanban_state
    if high_impact is not None:
        criteria["high_impact"] = bool(high_impact)
    if context_type:
        criteria["context_type"] = context_type
    if context_id:
        criteria["context_id"] = context_id
    if workspace_id:
        criteria["workspace_id"] = workspace_id
    date_range = _parse_date_filter(date)
    if date_range:
        start, end = date_range
        criteria["$or"] = [
            {"start_datetime": {"$gte": start, "$lt": end}},
            {"due_datetime": {"$gte": start, "$lt": end}},
        ]
    elif week_start:
        weekly = _parse_date_filter(week_start)
        if weekly:
            start, _ = weekly
            end = start + timedelta(days=7)
            criteria["due_datetime"] = {"$lte": end}
            criteria.setdefault("$or", []).append({"due_datetime": {"$gte": start}})
    skip = (page - 1) * limit
    cursor = (
        db[COLLECTION]
        .find(criteria)
        .sort([("high_impact", -1), ("due_datetime", 1), ("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    tasks: List[TaskResponse] = []
    async for doc in cursor:
        tasks.append(_serialize_task(doc))
    total = await db[COLLECTION].count_documents(criteria)
    has_more = page * limit < total
    return TaskListResponse(items=tasks, total=total, has_more=has_more)


def _lesson_minutes(lesson_type: str) -> int:
    lt = (lesson_type or "").lower()
    if lt == "project_brief":
        return 120
    if lt == "youtube_video":
        return 45
    if lt == "external_article":
        return 45
    if lt == "internal_text":
        return 45
    # fallback
    return 45


@router.get("/learning/tasks", response_model=TaskListResponse)
async def list_learning_tasks(
    certificate_id: Optional[str] = Query(default=None, description="Filter on certificate _id"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=200, ge=1, le=500),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskListResponse:
    criteria: Dict[str, Any] = {"user_id": current["_id"], "context_type": "learning"}
    if certificate_id:
        criteria["context_id"] = certificate_id
    skip = (page - 1) * limit
    cursor = db[COLLECTION].find(criteria).sort([("due_datetime", 1), ("created_at", -1)]).skip(skip).limit(limit)
    tasks: List[TaskResponse] = []
    async for doc in cursor:
        tasks.append(_serialize_task(doc))
    total = await db[COLLECTION].count_documents(criteria)
    has_more = page * limit < total
    return TaskListResponse(items=tasks, total=total, has_more=has_more)


@router.post("/learning/generate", response_model=LearningPlanGenerateResponse)
async def generate_learning_plan(
    payload: LearningPlanGenerateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> LearningPlanGenerateResponse:
    """
    Generate learning tasks for a certificate program (modules -> lessons).
    Tasks are stored in the shared myplanning_tasks collection but tagged with context_type=learning.
    """
    user_id = current["_id"]
    certificate_id = payload.certificate_id

    # Auto-enroll if needed (so we can detect completed lessons)
    enrollment = await db["certificate_enrollments"].find_one({"user_id": str(user_id), "certificate_id": certificate_id})
    if not enrollment:
        now_iso = datetime.utcnow().isoformat()
        await db["certificate_enrollments"].insert_one(
            {
                "user_id": str(user_id),
                "certificate_id": certificate_id,
                "status": "enrolled",
                "enrollment_date": now_iso,
                "progress_percent": 0.0,
            }
        )
        enrollment = await db["certificate_enrollments"].find_one({"user_id": str(user_id), "certificate_id": certificate_id})

    enrollment_id = str(enrollment["_id"]) if enrollment else None
    completed_lessons: set[str] = set()
    if enrollment_id:
        progress_docs = await db["lesson_progress"].find({"enrollment_id": enrollment_id, "status": "completed"}).to_list(length=5000)
        completed_lessons = {p.get("lesson_id") for p in progress_docs if p.get("lesson_id")}

    cert = await db["certificate_programs"].find_one({"_id": ObjectId(certificate_id)})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable")

    modules = await db["certificate_modules"].find({"certificate_id": certificate_id}).sort("order_index", 1).to_list(length=500)
    lessons = await db["certificate_lessons"].find({"certificate_id": certificate_id}).sort("order_index", 1).to_list(length=2000)

    module_titles = {str(m["_id"]): (m.get("title") or "") for m in modules}

    # Parse start date
    if payload.start_date:
        try:
            day = datetime.fromisoformat(payload.start_date).date()
        except ValueError:
            raise HTTPException(status_code=400, detail="start_date invalide (attendu YYYY-MM-DD)")
        current_day = datetime.combine(day, datetime.min.time())
    else:
        now = datetime.utcnow()
        current_day = datetime.combine(now.date(), datetime.min.time())

    minutes_budget = int(payload.available_minutes_per_day)
    minutes_left = minutes_budget

    created = updated = skipped = 0

    for lesson in lessons:
        lesson_id = str(lesson["_id"])
        if lesson_id in completed_lessons:
            continue

        lesson_type = lesson.get("lesson_type") or "internal_text"
        est = _lesson_minutes(str(lesson_type))
        if est > minutes_budget:
            est = minutes_budget
        if est > minutes_left:
            current_day = current_day + timedelta(days=1)
            minutes_left = minutes_budget
        minutes_left -= est

        due_dt = current_day + timedelta(hours=20)  # end of day block
        title = lesson.get("title") or "Leçon"
        module_id = lesson.get("module_id")
        module_title = module_titles.get(str(module_id), "").strip()
        full_title = f"{module_title} — {title}" if module_title else title

        task_doc: Dict[str, Any] = {
            "user_id": user_id,
            "title": full_title,
            "description": lesson.get("summary"),
            "category": cert.get("title") or "KORYXA School",
            "context_type": "learning",
            "context_id": certificate_id,
            "linked_goal": f"lesson:{lesson_id}",
            "source": "ia",
            "kanban_state": "todo",
            "high_impact": True,
            "estimated_duration_minutes": est,
            "due_datetime": due_dt,
            "updated_at": datetime.utcnow(),
        }

        existing = await db[COLLECTION].find_one(
            {"user_id": user_id, "context_type": "learning", "context_id": certificate_id, "linked_goal": f"lesson:{lesson_id}"}
        )
        if existing:
            if payload.overwrite_existing:
                await db[COLLECTION].update_one({"_id": existing["_id"]}, {"$set": task_doc})
                updated += 1
            else:
                skipped += 1
            continue

        task_doc["created_at"] = datetime.utcnow()
        await db[COLLECTION].insert_one(task_doc)
        created += 1

    return LearningPlanGenerateResponse(created=created, updated=updated, skipped=skipped, context_id=certificate_id)


@router.post("/learning/import", response_model=LearningPlanGenerateResponse)
async def import_learning_plan(
    payload: LearningPlanImportRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> LearningPlanGenerateResponse:
    """
    Import (bulk upsert) learning tasks from a KORYXA parcours structure (modules/thèmes/lessons).
    Used by KORYXA School "Mon planning d’apprentissage".
    """
    user_id = current["_id"]
    context_id = payload.context_id
    now = datetime.utcnow()

    created = updated = skipped = 0

    for item in payload.items:
        linked = item.linked_goal or item.title
        task_doc: Dict[str, Any] = {
            "user_id": user_id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "context_type": "learning",
            "context_id": context_id,
            "linked_goal": linked,
            "source": "ia",
            "kanban_state": "todo",
            "high_impact": bool(item.high_impact) if item.high_impact is not None else True,
            "priority_eisenhower": item.priority_eisenhower or "important_not_urgent",
            "estimated_duration_minutes": item.estimated_duration_minutes,
            "due_datetime": item.due_datetime,
            "updated_at": now,
        }

        existing = await db[COLLECTION].find_one(
            {"user_id": user_id, "context_type": "learning", "context_id": context_id, "linked_goal": linked}
        )
        if existing:
            if payload.overwrite_existing:
                await db[COLLECTION].update_one({"_id": existing["_id"]}, {"$set": task_doc})
                updated += 1
            else:
                skipped += 1
            continue

        task_doc["created_at"] = now
        await db[COLLECTION].insert_one(task_doc)
        created += 1

    return LearningPlanGenerateResponse(created=created, updated=updated, skipped=skipped, context_id=context_id)


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreatePayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskResponse:
    tasks_store = _myplanning_tasks_store()
    if tasks_store == "postgres":
        return await _pg_create_task(payload, request, db, current)
    if tasks_store == "dual":
        return await _dual_create_task(payload, request, db, current)
    now = datetime.utcnow()
    doc = payload.dict()
    doc = _prepare_task_payload(doc)
    _validate_dates(doc)
    doc["user_id"] = current["_id"]
    doc["source"] = doc.get("source") or "manual"
    if doc.get("kanban_state") == "done" and not doc.get("completed_at"):
        doc["completed_at"] = now
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_task(doc)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    payload: TaskUpdatePayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskResponse:
    tasks_store = _myplanning_tasks_store()
    if tasks_store == "postgres":
        return await _pg_update_task(task_id, payload, request, db, current)
    if tasks_store == "dual":
        return await _dual_update_task(task_id, payload, request, db, current)
    oid = to_object_id(task_id)
    updates = payload.dict(exclude_unset=True)
    if not updates:
        doc = await db[COLLECTION].find_one({"_id": oid, "user_id": current["_id"]})
        if not doc:
            raise HTTPException(status_code=404, detail="Tâche introuvable")
        return _serialize_task(doc)
    existing = await db[COLLECTION].find_one({"_id": oid, "user_id": current["_id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    updates = _prepare_task_payload(updates)
    _validate_dates({**existing, **updates})
    now = datetime.utcnow()
    if "kanban_state" in updates:
        new_state = updates["kanban_state"]
        prev_state = existing.get("kanban_state")
        if new_state == "done" and not existing.get("completed_at"):
            updates["completed_at"] = now
        elif new_state != "done":
            updates["completed_at"] = None
        # retain previous completed_at if staying done without explicit reset
    updates["updated_at"] = now
    doc = await db[COLLECTION].find_one_and_update(
        {"_id": oid, "user_id": current["_id"]},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    return _serialize_task(doc)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_task(
    task_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> Response:
    tasks_store = _myplanning_tasks_store()
    if tasks_store == "postgres":
        await _pg_delete_task(task_id, request, db, current)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    if tasks_store == "dual":
        await _dual_delete_task(task_id, request, db, current)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    oid = to_object_id(task_id)
    result = await db[COLLECTION].delete_one({"_id": oid, "user_id": current["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/tasks/bulk_create", response_model=TaskListResponse)
async def bulk_create_tasks(
    payload: List[TaskCreatePayload],
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskListResponse:
    tasks_store = _myplanning_tasks_store()
    if tasks_store == "postgres":
        return await _pg_bulk_create_tasks(payload, request, db, current)
    if tasks_store == "dual":
        if not payload:
            return TaskListResponse(items=[], total=0, has_more=False)
        created_items: List[TaskResponse] = []
        for item in payload:
            created_items.append(await _dual_create_task(item, request, db, current))
        return TaskListResponse(items=created_items, total=len(created_items), has_more=False)
    now = datetime.utcnow()
    if not payload:
        return TaskListResponse(items=[])
    docs = []
    for item in payload:
        doc = item.dict()
        doc = _prepare_task_payload(doc)
        _validate_dates(doc)
        doc["user_id"] = current["_id"]
        doc["created_at"] = now
        doc["updated_at"] = now
        doc["source"] = doc.get("source") or "manual"
        docs.append(doc)
    # deduplicate by (title, due_date, source) for this user
    titles = [d.get("title") for d in docs]
    due_dates = [
        _serialize_datetime(d.get("due_datetime")).date() if _serialize_datetime(d.get("due_datetime")) else None
        for d in docs
    ]
    existing = db[COLLECTION].find(
        {
            "user_id": current["_id"],
            "title": {"$in": titles},
            "source": "ia",
        }
    )
    skip_keys: set[tuple[str, datetime.date | None]] = set()
    async for doc in existing:
        ddate = _serialize_datetime(doc.get("due_datetime")).date() if _serialize_datetime(doc.get("due_datetime")) else None
        skip_keys.add((doc.get("title"), ddate))

    to_insert = []
    for doc, ddate in zip(docs, due_dates):
        key = (doc.get("title"), ddate)
        if doc.get("source") == "ia" and key in skip_keys:
            continue
        to_insert.append(doc)
    inserted: List[TaskResponse] = []
    if to_insert:
        res = await db[COLLECTION].insert_many(to_insert)
        for oid, doc in zip(res.inserted_ids, to_insert):
            doc["_id"] = oid
            inserted.append(_serialize_task(doc))
    return TaskListResponse(items=inserted)


@router.post("/admin/migrate-tasks")
async def migrate_tasks_to_postgres(
    request: Request,
    batch: int = Query(default=500, ge=1, le=5000),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    _require_admin_token_for_myplanning(request)
    store = _myplanning_tasks_store()
    if store not in {"dual", "postgres"}:
        raise HTTPException(
            status_code=409,
            detail="tasks store must be dual or postgres (set MYPLANNING_TASKS_STORE)",
        )
    stats = await _run_mongo_to_pg_tasks_backfill(db, batch=batch)
    return {
        "ok": True,
        "store": store,
        **stats,
    }


@router.post("/ai/suggest-tasks", response_model=AiSuggestTasksResponse)
async def ai_suggest_tasks(
    payload: AiSuggestTasksRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),  # noqa: ARG001
    current: dict = Depends(get_current_user),  # noqa: ARG001
) -> AiSuggestTasksResponse:
    _require_pro(current)
    _rate_limit(f"ai_suggest:{current['_id']}")
    clean_text = payload.free_text.strip()
    if len(clean_text) > 2000:
        raise HTTPException(status_code=400, detail="Le texte est trop long (2000 caractères max).")
    drafts, used_fallback = await suggest_tasks_from_text(clean_text, payload.language, payload.preferred_duration_block)
    return AiSuggestTasksResponse(drafts=drafts, used_fallback=used_fallback)


async def _load_open_tasks(
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    task_ids: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    criteria: Dict[str, Any] = {"user_id": user_id}
    if task_ids:
        oids: List[ObjectId] = []
        for raw in task_ids:
            try:
                oids.append(to_object_id(raw))
            except HTTPException:
                continue
        if oids:
            criteria["_id"] = {"$in": oids}
    criteria.setdefault("kanban_state", {"$ne": "done"})
    cursor = db[COLLECTION].find(criteria).sort("due_datetime", 1)
    tasks: List[Dict[str, Any]] = []
    async for doc in cursor:
        tasks.append(doc)
    return tasks


@router.post("/ai/plan-day", response_model=AiPlanDayResponse)
async def ai_plan_day(
    payload: AiPlanDayRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AiPlanDayResponse:
    _require_pro(current)
    _rate_limit(f"ai_plan:{current['_id']}")
    tasks = await _load_open_tasks(db, current["_id"])
    order, focus = await plan_day_with_llama(tasks, payload.date, payload.available_minutes)
    return AiPlanDayResponse(
        order=order,
        focus=[{"task_id": item["task_id"], "reason": item.get("reason")} for item in focus],
    )


@router.post("/ai/replan-with-time", response_model=AiReplanResponse)
async def ai_replan_with_time(
    payload: AiReplanRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AiReplanResponse:
    _require_pro(current)
    _rate_limit(f"ai_replan:{current['_id']}")
    tasks = await _load_open_tasks(db, current["_id"], payload.task_ids)
    recs = await replan_with_time_limit(tasks, payload.available_minutes)
    formatted = [
        {"task_id": item["task_id"], "suggested_minutes": item.get("suggested_minutes"), "reason": item.get("reason")}
        for item in recs
    ]
    return AiReplanResponse(recommendations=formatted)


# -----------------------------
# Attendance v1 (QR dynamique)
# -----------------------------


class AttendanceLocationCreateIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)


class AttendanceLocationPatchIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    is_active: bool | None = None


class AttendanceLocationOut(BaseModel):
    id: str
    workspace_id: str
    name: str
    is_active: bool
    created_by: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AttendanceQrOut(BaseModel):
    location_id: str
    workspace_id: str
    location_name: str
    qr_payload: str
    valid_to: datetime
    qr_svg: str


class AttendanceScanIn(BaseModel):
    qr_payload: str = Field(..., min_length=8)
    event_type: Literal["check_in", "check_out"]
    client_ts: str | None = None
    client_tz: str | None = Field(default=None, max_length=64)


class AttendanceDailyOut(BaseModel):
    workspace_id: str
    user_id: str
    day: date
    first_check_in: datetime | None = None
    last_check_out: datetime | None = None
    minutes_present: int
    status: Literal["present", "partial", "absent"]
    computed_at: datetime | None = None


class AttendanceScanOut(BaseModel):
    ok: bool = True
    event_id: int
    daily: AttendanceDailyOut


class AttendanceOverviewSeriesPoint(BaseModel):
    day: date
    present: int
    partial: int
    absent: int


class AttendanceOverviewOut(BaseModel):
    workspace_id: str
    window: dict[str, str]
    present_rate: float
    n_present: int
    n_absent: int
    n_partial: int
    series: list[AttendanceOverviewSeriesPoint]


def _pg_assert_workspace_admin(cur: RealDictCursor, workspace_id: str, actor_id: str) -> None:
    cur.execute(
        """
        select w.owner_id::text as owner_id, wm.role
        from app.workspaces w
        left join app.workspace_members wm
          on wm.workspace_id = w.id
         and wm.user_id = %s::uuid
        where w.id = %s::uuid
        limit 1;
        """,
        (actor_id, workspace_id),
    )
    row = dict(cur.fetchone() or {})
    if not row:
        raise HTTPException(status_code=404, detail="Workspace introuvable")
    requester_role = "owner" if row.get("owner_id") == actor_id else str(row.get("role") or "")
    if requester_role not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Permissions insuffisantes")


def _pg_assert_workspace_member(cur: RealDictCursor, workspace_id: str, actor_id: str) -> None:
    cur.execute(
        """
        select 1
        from app.workspaces w
        where w.id = %s::uuid
          and (
            w.owner_id = %s::uuid
            or exists (
              select 1
              from app.workspace_members wm
              where wm.workspace_id = w.id
                and wm.user_id = %s::uuid
                and coalesce(wm.status, 'active') = 'active'
            )
          )
        limit 1;
        """,
        (workspace_id, actor_id, actor_id),
    )
    if not cur.fetchone():
        raise HTTPException(status_code=403, detail="Workspace access denied")


def _coerce_inet_or_none(value: str | None) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None
    # Minimal validation: postgres will validate inet cast.
    return raw


def _attendance_rotation_s() -> int:
    try:
        return int(os.environ.get("ATTENDANCE_QR_ROTATION_S", "60"))
    except Exception:
        return 60


def _attendance_keep_s() -> int:
    try:
        return int(os.environ.get("ATTENDANCE_QR_KEEP_S", "300"))
    except Exception:
        return 300


def _attendance_present_minutes() -> int:
    try:
        return int(os.environ.get("ATTENDANCE_PRESENT_MINUTES", "360"))
    except Exception:
        return 360


def _pg_compute_attendance_daily_range(
    cur: RealDictCursor,
    *,
    workspace_id: str,
    from_day: date,
    to_day: date,
    actor_scope_user_id: str | None = None,
) -> None:
    threshold = max(60, _attendance_present_minutes())
    params: list[Any] = [from_day, to_day]
    member_where = "where wm.workspace_id = %s::uuid and coalesce(wm.status,'active')='active'"
    if actor_scope_user_id:
        member_where += " and wm.user_id = %s::uuid"
    # Placeholders order:
    # days(from,to), members(workspace_id[,user_id]), union(workspace_id[,owner_id]), grid(workspace_id), threshold
    params.append(workspace_id)
    if actor_scope_user_id:
        params.append(actor_scope_user_id)
    params.append(workspace_id)
    if actor_scope_user_id:
        params.append(actor_scope_user_id)
    params.append(workspace_id)
    params.append(threshold)
    cur.execute(
        f"""
        with days as (
          select generate_series(%s::date, %s::date, interval '1 day')::date as day
        ),
        members as (
          select wm.user_id
          from app.workspace_members wm
          {member_where}
          union
          select w.owner_id as user_id
          from app.workspaces w
          where w.id = %s::uuid
          {"and w.owner_id = %s::uuid" if actor_scope_user_id else ""}
        ),
        grid as (
          select %s::uuid as workspace_id, m.user_id, d.day
          from members m
          cross join days d
        ),
        agg as (
          select
            g.workspace_id,
            g.user_id,
            g.day,
            min(e.event_ts) filter (where e.event_type='check_in') as first_check_in,
            max(e.event_ts) filter (where e.event_type='check_out') as last_check_out
          from grid g
          left join app.attendance_events e
            on e.workspace_id = g.workspace_id
           and e.user_id = g.user_id
           and e.event_ts::date = g.day
          group by g.workspace_id, g.user_id, g.day
        ),
        computed as (
          select
            workspace_id,
            user_id,
            day,
            first_check_in,
            last_check_out,
            case
              when first_check_in is not null and last_check_out is not null and last_check_out > first_check_in
                then floor(extract(epoch from (last_check_out - first_check_in)) / 60)::int
              else 0
            end as minutes_present,
            case
              when (first_check_in is not null and last_check_out is not null and last_check_out > first_check_in)
                   and (floor(extract(epoch from (last_check_out - first_check_in)) / 60)::int) >= %s
                then 'present'
              when (first_check_in is not null)
                   and (case
                          when last_check_out is not null and last_check_out > first_check_in
                            then floor(extract(epoch from (last_check_out - first_check_in)) / 60)::int
                          else 0
                        end) >= 1
                then 'partial'
              else 'absent'
            end as status
          from agg
        )
        insert into app.attendance_daily(workspace_id, user_id, day, first_check_in, last_check_out, minutes_present, status, computed_at)
        select workspace_id, user_id, day, first_check_in, last_check_out, minutes_present, status, now()
        from computed
        on conflict (workspace_id, user_id, day) do update
          set first_check_in = excluded.first_check_in,
              last_check_out = excluded.last_check_out,
              minutes_present = excluded.minutes_present,
              status = excluded.status,
              computed_at = now();
        """,
        tuple(params),
    )


@router.get("/workspaces/{workspace_id}/attendance/locations", response_model=list[AttendanceLocationOut])
async def list_attendance_locations(
    workspace_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> list[AttendanceLocationOut]:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            _pg_assert_workspace_admin(cur, workspace_id, actor_id)
            cur.execute(
                """
                select id::text as id,
                       workspace_id::text as workspace_id,
                       name,
                       is_active,
                       created_by::text as created_by,
                       created_at,
                       updated_at
                from app.attendance_locations
                where workspace_id = %s::uuid
                order by created_at desc;
                """,
                (workspace_id,),
            )
            rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except HTTPException:
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"attendance locations list error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return [AttendanceLocationOut(**r) for r in rows]


@router.post("/workspaces/{workspace_id}/attendance/locations", response_model=AttendanceLocationOut)
async def create_attendance_location(
    workspace_id: str,
    payload: AttendanceLocationCreateIn,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AttendanceLocationOut:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    location_id = str(uuid.uuid4())
    now = datetime.utcnow()
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            _pg_assert_workspace_admin(cur, workspace_id, actor_id)
            cur.execute(
                """
                insert into app.attendance_locations(id, workspace_id, name, is_active, created_by, created_at, updated_at)
                values (%s::uuid, %s::uuid, %s, true, %s::uuid, %s, %s)
                returning id::text as id,
                          workspace_id::text as workspace_id,
                          name,
                          is_active,
                          created_by::text as created_by,
                          created_at,
                          updated_at;
                """,
                (location_id, workspace_id, payload.name.strip(), actor_id, now, now),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except HTTPException:
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"attendance location create error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return AttendanceLocationOut(**row)


@router.patch("/attendance/locations/{location_id}", response_model=AttendanceLocationOut)
async def patch_attendance_location(
    location_id: str,
    payload: AttendanceLocationPatchIn,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AttendanceLocationOut:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select id::text as id,
                       workspace_id::text as workspace_id,
                       name,
                       is_active,
                       created_by::text as created_by,
                       created_at,
                       updated_at
                from app.attendance_locations
                where id = %s::uuid
                limit 1;
                """,
                (location_id,),
            )
            existing = dict(cur.fetchone() or {})
            if not existing:
                raise HTTPException(status_code=404, detail="Location introuvable")
            _pg_assert_workspace_admin(cur, str(existing["workspace_id"]), actor_id)

            fields: list[str] = []
            params: list[Any] = []
            if payload.name is not None:
                fields.append("name = %s")
                params.append(payload.name.strip())
            if payload.is_active is not None:
                fields.append("is_active = %s")
                params.append(bool(payload.is_active))
            if not fields:
                return AttendanceLocationOut(**existing)
            params.append(location_id)
            cur.execute(
                f"""
                update app.attendance_locations
                set {', '.join(fields)}
                where id = %s::uuid
                returning id::text as id,
                          workspace_id::text as workspace_id,
                          name,
                          is_active,
                          created_by::text as created_by,
                          created_at,
                          updated_at;
                """,
                tuple(params),
            )
            row = dict(cur.fetchone() or {})
        conn.commit()
    except HTTPException:
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"attendance location patch error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return AttendanceLocationOut(**row)


@router.get("/attendance/locations/{location_id}/qr", response_model=AttendanceQrOut)
async def get_attendance_location_qr(
    location_id: str,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AttendanceQrOut:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")
    # Avoid caching of rotating tokens.
    response.headers["Cache-Control"] = "no-store"

    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    dsn = _pg_dsn()
    conn = None
    now = datetime.utcnow()
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            cur.execute(
                """
                select id::text as id,
                       workspace_id::text as workspace_id,
                       name,
                       is_active
                from app.attendance_locations
                where id = %s::uuid
                limit 1;
                """,
                (location_id,),
            )
            loc = dict(cur.fetchone() or {})
            if not loc:
                raise HTTPException(status_code=404, detail="Location introuvable")
            if not bool(loc.get("is_active")):
                raise HTTPException(status_code=400, detail="Location inactive")

            workspace_id = str(loc["workspace_id"])
            _pg_assert_workspace_admin(cur, workspace_id, actor_id)

            # Purge expired tokens (keep a short history for a few minutes).
            keep_s = max(60, _attendance_keep_s())
            cur.execute(
                "delete from app.attendance_qr_tokens where valid_to < (now() - (%s::int * interval '1 second'));",
                (keep_s,),
            )

            rotation = _attendance_rotation_s()
            issued = issue_qr_token(workspace_id=workspace_id, location_id=location_id, rotation_seconds=rotation)
            cur.execute(
                """
                insert into app.attendance_qr_tokens(workspace_id, location_id, token_hash, valid_from, valid_to, created_at)
                values (%s::uuid, %s::uuid, %s, %s, %s, %s);
                """,
                (workspace_id, location_id, issued.token_hash, now, issued.valid_to, now),
            )
        conn.commit()
    except HTTPException:
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"attendance qr error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    return AttendanceQrOut(
        location_id=location_id,
        workspace_id=workspace_id,
        location_name=str(loc.get("name") or "Location"),
        qr_payload=issued.qr_payload,
        valid_to=issued.valid_to,
        qr_svg=render_qr_svg(issued.qr_payload),
    )


@router.post("/attendance/scan", response_model=AttendanceScanOut)
async def attendance_scan(
    payload: AttendanceScanIn,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AttendanceScanOut:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")
    client_ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() or (request.client.host if request.client else "")
    _rate_limit(f"attendance_scan:{client_ip}", limit=30, window_seconds=60)

    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    try:
        decoded = decode_qr_payload(payload.qr_payload)
    except Exception:
        raise HTTPException(status_code=400, detail="QR invalide")

    if int(decoded.get("v") or 0) != 1:
        raise HTTPException(status_code=400, detail="QR invalide")
    workspace_id = str(decoded.get("w") or "").strip()
    location_id = str(decoded.get("l") or "").strip()
    token_plain = str(decoded.get("t") or "").strip()
    exp = decoded.get("exp")
    try:
        exp_int = int(exp)
    except Exception:
        raise HTTPException(status_code=400, detail="QR invalide")
    if not workspace_id or not location_id or not token_plain:
        raise HTTPException(status_code=400, detail="QR invalide")
    if int(time.time()) > exp_int:
        raise HTTPException(status_code=400, detail="QR expiré")

    token_hash = sha256_hex(token_plain)
    client_ts = None
    try:
        # keep as timestamptz (naive UTC) for storage
        client_ts = datetime.fromisoformat(payload.client_ts[:-1] + "+00:00" if payload.client_ts and payload.client_ts.endswith("Z") else (payload.client_ts or ""))
        if client_ts and client_ts.tzinfo is not None:
            client_ts = client_ts.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        client_ts = None

    dsn = _pg_dsn()
    conn = None
    now = datetime.utcnow()
    day = now.date()
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)

            _pg_assert_workspace_member(cur, workspace_id, actor_id)

            cur.execute(
                """
                select 1
                from app.attendance_qr_tokens
                where token_hash = %s
                  and workspace_id = %s::uuid
                  and location_id = %s::uuid
                  and now() between valid_from and valid_to
                limit 1;
                """,
                (token_hash, workspace_id, location_id),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="QR invalide ou expiré")

            cur.execute(
                """
                select id::text as id, workspace_id::text as workspace_id, is_active
                from app.attendance_locations
                where id = %s::uuid
                limit 1;
                """,
                (location_id,),
            )
            loc = dict(cur.fetchone() or {})
            if not loc or str(loc.get("workspace_id") or "") != workspace_id:
                raise HTTPException(status_code=400, detail="QR invalide")
            if not bool(loc.get("is_active")):
                raise HTTPException(status_code=400, detail="Location inactive")

            cur.execute(
                """
                select event_type, event_ts
                from app.attendance_events
                where workspace_id = %s::uuid
                  and user_id = %s::uuid
                order by event_ts desc
                limit 1;
                """,
                (workspace_id, actor_id),
            )
            last = dict(cur.fetchone() or {})
            last_type = str(last.get("event_type") or "")
            last_ts = last.get("event_ts")
            if payload.event_type == "check_in":
                if last_type == "check_in":
                    raise HTTPException(status_code=409, detail="Déjà en check-in (check-out requis).")
            else:
                if last_type != "check_in":
                    raise HTTPException(status_code=409, detail="Check-out impossible sans check-in.")
                if isinstance(last_ts, datetime) and last_ts.date() != day:
                    raise HTTPException(status_code=409, detail="Check-out doit être le même jour que le check-in.")

            cur.execute(
                """
                insert into app.attendance_events(
                  workspace_id, user_id, location_id, event_type, event_ts, client_ts, client_tz, client_ip, user_agent, metadata
                )
                values (
                  %s::uuid, %s::uuid, %s::uuid, %s, %s, %s, %s, %s::inet, %s, '{}'::jsonb
                )
                returning id;
                """,
                (
                    workspace_id,
                    actor_id,
                    location_id,
                    payload.event_type,
                    now,
                    client_ts,
                    (payload.client_tz or "").strip() or None,
                    _coerce_inet_or_none(client_ip),
                    (request.headers.get("user-agent") or "").strip() or None,
                ),
            )
            event_id = int((cur.fetchone() or {}).get("id") or 0)

            _pg_compute_attendance_daily_range(
                cur,
                workspace_id=workspace_id,
                from_day=day,
                to_day=day,
                actor_scope_user_id=actor_id,
            )
            cur.execute(
                """
                select workspace_id::text as workspace_id,
                       user_id::text as user_id,
                       day,
                       first_check_in,
                       last_check_out,
                       minutes_present,
                       status,
                       computed_at
                from app.attendance_daily
                where workspace_id = %s::uuid
                  and user_id = %s::uuid
                  and day = %s::date
                limit 1;
                """,
                (workspace_id, actor_id, day),
            )
            daily = dict(cur.fetchone() or {})
        conn.commit()
    except HTTPException:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"attendance scan error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    return AttendanceScanOut(event_id=event_id, daily=AttendanceDailyOut(**daily))


@router.get("/workspaces/{workspace_id}/attendance/overview", response_model=AttendanceOverviewOut)
async def attendance_overview(
    workspace_id: str,
    request: Request,
    from_day: str | None = Query(default=None, alias="from"),
    to_day: str | None = Query(default=None, alias="to"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> AttendanceOverviewOut:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    start, end = clamp_date_window(parse_day(from_day), parse_day(to_day), default_days=30)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            _pg_assert_workspace_admin(cur, workspace_id, actor_id)

            _pg_compute_attendance_daily_range(cur, workspace_id=workspace_id, from_day=start, to_day=end)

            cur.execute(
                """
                select day,
                       sum((status='present')::int)::int as present,
                       sum((status='partial')::int)::int as partial,
                       sum((status='absent')::int)::int as absent
                from app.attendance_daily
                where workspace_id = %s::uuid
                  and day >= %s::date
                  and day <= %s::date
                group by day
                order by day asc;
                """,
                (workspace_id, start, end),
            )
            series = [dict(r) for r in cur.fetchall()]
            cur.execute(
                """
                select
                  sum((status='present')::int)::int as present,
                  sum((status='partial')::int)::int as partial,
                  sum((status='absent')::int)::int as absent
                from app.attendance_daily
                where workspace_id = %s::uuid
                  and day >= %s::date
                  and day <= %s::date;
                """,
                (workspace_id, start, end),
            )
            totals = dict(cur.fetchone() or {})
        conn.commit()
    except HTTPException:
        raise
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"attendance overview error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    n_present = int(totals.get("present") or 0)
    n_partial = int(totals.get("partial") or 0)
    n_absent = int(totals.get("absent") or 0)
    denom = n_present + n_partial + n_absent
    present_rate = (float(n_present + n_partial) / float(denom)) if denom else 0.0
    return AttendanceOverviewOut(
        workspace_id=workspace_id,
        window={"from": start.isoformat(), "to": end.isoformat()},
        present_rate=present_rate,
        n_present=n_present,
        n_absent=n_absent,
        n_partial=n_partial,
        series=[AttendanceOverviewSeriesPoint(**p) for p in series],
    )


@router.get("/attendance/me", response_model=list[AttendanceDailyOut])
async def attendance_me(
    request: Request,
    from_day: str | None = Query(default=None, alias="from"),
    to_day: str | None = Query(default=None, alias="to"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> list[AttendanceDailyOut]:
    if _myplanning_store() != "postgres":
        raise HTTPException(status_code=409, detail="postgres store disabled (set MYPLANNING_STORE=postgres)")
    bearer_token = _parse_bearer_token(request)
    actor_id = await _resolve_pg_actor_id(db, current, bearer_token)
    start, end = clamp_date_window(parse_day(from_day), parse_day(to_day), default_days=30)
    dsn = _pg_dsn()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            _pg_upsert_auth_user(cur, actor_id, str(current.get("email") or ""))
            _pg_set_rls_actor(cur, actor_id)
            # Best effort: compute for all workspaces where the user is an active member.
            cur.execute(
                """
                select w.id::text as workspace_id
                from app.workspaces w
                where w.owner_id = %s::uuid
                   or exists (
                     select 1 from app.workspace_members wm
                     where wm.workspace_id = w.id
                       and wm.user_id = %s::uuid
                       and coalesce(wm.status,'active')='active'
                   );
                """,
                (actor_id, actor_id),
            )
            workspaces = [str(r.get("workspace_id")) for r in cur.fetchall() if r.get("workspace_id")]
            for ws in workspaces:
                _pg_compute_attendance_daily_range(cur, workspace_id=ws, from_day=start, to_day=end, actor_scope_user_id=actor_id)

            cur.execute(
                """
                select workspace_id::text as workspace_id,
                       user_id::text as user_id,
                       day,
                       first_check_in,
                       last_check_out,
                       minutes_present,
                       status,
                       computed_at
                from app.attendance_daily
                where user_id = %s::uuid
                  and day >= %s::date
                  and day <= %s::date
                order by day desc, workspace_id asc
                limit 2000;
                """,
                (actor_id, start, end),
            )
            rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
    except Exception as exc:
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"attendance me error: {exc.__class__.__name__}")
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return [AttendanceDailyOut(**r) for r in rows]
