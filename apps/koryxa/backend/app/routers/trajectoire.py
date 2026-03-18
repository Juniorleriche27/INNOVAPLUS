from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.public_access import ensure_guest_id, get_guest_id
from app.db.mongo import get_db
from app.deps.auth import get_current_user_optional
from app.schemas.trajectory import (
    TrajectoryFlowResponse,
    TrajectoryOnboardingPayload,
    TrajectoryProgressUpdatePayload,
)
from app.services.trajectory_service import build_trajectory_diagnostic
from app.utils.ids import to_object_id


router = APIRouter(prefix="/trajectoire", tags=["trajectoire"])


def _serialize_flow(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "flow_id": str(doc["_id"]),
        "guest_id": doc.get("guest_id") or "",
        "status": doc.get("status") or "draft",
        "onboarding": doc.get("onboarding") or {},
        "diagnostic": doc.get("diagnostic"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


def _owner_filter(current: dict | None, guest_id: str | None) -> dict[str, Any]:
    if current:
        return {"user_id": current["_id"]}
    if not guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    return {"guest_id": guest_id}


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

    onboarding = flow.get("onboarding") or {}
    diagnostic = await build_trajectory_diagnostic(onboarding)
    now = datetime.now(timezone.utc)
    await db["trajectory_flows"].update_one(
        {"_id": flow["_id"]},
        {"$set": {"diagnostic": diagnostic, "status": "diagnosed", "updated_at": now}},
    )
    flow["diagnostic"] = diagnostic
    flow["status"] = "diagnosed"
    flow["updated_at"] = now
    return _serialize_flow(flow)


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

    diagnostic = flow.get("diagnostic") or {}
    steps = list(diagnostic.get("progress_steps") or [])
    updated = False
    for step in steps:
        if step.get("key") == payload.step_key:
            step["status"] = payload.status
            step["proof"] = payload.proof
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Étape introuvable")

    if all(step.get("status") == "done" for step in steps):
        flow_status = "validated"
    elif any(step.get("status") == "in_progress" for step in steps):
        flow_status = "in_progress"
    else:
        flow_status = flow.get("status") or "diagnosed"

    diagnostic["progress_steps"] = steps
    now = datetime.now(timezone.utc)
    await db["trajectory_flows"].update_one(
        {"_id": flow["_id"]},
        {"$set": {"diagnostic": diagnostic, "status": flow_status, "updated_at": now}},
    )
    flow["diagnostic"] = diagnostic
    flow["status"] = flow_status
    flow["updated_at"] = now
    return _serialize_flow(flow)
