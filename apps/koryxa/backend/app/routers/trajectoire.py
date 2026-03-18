from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from typing import Any
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.public_access import ensure_guest_id, get_guest_id
from app.db.mongo import get_db
from app.deps.auth import get_current_user, get_current_user_optional
from app.routers.myplanning import _dual_create_task, _myplanning_tasks_store, _pg_create_task
from app.schemas.myplanning import TaskCreatePayload
from app.schemas.partner_public import PublicPartnerListResponse
from app.schemas.trajectory import (
    TrajectoryCockpitActivationResponse,
    TrajectoryCockpitContextResponse,
    TrajectoryFlowResponse,
    TrajectoryOnboardingPayload,
    TrajectoryProofCreatePayload,
    TrajectoryProgressUpdatePayload,
)
from app.services.partner_registry import list_public_partners
from app.services.trajectory_service import (
    build_trajectory_execution_stages,
    build_trajectory_experience,
    create_proof_submission,
    recompute_trajectory_state,
    trajectory_context_id,
    trajectory_result_benefits,
    trajectory_result_next_actions,
)
from app.utils.ids import to_object_id


router = APIRouter(prefix="/trajectoire", tags=["trajectoire"])


def _serialize_flow(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "flow_id": str(doc["_id"]),
        "guest_id": doc.get("guest_id") or "",
        "status": doc.get("status") or "draft",
        "onboarding": doc.get("onboarding") or {},
        "diagnostic": doc.get("diagnostic"),
        "progress_plan": doc.get("progress_plan"),
        "proofs": list(doc.get("proofs") or []),
        "verified_profile": doc.get("verified_profile"),
        "opportunity_targets": list(doc.get("opportunity_targets") or []),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


def _find_task(plan: dict[str, Any], task_key: str) -> dict[str, Any] | None:
    for stage in plan.get("stages") or []:
        for task in stage.get("tasks") or []:
            if task.get("key") == task_key:
                return task
    return None


def _cockpit_url(flow_id: str, context_id: str) -> str:
    return f"/myplanning/app/koryxa?flow_id={quote(flow_id)}&context_id={quote(context_id)}"


def _cockpit_login_url(flow_id: str, context_id: str) -> str:
    redirect = quote(_cockpit_url(flow_id, context_id), safe="")
    return f"/myplanning/login?redirect={redirect}"


def _request_stub() -> SimpleNamespace:
    return SimpleNamespace(headers={})


async def _resolve_flow(
    flow_id: str,
    request: Request,
    response: Response | None,
    db: AsyncIOMotorDatabase,
    current: dict | None,
) -> dict[str, Any]:
    flow_oid = to_object_id(flow_id)
    guest_id = get_guest_id(request)

    if current:
        flow = await db["trajectory_flows"].find_one({"_id": flow_oid, "user_id": current["_id"]})
        if flow:
            return flow
        if guest_id:
            flow = await db["trajectory_flows"].find_one(
                {
                    "_id": flow_oid,
                    "guest_id": guest_id,
                    "$or": [{"user_id": None}, {"user_id": current["_id"]}],
                }
            )
            if flow:
                now = datetime.now(timezone.utc)
                await db["trajectory_flows"].update_one(
                    {"_id": flow_oid},
                    {"$set": {"user_id": current["_id"], "updated_at": now}},
                )
                flow["user_id"] = current["_id"]
                flow["updated_at"] = now
                return flow
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")

    resolved_guest_id = ensure_guest_id(request, response) if response is not None else guest_id
    if not resolved_guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    flow = await db["trajectory_flows"].find_one({"_id": flow_oid, "guest_id": resolved_guest_id})
    if not flow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")
    return flow


def _priority_for_stage(order: int) -> str:
    if order <= 1:
        return "urgent_important"
    if order == 2:
        return "important_not_urgent"
    return "urgent_not_important"


def _duration_for_task(task: dict[str, Any], stage_order: int) -> int:
    if task.get("proof_required"):
        return 60
    if stage_order >= 3:
        return 50
    return 40


def _build_myplanning_task_payload(
    flow: dict[str, Any],
    context_id: str,
    stage: dict[str, Any],
    task: dict[str, Any],
    task_index: int,
) -> TaskCreatePayload:
    flow_id = str(flow["_id"])
    stage_order = int(stage.get("order") or 1)
    due_at = datetime.utcnow() + timedelta(days=min(21, max(1, (stage_order - 1) * 5 + task_index + 1)))
    task_status = str(task.get("status") or "todo")
    kanban_state = "done" if task_status == "done" else "in_progress" if task_status == "in_progress" else "todo"
    return TaskCreatePayload(
        title=str(task.get("title") or "Action KORYXA"),
        description=str(task.get("description") or "Action issue du plan de progression KORYXA."),
        category="KORYXA",
        context_type="professional",
        context_id=context_id,
        priority_eisenhower=_priority_for_stage(stage_order),
        kanban_state=kanban_state,
        high_impact=bool(task.get("proof_required")) or stage_order <= 2,
        estimated_duration_minutes=_duration_for_task(task, stage_order),
        due_datetime=due_at,
        linked_goal=f"koryxa:{flow_id}:{stage.get('key')}:{task.get('key')}",
        source="ia",
        status="todo",
        comments="Tâche générée depuis le blueprint métier KORYXA. Sa complétion n'entraîne pas automatiquement une validation KORYXA.",
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
    if doc.get("kanban_state") == "done":
        doc["completed_at"] = now
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db["myplanning_tasks"].insert_one(doc)
    return str(result.inserted_id)


async def _ensure_cockpit_bindings(
    flow: dict[str, Any],
    db: AsyncIOMotorDatabase,
    current: dict,
) -> tuple[str, dict[str, dict[str, Any]], int]:
    context_id = trajectory_context_id(str(flow["_id"]))
    existing = await db["trajectory_task_bindings"].find(
        {"flow_id": flow["_id"], "user_id": current["_id"]}
    ).to_list(length=200)
    binding_map = {str(item.get("koryxa_task_key") or ""): item for item in existing}
    created_task_count = 0
    now = datetime.now(timezone.utc)

    for stage in flow.get("progress_plan", {}).get("stages") or []:
        for task_index, task in enumerate(stage.get("tasks") or []):
            task_key = str(task.get("key") or "")
            if not task_key:
                continue
            binding = binding_map.get(task_key)
            if binding and binding.get("myplanning_task_id"):
                continue

            myplanning_task_id = await _create_myplanning_task(
                _build_myplanning_task_payload(flow, context_id, stage, task, task_index),
                db=db,
                current=current,
            )
            created_task_count += 1
            binding_doc = {
                "flow_id": flow["_id"],
                "user_id": current["_id"],
                "context_id": context_id,
                "koryxa_stage_key": str(stage.get("key") or ""),
                "koryxa_task_key": task_key,
                "myplanning_task_id": myplanning_task_id,
                "proof_required": bool(task.get("proof_required", False)),
                "feature_gate": str(task.get("feature_gate") or "") or None,
                "created_at": now,
                "updated_at": now,
            }
            if binding and binding.get("_id"):
                await db["trajectory_task_bindings"].update_one(
                    {"_id": binding["_id"]},
                    {"$set": {**binding_doc, "created_at": binding.get("created_at") or now}},
                )
                binding_doc["_id"] = binding["_id"]
            else:
                result = await db["trajectory_task_bindings"].insert_one(binding_doc)
                binding_doc["_id"] = result.inserted_id
            binding_map[task_key] = binding_doc

    return context_id, binding_map, created_task_count


def _serialize_cockpit_context(
    flow: dict[str, Any],
    context_id: str,
    binding_map: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    diagnostic = flow.get("diagnostic") or {}
    readiness = (diagnostic.get("readiness") or {})
    def _proof_sort_key(item: dict[str, Any]) -> datetime:
        submitted_at = item.get("submitted_at")
        if isinstance(submitted_at, datetime):
            return submitted_at
        try:
            return datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00"))
        except Exception:
            return datetime.min.replace(tzinfo=timezone.utc)

    latest_proofs = sorted(
        list(flow.get("proofs") or []),
        key=_proof_sort_key,
        reverse=True,
    )[:5]
    execution_stages = build_trajectory_execution_stages(flow, binding_map=binding_map)
    proof_required_count = sum(
        1
        for stage in execution_stages
        for task in stage.get("tasks") or []
        if task.get("proof_required")
    )
    return {
        "flow_id": str(flow["_id"]),
        "context_id": context_id,
        "task_query": {"context_type": "professional", "context_id": context_id},
        "profile_summary": diagnostic.get("profile_summary") or "",
        "recommended_trajectory": diagnostic.get("recommended_trajectory") or {},
        "recommended_partners": list(diagnostic.get("recommended_partners") or []),
        "next_actions": trajectory_result_next_actions(flow, limit=3),
        "benefits": trajectory_result_benefits(flow, limit=3),
        "readiness": readiness,
        "verified_profile": flow.get("verified_profile"),
        "opportunity_targets": list(flow.get("opportunity_targets") or []),
        "latest_proofs": latest_proofs,
        "execution_stages": execution_stages,
        "binding_summary": {
            "binding_count": len(binding_map),
            "proof_required_count": proof_required_count,
        },
    }


@router.post("/onboarding", response_model=TrajectoryFlowResponse, status_code=status.HTTP_201_CREATED)
async def create_trajectory_onboarding(
    payload: TrajectoryOnboardingPayload,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    now = datetime.now(timezone.utc)
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    doc: dict[str, Any] = {
        "guest_id": guest_id,
        "user_id": current["_id"] if current else None,
        "status": "onboarded",
        "onboarding": payload.model_dump(),
        "diagnostic": None,
        "progress_plan": None,
        "proofs": [],
        "verified_profile": None,
        "opportunity_targets": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await db["trajectory_flows"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_flow(doc)


@router.post("/diagnostic", response_model=TrajectoryFlowResponse)
async def create_trajectory_diagnostic(
    payload: dict[str, str],
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    flow_id = (payload.get("flow_id") or "").strip()
    if not flow_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="flow_id requis")

    flow = await _resolve_flow(flow_id, request, response, db, current)

    partner_catalog = await list_public_partners(db)
    experience = await build_trajectory_experience(flow.get("onboarding") or {}, partner_catalog=partner_catalog)
    now = datetime.now(timezone.utc)
    update_doc = {
        "diagnostic": experience["diagnostic"],
        "progress_plan": experience["progress_plan"],
        "proofs": experience["proofs"],
        "verified_profile": experience["verified_profile"],
        "opportunity_targets": experience["opportunity_targets"],
        "status": experience["status"],
        "updated_at": now,
    }
    await db["trajectory_flows"].update_one({"_id": flow["_id"]}, {"$set": update_doc})
    flow.update(update_doc)
    return _serialize_flow(flow)


@router.get("/partners/public", response_model=PublicPartnerListResponse)
async def list_trajectory_partners(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return {"items": await list_public_partners(db)}


@router.get("/flows/{flow_id}", response_model=TrajectoryFlowResponse)
async def get_trajectory_flow(
    flow_id: str,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    flow = await _resolve_flow(flow_id, request, response, db, current)

    if flow.get("diagnostic") and flow.get("progress_plan"):
        refreshed = recompute_trajectory_state(flow)
        refreshed["updated_at"] = datetime.now(timezone.utc)
        await db["trajectory_flows"].update_one(
            {"_id": flow["_id"]},
            {
                "$set": {
                    "diagnostic": refreshed["diagnostic"],
                    "progress_plan": refreshed["progress_plan"],
                    "proofs": refreshed["proofs"],
                    "verified_profile": refreshed["verified_profile"],
                    "opportunity_targets": refreshed["opportunity_targets"],
                    "status": refreshed["status"],
                    "updated_at": refreshed["updated_at"],
                }
            },
        )
        flow = refreshed
    return _serialize_flow(flow)


@router.patch("/flows/{flow_id}/progress", response_model=TrajectoryFlowResponse)
async def update_trajectory_progress(
    flow_id: str,
    payload: TrajectoryProgressUpdatePayload,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    flow = await _resolve_flow(flow_id, request, response, db, current)
    if not flow.get("progress_plan"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le diagnostic doit être généré d'abord.")

    progress_plan = flow.get("progress_plan") or {}
    task = _find_task(progress_plan, payload.step_key)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Étape introuvable")
    if task.get("proof_required") and payload.status == "done":
        validated_proofs = sum(
            1
            for proof in flow.get("proofs") or []
            if proof.get("task_key") == payload.step_key and proof.get("status") == "validated"
        )
        if validated_proofs == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ajoutez d'abord une preuve validée avant de marquer cette étape comme terminée.",
            )

    task["status"] = payload.status
    if payload.proof and task.get("proof_required"):
        proof_payload = {
            "stage_key": next(
                (
                    stage.get("key")
                    for stage in progress_plan.get("stages") or []
                    if any(item.get("key") == payload.step_key for item in stage.get("tasks") or [])
                ),
                "",
            ),
            "task_key": payload.step_key,
            "proof_type": "summary_note",
            "value": payload.proof,
            "summary": "Preuve fournie depuis la mise à jour rapide de progression.",
        }
        flow.setdefault("proofs", []).append(create_proof_submission(proof_payload))

    flow["progress_plan"] = progress_plan
    refreshed = recompute_trajectory_state(flow)
    refreshed["updated_at"] = datetime.now(timezone.utc)
    await db["trajectory_flows"].update_one(
        {"_id": flow["_id"]},
        {
            "$set": {
                "diagnostic": refreshed["diagnostic"],
                "progress_plan": refreshed["progress_plan"],
                "proofs": refreshed["proofs"],
                "verified_profile": refreshed["verified_profile"],
                "opportunity_targets": refreshed["opportunity_targets"],
                "status": refreshed["status"],
                "updated_at": refreshed["updated_at"],
            }
        },
    )
    return _serialize_flow(refreshed)


@router.post("/flows/{flow_id}/proofs", response_model=TrajectoryFlowResponse)
async def submit_trajectory_proof(
    flow_id: str,
    payload: TrajectoryProofCreatePayload,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    flow = await _resolve_flow(flow_id, request, response, db, current)
    if not flow.get("progress_plan"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le diagnostic doit être généré avant toute preuve.")

    task = _find_task(flow.get("progress_plan") or {}, payload.task_key)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tâche introuvable pour cette preuve.")

    proof = create_proof_submission(payload.model_dump())
    flow.setdefault("proofs", []).append(proof)
    refreshed = recompute_trajectory_state(flow)
    refreshed["updated_at"] = datetime.now(timezone.utc)
    await db["trajectory_flows"].update_one(
        {"_id": flow["_id"]},
        {
            "$set": {
                "diagnostic": refreshed["diagnostic"],
                "progress_plan": refreshed["progress_plan"],
                "proofs": refreshed["proofs"],
                "verified_profile": refreshed["verified_profile"],
                "opportunity_targets": refreshed["opportunity_targets"],
                "status": refreshed["status"],
                "updated_at": refreshed["updated_at"],
            }
        },
    )
    return _serialize_flow(refreshed)


@router.post("/flows/{flow_id}/cockpit", response_model=TrajectoryCockpitActivationResponse)
async def activate_trajectory_cockpit(
    flow_id: str,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    flow = await _resolve_flow(flow_id, request, response, db, current)
    if not flow.get("diagnostic") or not flow.get("progress_plan"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le diagnostic doit être généré avant l'ouverture du cockpit.")

    context_id = trajectory_context_id(str(flow["_id"]))
    redirect_url = _cockpit_url(str(flow["_id"]), context_id)
    if not current:
        return {
            "status": "auth_required",
            "flow_id": str(flow["_id"]),
            "context_id": context_id,
            "task_query": {"context_type": "professional", "context_id": context_id},
            "redirect_url": _cockpit_login_url(str(flow["_id"]), context_id),
            "binding_count": 0,
            "created_task_count": 0,
        }

    _, binding_map, created_task_count = await _ensure_cockpit_bindings(flow, db, current)
    return {
        "status": "ready",
        "flow_id": str(flow["_id"]),
        "context_id": context_id,
        "task_query": {"context_type": "professional", "context_id": context_id},
        "redirect_url": redirect_url,
        "binding_count": len(binding_map),
        "created_task_count": created_task_count,
    }


@router.get("/flows/{flow_id}/cockpit", response_model=TrajectoryCockpitContextResponse)
async def get_trajectory_cockpit_context(
    flow_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    flow = await _resolve_flow(flow_id, request, None, db, current)
    if not flow.get("diagnostic") or not flow.get("progress_plan"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le diagnostic doit être généré avant le cockpit.")

    refreshed = recompute_trajectory_state(flow)
    refreshed["updated_at"] = datetime.now(timezone.utc)
    await db["trajectory_flows"].update_one(
        {"_id": flow["_id"]},
        {
            "$set": {
                "diagnostic": refreshed["diagnostic"],
                "progress_plan": refreshed["progress_plan"],
                "proofs": refreshed["proofs"],
                "verified_profile": refreshed["verified_profile"],
                "opportunity_targets": refreshed["opportunity_targets"],
                "status": refreshed["status"],
                "updated_at": refreshed["updated_at"],
            }
        },
    )
    context_id, binding_map, _ = await _ensure_cockpit_bindings(refreshed, db, current)
    return _serialize_cockpit_context(refreshed, context_id, binding_map)
