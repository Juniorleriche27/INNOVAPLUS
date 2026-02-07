from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import time

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

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
)
from app.services.myplanning_ai import plan_day_with_llama, replan_with_time_limit, suggest_tasks_from_text
from app.utils.ids import to_object_id


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/myplanning", tags=["myplanning"])

COLLECTION = "myplanning_tasks"
ONBOARDING_COLLECTION = "myplanning_onboarding"
_RATE_LIMIT_BUCKETS: dict[str, List[float]] = {}


def _rate_limit(key: str, limit: int = 30, window_seconds: int = 60) -> None:
    now = time.time()
    bucket = _RATE_LIMIT_BUCKETS.get(key, [])
    bucket = [ts for ts in bucket if now - ts < window_seconds]
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Trop de requêtes. Réessayez dans quelques instants.")
    bucket.append(now)
    _RATE_LIMIT_BUCKETS[key] = bucket


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
    return OnboardingStateResponse(
        user_intent=doc.get("user_intent"),
        main_goal=doc.get("main_goal"),
        daily_time_budget=doc.get("daily_time_budget"),
        onboarding_completed=bool(doc.get("onboarding_completed")),
        generated_tasks=doc.get("generated_tasks") or [],
        updated_at=_serialize_datetime(doc.get("updated_at")),
    )


def _build_onboarding_brief(intent: str, goal: str, daily_budget: str) -> str:
    minutes = _daily_budget_to_minutes(daily_budget)
    return (
        f"Intent: {_intent_to_text(intent)}.\n"
        f"Objectif principal: {goal.strip()}.\n"
        f"Temps réel par jour: {minutes} minutes.\n"
        "Retourne uniquement les actions les plus utiles aujourd'hui."
    )


def _fallback_onboarding_tasks(main_goal: str, daily_minutes: int) -> List[Dict[str, Any]]:
    main_block = max(20, min(120, int(daily_minutes * 0.6)))
    prep_block = max(10, min(40, int(daily_minutes * 0.2)))
    close_block = max(10, min(30, int(daily_minutes * 0.2)))
    return [
        {
            "title": "Clarifier le livrable du jour",
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


def _normalize_onboarding_tasks(candidates: List[Dict[str, Any]], goal: str, daily_budget: str) -> List[Dict[str, Any]]:
    daily_minutes = _daily_budget_to_minutes(daily_budget)
    normalized: List[Dict[str, Any]] = []
    seen_titles: set[str] = set()
    for item in candidates:
        if len(normalized) >= 3:
            break
        title = str(item.get("title") or "").strip()
        if len(title) < 3:
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
        for fallback in _fallback_onboarding_tasks(goal, daily_minutes):
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
    if "main_goal" in updates and isinstance(updates["main_goal"], str):
        updates["main_goal"] = updates["main_goal"].strip()
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
    goal = payload.main_goal.strip()
    brief = _build_onboarding_brief(payload.user_intent, goal, payload.daily_time_budget)
    drafts, _used_fallback = await suggest_tasks_from_text(brief, "fr", None)
    generated_tasks = _normalize_onboarding_tasks(drafts, goal, payload.daily_time_budget)
    now = datetime.utcnow()
    await db[ONBOARDING_COLLECTION].update_one(
        {"user_id": current["_id"]},
        {
            "$set": {
                "user_intent": payload.user_intent,
                "main_goal": goal,
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
    if not doc.get("user_intent") or not doc.get("main_goal") or not doc.get("daily_time_budget"):
        raise HTTPException(status_code=400, detail="Onboarding incomplet. Terminez d’abord les étapes 1 à 4.")

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
                "description": f"Objectif principal: {doc.get('main_goal')}",
                "category": "Onboarding MyPlanning",
                "priority_eisenhower": "urgent_important" if impact_level == "élevé" else "important_not_urgent",
                "kanban_state": "todo",
                "high_impact": impact_level == "élevé",
                "estimated_duration_minutes": int(task["estimated_time"]),
                "due_datetime": due_dt,
                "linked_goal": str(doc.get("main_goal")),
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
