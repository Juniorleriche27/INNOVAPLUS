from __future__ import annotations

import logging
import re
import os
import uuid
import json
import base64
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import time

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
import psycopg2
from psycopg2.extras import RealDictCursor

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


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/myplanning", tags=["myplanning"])

COLLECTION = "myplanning_tasks"
ONBOARDING_COLLECTION = "myplanning_onboarding"
WORKSPACES_COLLECTION = "myplanning_workspaces"
WORKSPACE_MEMBERS_COLLECTION = "myplanning_workspace_members"
_RATE_LIMIT_BUCKETS: dict[str, List[float]] = {}


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
        "collaborator_ids": collaborators,
        "source": doc.get("source") or "manual",
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
        try:
            doc["assignee_user_id"] = to_object_id(doc["assignee_user_id"])
        except HTTPException:
            doc["assignee_user_id"] = None
    if "collaborator_ids" in doc and doc["collaborator_ids"]:
        converted: List[ObjectId] = []
        for value in doc["collaborator_ids"]:
            try:
                converted.append(to_object_id(value))
            except HTTPException:
                continue
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


@router.get("/tasks", response_model=TaskListResponse)
async def list_tasks(
    kanban_state: Optional[str] = Query(default=None),
    high_impact: Optional[bool] = Query(default=None),
    context_type: Optional[str] = Query(default=None, description="personal|professional|learning"),
    context_id: Optional[str] = Query(default=None, description="Identifier du contexte (ex: certificate_id)"),
    date: Optional[str] = Query(default=None, description="ISO date filter for today view"),
    week_start: Optional[str] = Query(default=None, description="ISO date for the starting Monday"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskListResponse:
    criteria: Dict[str, Any] = {"user_id": current["_id"]}
    if kanban_state:
        criteria["kanban_state"] = kanban_state
    if high_impact is not None:
        criteria["high_impact"] = bool(high_impact)
    if context_type:
        criteria["context_type"] = context_type
    if context_id:
        criteria["context_id"] = context_id
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
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskResponse:
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
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskResponse:
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
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> Response:
    oid = to_object_id(task_id)
    result = await db[COLLECTION].delete_one({"_id": oid, "user_id": current["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/tasks/bulk_create", response_model=TaskListResponse)
async def bulk_create_tasks(
    payload: List[TaskCreatePayload],
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskListResponse:
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
