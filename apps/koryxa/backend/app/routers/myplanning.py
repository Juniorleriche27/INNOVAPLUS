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
    _rate_limit(f"ai_replan:{current['_id']}")
    tasks = await _load_open_tasks(db, current["_id"], payload.task_ids)
    recs = await replan_with_time_limit(tasks, payload.available_minutes)
    formatted = [
        {"task_id": item["task_id"], "suggested_minutes": item.get("suggested_minutes"), "reason": item.get("reason")}
        for item in recs
    ]
    return AiReplanResponse(recommendations=formatted)
