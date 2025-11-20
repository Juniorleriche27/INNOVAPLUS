from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

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
        "linked_goal": doc.get("linked_goal"),
        "moscow": doc.get("moscow"),
        "status": doc.get("status"),
        "energy_level": doc.get("energy_level"),
        "pomodoro_estimated": doc.get("pomodoro_estimated"),
        "pomodoro_done": doc.get("pomodoro_done"),
        "comments": doc.get("comments"),
        "assignee_user_id": str(doc.get("assignee_user_id")) if doc.get("assignee_user_id") else None,
        "collaborator_ids": collaborators,
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
    cursor = (
        db[COLLECTION]
        .find(criteria)
        .sort([("high_impact", -1), ("due_datetime", 1), ("created_at", -1)])
        .limit(250)
    )
    tasks: List[TaskResponse] = []
    async for doc in cursor:
        tasks.append(_serialize_task(doc))
    return TaskListResponse(items=tasks)


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreatePayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
) -> TaskResponse:
    now = datetime.utcnow()
    doc = payload.dict()
    doc = _prepare_task_payload(doc)
    doc["user_id"] = current["_id"]
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
    updates = _prepare_task_payload(updates)
    updates["updated_at"] = datetime.utcnow()
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


@router.post("/ai/suggest-tasks", response_model=AiSuggestTasksResponse)
async def ai_suggest_tasks(
    payload: AiSuggestTasksRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),  # noqa: ARG001
    current: dict = Depends(get_current_user),  # noqa: ARG001
) -> AiSuggestTasksResponse:
    drafts = await suggest_tasks_from_text(payload.free_text, payload.language, payload.preferred_duration_block)
    return AiSuggestTasksResponse(drafts=drafts)


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
    tasks = await _load_open_tasks(db, current["_id"], payload.task_ids)
    recs = await replan_with_time_limit(tasks, payload.available_minutes)
    formatted = [
        {"task_id": item["task_id"], "suggested_minutes": item.get("suggested_minutes"), "reason": item.get("reason")}
        for item in recs
    ]
    return AiReplanResponse(recommendations=formatted)
