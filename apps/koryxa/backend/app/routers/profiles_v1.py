from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.profiles_v1 import (
    CompanyProfilePayload,
    LearnerProfilePayload,
    MissionProfilePayload,
    ProfileResponse,
)


router = APIRouter(prefix="/profiles-v1", tags=["profiles-v1"])
COLLECTION = "user_profiles_v1"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _load_profile(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, Any]:
    return await db[COLLECTION].find_one({"user_id": user_id}) or {}


async def _save_profile(db: AsyncIOMotorDatabase, user_id: str, payload: Dict[str, Any]) -> None:
    payload["updated_at"] = _now_iso()
    await db[COLLECTION].update_one({"user_id": user_id}, {"$set": payload}, upsert=True)


@router.get("/me", response_model=ProfileResponse)
async def get_profile(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    doc = await _load_profile(db, user_id)
    return ProfileResponse(
        user_id=user_id,
        account_type=current.get("account_type"),
        country=current.get("country"),
        learner=doc.get("learner"),
        mission=doc.get("mission"),
        company=doc.get("company"),
        skills_validated=doc.get("skills_validated") or [],
        updated_at=doc.get("updated_at"),
    )


@router.put("/learner")
async def upsert_learner_profile(
    payload: LearnerProfilePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if current.get("account_type") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profil apprenant reserve aux comptes learner.",
        )
    user_id = str(current.get("_id"))
    doc = await _load_profile(db, user_id)
    doc["learner"] = payload.dict()
    await _save_profile(db, user_id, doc)
    return {"ok": True, "updated_at": doc["updated_at"]}


@router.put("/mission")
async def upsert_mission_profile(
    payload: MissionProfilePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if current.get("account_type") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profil mission reserve aux apprenants.",
        )
    user_id = str(current.get("_id"))
    doc = await _load_profile(db, user_id)
    doc["mission"] = payload.dict()
    await _save_profile(db, user_id, doc)
    return {"ok": True, "updated_at": doc["updated_at"]}


@router.put("/company")
async def upsert_company_profile(
    payload: CompanyProfilePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if current.get("account_type") not in {"company", "organization"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profil entreprise reserve aux comptes company/organization.",
        )
    user_id = str(current.get("_id"))
    doc = await _load_profile(db, user_id)
    doc["company"] = payload.dict()
    await _save_profile(db, user_id, doc)
    return {"ok": True, "updated_at": doc["updated_at"]}
