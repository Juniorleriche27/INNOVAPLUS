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
