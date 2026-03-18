from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.public_access import ensure_guest_id, get_guest_id
from app.db.mongo import get_db
from app.deps.auth import get_current_user_optional
from app.schemas.enterprise_public import (
    EnterpriseNeedCreatePayload,
    EnterpriseOpportunityListResponse,
    EnterpriseSubmissionResponse,
)
from app.services.enterprise_service import derive_statuses, structure_enterprise_need
from app.utils.ids import to_object_id


router = APIRouter(prefix="/enterprise", tags=["public-enterprise"])


def _serialize_need(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "organisation": doc["organisation"],
        "country": doc["country"],
        "domain": doc["domain"],
        "description": doc["description"],
        "context": doc["context"],
        "expected_deliverable": doc["expected_deliverable"],
        "need_type": doc["need_type"],
        "urgency": doc["urgency"],
        "treatment_mode": doc["treatment_mode"],
        "status": doc["status"],
        "qualification_score": doc["qualification_score"],
        "clarity_level": doc["clarity_level"],
        "structured_summary": doc["structured_summary"],
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
        "title": doc["title"],
        "summary": doc["summary"],
        "status": doc["status"],
        "highlights": list(doc.get("highlights") or []),
        "published_at": doc.get("published_at"),
    }


def _owner_filter(current: dict | None, guest_id: str | None) -> dict[str, Any]:
    if current:
        return {"user_id": current["_id"]}
    if not guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    return {"guest_id": guest_id}


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
    statuses = derive_statuses(payload.model_dump())

    need_doc: dict[str, Any] = {
        **payload.model_dump(),
        "guest_id": guest_id,
        "user_id": current["_id"] if current else None,
        "status": statuses["need_status"],
        "qualification_score": structured["qualification_score"],
        "clarity_level": structured["clarity_level"],
        "structured_summary": structured["need_summary"],
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
    if payload.treatment_mode == "publie":
        opportunity_doc = {
            "need_id": need_doc["_id"],
            "mission_id": mission_doc["_id"],
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
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    need = await db["enterprise_needs"].find_one({"_id": to_object_id(need_id), **_owner_filter(current, guest_id)})
    if not need:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Besoin introuvable")

    mission = await db["enterprise_missions"].find_one({"need_id": need["_id"]})
    opportunity = await db["enterprise_opportunities"].find_one({"need_id": need["_id"]})
    return {
        "need": _serialize_need(need),
        "mission": _serialize_mission(mission),
        "opportunity": _serialize_opportunity(opportunity),
    }
