from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from typing import Any
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.public_access import ensure_guest_id, get_guest_id
from app.db.mongo import get_db
from app.deps.auth import get_current_user_optional
from app.routers.myplanning import _dual_create_task, _myplanning_tasks_store, _pg_create_task
from app.schemas.enterprise_public import (
    EnterpriseCockpitActivationResponse,
    EnterpriseCockpitContextResponse,
    EnterpriseNeedCreatePayload,
    EnterpriseOpportunityListResponse,
    EnterpriseSubmissionResponse,
)
from app.schemas.myplanning import TaskCreatePayload
from app.services.enterprise_service import derive_statuses, structure_enterprise_need
from app.utils.ids import to_object_id


router = APIRouter(prefix="/enterprise", tags=["public-enterprise"])


def _serialize_need(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "primary_goal": doc["primary_goal"],
        "need_type": doc["need_type"],
        "expected_result": doc["expected_result"],
        "urgency": doc["urgency"],
        "treatment_preference": doc["treatment_preference"],
        "recommended_treatment_mode": doc["recommended_treatment_mode"],
        "team_context": doc["team_context"],
        "support_preference": doc["support_preference"],
        "short_brief": doc.get("short_brief"),
        "status": doc["status"],
        "qualification_score": doc["qualification_score"],
        "clarity_level": doc["clarity_level"],
        "structured_summary": doc["structured_summary"],
        "next_recommended_action": doc["next_recommended_action"],
        "created_at": doc["created_at"],
    }


def _serialize_mission(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "need_id": str(doc["need_id"]),
        "title": doc["title"],
        "summary": doc["summary"],
        "deliverable": doc["deliverable"],
        "execution_mode": doc["execution_mode"],
        "status": doc["status"],
        "steps": list(doc.get("steps") or []),
        "created_at": doc["created_at"],
    }


def _serialize_opportunity(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "need_id": str(doc["need_id"]),
        "mission_id": str(doc["mission_id"]),
        "type": doc["type"],
        "title": doc["title"],
        "summary": doc["summary"],
        "status": doc["status"],
        "highlights": list(doc.get("highlights") or []),
        "published_at": doc.get("published_at"),
    }


def _request_stub() -> SimpleNamespace:
    return SimpleNamespace(headers={})


def _enterprise_context_id(need_id: str) -> str:
    return f"koryxa-enterprise:{need_id}"


def _cockpit_url(need_id: str, context_id: str) -> str:
    return f"/myplanning/app/koryxa-enterprise?need_id={quote(need_id)}&context_id={quote(context_id)}"


def _cockpit_login_url(need_id: str, context_id: str) -> str:
    redirect = quote(_cockpit_url(need_id, context_id), safe="")
    return f"/myplanning/login?redirect={redirect}"


async def _resolve_need(
    need_id: str,
    request: Request,
    response: Response | None,
    db: AsyncIOMotorDatabase,
    current: dict | None,
) -> dict[str, Any]:
    need_oid = to_object_id(need_id)
    guest_id = get_guest_id(request)

    if current:
        need = await db["enterprise_needs"].find_one({"_id": need_oid, "user_id": current["_id"]})
        if need:
            return need
        if guest_id:
            need = await db["enterprise_needs"].find_one(
                {
                    "_id": need_oid,
                    "guest_id": guest_id,
                    "$or": [{"user_id": None}, {"user_id": current["_id"]}],
                }
            )
            if need:
                now = datetime.now(timezone.utc)
                await db["enterprise_needs"].update_one(
                    {"_id": need_oid},
                    {"$set": {"user_id": current["_id"], "updated_at": now}},
                )
                await db["enterprise_missions"].update_one(
                    {"need_id": need_oid},
                    {"$set": {"user_id": current["_id"], "updated_at": now}},
                )
                await db["enterprise_opportunities"].update_one(
                    {"need_id": need_oid},
                    {"$set": {"user_id": current["_id"], "updated_at": now}},
                )
                need["user_id"] = current["_id"]
                need["updated_at"] = now
                return need
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Besoin introuvable")

    resolved_guest_id = ensure_guest_id(request, response) if response is not None else guest_id
    if not resolved_guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    need = await db["enterprise_needs"].find_one({"_id": need_oid, "guest_id": resolved_guest_id})
    if not need:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Besoin introuvable")
    return need


def _priority_for_need(urgency: str, index: int) -> str:
    normalized = (urgency or "").strip().lower()
    if "urgent" in normalized or "forte" in normalized:
        return "urgent_important"
    if index == 0:
        return "important_not_urgent"
    return "not_urgent_not_important"


def _build_myplanning_task_payload(
    need: dict[str, Any],
    mission: dict[str, Any],
    context_id: str,
    step_text: str,
    step_index: int,
) -> TaskCreatePayload:
    due_at = datetime.utcnow() + timedelta(days=min(14, step_index * 3 + 2))
    return TaskCreatePayload(
        title=f"Entreprise • {step_text}",
        description=(
            f"{mission.get('summary') or 'Étape issue du besoin structuré KORYXA.'} "
            "La complétion de cette tâche dans MyPlanning ne clôture pas automatiquement le besoin KORYXA."
        ),
        category="KORYXA Enterprise",
        context_type="professional",
        context_id=context_id,
        priority_eisenhower=_priority_for_need(str(need.get("urgency") or ""), step_index),
        kanban_state="todo",
        high_impact=step_index == 0,
        estimated_duration_minutes=45 if step_index == 0 else 60,
        due_datetime=due_at,
        linked_goal=f"koryxa-enterprise:{str(need['_id'])}:step:{step_index + 1}",
        source="ia",
        status="todo",
        comments="Tâche générée depuis le besoin structuré KORYXA Entreprise.",
    )


async def _create_myplanning_task(
    payload: TaskCreatePayload,
    db: AsyncIOMotorDatabase,
    current: dict,
) -> str:
    store = _myplanning_tasks_store()
    if store == "postgres":
        created = await _pg_create_task(payload, _request_stub(), db, current)
        return created.id
    if store == "dual":
        created = await _dual_create_task(payload, _request_stub(), db, current)
        return created.id

    now = datetime.utcnow()
    doc = payload.model_dump(exclude_none=True)
    doc["user_id"] = current["_id"]
    doc["source"] = doc.get("source") or "ia"
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db["myplanning_tasks"].insert_one(doc)
    return str(result.inserted_id)


async def _ensure_cockpit_bindings(
    need: dict[str, Any],
    mission: dict[str, Any],
    db: AsyncIOMotorDatabase,
    current: dict,
) -> tuple[str, dict[str, dict[str, Any]], int]:
    context_id = _enterprise_context_id(str(need["_id"]))
    existing = await db["enterprise_task_bindings"].find(
        {"need_id": need["_id"], "user_id": current["_id"]}
    ).to_list(length=50)
    binding_map = {str(item.get("step_key") or ""): item for item in existing}
    created_task_count = 0
    now = datetime.now(timezone.utc)

    for step_index, step_text in enumerate(mission.get("steps") or [], start=1):
        step_key = f"step_{step_index}"
        binding = binding_map.get(step_key)
        if binding and binding.get("myplanning_task_id"):
            continue

        myplanning_task_id = await _create_myplanning_task(
            _build_myplanning_task_payload(need, mission, context_id, str(step_text), step_index - 1),
            db=db,
            current=current,
        )
        created_task_count += 1
        binding_doc = {
            "need_id": need["_id"],
            "user_id": current["_id"],
            "context_id": context_id,
            "step_key": step_key,
            "step_title": str(step_text),
            "myplanning_task_id": myplanning_task_id,
            "created_at": now,
            "updated_at": now,
        }
        if binding and binding.get("_id"):
            await db["enterprise_task_bindings"].update_one(
                {"_id": binding["_id"]},
                {"$set": {**binding_doc, "created_at": binding.get("created_at") or now}},
            )
            binding_doc["_id"] = binding["_id"]
        else:
            result = await db["enterprise_task_bindings"].insert_one(binding_doc)
            binding_doc["_id"] = result.inserted_id
        binding_map[step_key] = binding_doc

    return context_id, binding_map, created_task_count


def _serialize_cockpit_context(
    need: dict[str, Any],
    mission: dict[str, Any],
    opportunity: dict[str, Any] | None,
    context_id: str,
    binding_map: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    next_actions = [str(need.get("next_recommended_action") or "").strip()]
    next_actions.extend([str(step).strip() for step in (mission.get("steps") or [])[:2]])
    execution_steps = []
    for step_index, step_text in enumerate(mission.get("steps") or [], start=1):
        step_key = f"step_{step_index}"
        binding = binding_map.get(step_key) or {}
        execution_steps.append(
            {
                "step_key": step_key,
                "title": f"Étape {step_index}",
                "description": str(step_text),
                "myplanning_task_id": str(binding.get("myplanning_task_id") or "") or None,
                "status": "todo",
            }
        )

    return {
        "need_id": str(need["_id"]),
        "context_id": context_id,
        "task_query": {"context_type": "professional", "context_id": context_id},
        "need": _serialize_need(need),
        "mission": _serialize_mission(mission),
        "opportunity": _serialize_opportunity(opportunity),
        "next_actions": [item for item in next_actions if item][:3],
        "execution_steps": execution_steps,
        "binding_summary": {"binding_count": len(binding_map)},
    }


@router.post("/needs", response_model=EnterpriseSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_enterprise_need(
    payload: EnterpriseNeedCreatePayload,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    now = datetime.now(timezone.utc)
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    structured = await structure_enterprise_need(payload.model_dump())
    recommended_mode = str(structured["recommended_treatment_mode"])
    statuses = derive_statuses(recommended_mode)

    need_doc: dict[str, Any] = {
        **payload.model_dump(),
        "guest_id": guest_id,
        "user_id": current["_id"] if current else None,
        "title": structured["title"],
        "recommended_treatment_mode": recommended_mode,
        "status": statuses["need_status"],
        "qualification_score": structured["qualification_score"],
        "clarity_level": structured["clarity_level"],
        "structured_summary": structured["need_summary"],
        "next_recommended_action": structured["next_recommended_action"],
        "created_at": now,
        "updated_at": now,
    }
    need_result = await db["enterprise_needs"].insert_one(need_doc)
    need_doc["_id"] = need_result.inserted_id

    mission_doc: dict[str, Any] = {
        "need_id": need_doc["_id"],
        "guest_id": guest_id,
        "user_id": current["_id"] if current else None,
        "title": structured["mission"]["title"],
        "summary": structured["mission"]["summary"],
        "deliverable": structured["mission"]["deliverable"],
        "execution_mode": structured["mission"]["execution_mode"],
        "status": statuses["mission_status"],
        "steps": structured["mission"]["steps"],
        "created_at": now,
        "updated_at": now,
    }
    mission_result = await db["enterprise_missions"].insert_one(mission_doc)
    mission_doc["_id"] = mission_result.inserted_id

    opportunity_doc: dict[str, Any] | None = None
    if recommended_mode == "publie":
        opportunity_doc = {
            "need_id": need_doc["_id"],
            "mission_id": mission_doc["_id"],
            "type": structured["opportunity"]["type"],
            "title": structured["opportunity"]["title"],
            "summary": structured["opportunity"]["summary"],
            "status": statuses["opportunity_status"],
            "highlights": structured["opportunity"]["highlights"],
            "published_at": now,
            "created_at": now,
            "updated_at": now,
        }
        opportunity_result = await db["enterprise_opportunities"].insert_one(opportunity_doc)
        opportunity_doc["_id"] = opportunity_result.inserted_id

    return {
        "need": _serialize_need(need_doc),
        "mission": _serialize_mission(mission_doc),
        "opportunity": _serialize_opportunity(opportunity_doc),
    }


@router.get("/opportunities/public", response_model=EnterpriseOpportunityListResponse)
async def list_public_enterprise_opportunities(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    items = await db["enterprise_opportunities"].find({"status": "published"}).sort("published_at", -1).to_list(length=24)
    return {"items": [_serialize_opportunity(item) for item in items if item]}


@router.get("/needs/{need_id}", response_model=EnterpriseSubmissionResponse)
async def get_enterprise_need(
    need_id: str,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    need = await _resolve_need(need_id, request, response, db, current)
    mission = await db["enterprise_missions"].find_one({"need_id": need["_id"]})
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable pour ce besoin")
    opportunity = await db["enterprise_opportunities"].find_one({"need_id": need["_id"]})
    return {
        "need": _serialize_need(need),
        "mission": _serialize_mission(mission),
        "opportunity": _serialize_opportunity(opportunity),
    }


@router.post("/needs/{need_id}/cockpit", response_model=EnterpriseCockpitActivationResponse)
async def activate_enterprise_cockpit(
    need_id: str,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    need = await _resolve_need(need_id, request, response, db, current)
    mission = await db["enterprise_missions"].find_one({"need_id": need["_id"]})
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable pour ce besoin")

    context_id = _enterprise_context_id(str(need["_id"]))
    redirect_url = _cockpit_url(str(need["_id"]), context_id)
    if not current:
        return {
            "status": "auth_required",
            "need_id": str(need["_id"]),
            "context_id": context_id,
            "task_query": {"context_type": "professional", "context_id": context_id},
            "redirect_url": _cockpit_login_url(str(need["_id"]), context_id),
            "binding_count": 0,
            "created_task_count": 0,
        }

    _, binding_map, created_task_count = await _ensure_cockpit_bindings(need, mission, db, current)
    return {
        "status": "ready",
        "need_id": str(need["_id"]),
        "context_id": context_id,
        "task_query": {"context_type": "professional", "context_id": context_id},
        "redirect_url": redirect_url,
        "binding_count": len(binding_map),
        "created_task_count": created_task_count,
    }


@router.get("/needs/{need_id}/cockpit", response_model=EnterpriseCockpitContextResponse)
async def get_enterprise_cockpit_context(
    need_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    if not current:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Connexion requise pour le cockpit entreprise")

    need = await _resolve_need(need_id, request, None, db, current)
    mission = await db["enterprise_missions"].find_one({"need_id": need["_id"]})
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable pour ce besoin")
    opportunity = await db["enterprise_opportunities"].find_one({"need_id": need["_id"]})
    context_id, binding_map, _ = await _ensure_cockpit_bindings(need, mission, db, current)
    return _serialize_cockpit_context(need, mission, opportunity, context_id, binding_map)
