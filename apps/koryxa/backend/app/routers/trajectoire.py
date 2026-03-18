from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.public_access import ensure_guest_id, get_guest_id
from app.db.mongo import get_db
from app.deps.auth import get_current_user_optional
from app.schemas.partner_public import PublicPartnerListResponse
from app.schemas.trajectory import (
    TrajectoryFlowResponse,
    TrajectoryOnboardingPayload,
    TrajectoryProofCreatePayload,
    TrajectoryProgressUpdatePayload,
)
from app.services.partner_registry import list_public_partners
from app.services.trajectory_service import (
    build_trajectory_experience,
    create_proof_submission,
    recompute_trajectory_state,
)
from app.utils.ids import to_object_id


router = APIRouter(prefix="/trajectoire", tags=["trajectoire"])


def _owner_filter(current: dict | None, guest_id: str | None) -> dict[str, Any]:
    if current:
        return {"user_id": current["_id"]}
    if not guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    return {"guest_id": guest_id}


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

    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    flow = await db["trajectory_flows"].find_one({"_id": to_object_id(flow_id), **_owner_filter(current, guest_id)})
    if not flow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")

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
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    flow = await db["trajectory_flows"].find_one({"_id": to_object_id(flow_id), **_owner_filter(current, guest_id)})
    if not flow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")

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
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    flow = await db["trajectory_flows"].find_one({"_id": to_object_id(flow_id), **_owner_filter(current, guest_id)})
    if not flow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")
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
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    flow = await db["trajectory_flows"].find_one({"_id": to_object_id(flow_id), **_owner_filter(current, guest_id)})
    if not flow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")
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
