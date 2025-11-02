from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db

router = APIRouter(tags=["me"])


class OnboardingPayload(BaseModel):
    user_id: str
    country: Optional[str] = None
    skills: List[str] = []
    goal: Optional[str] = None  # "find_missions" | "publish_needs"


class Recommendation(BaseModel):
    id: str
    title: str
    country: Optional[str] = None
    score: float
    reasons: List[str]


COLL_PROFILES = "me_profiles"


@router.post("/me/profile")
async def upsert_profile(body: OnboardingPayload, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = {
        "user_id": body.user_id,
        "country": body.country,
        "skills": body.skills,
        "goal": body.goal,
        "last_active_at": datetime.utcnow().isoformat(),
    }
    await db[COLL_PROFILES].update_one({"user_id": body.user_id}, {"$set": doc}, upsert=True)
    return {"ok": True}


@router.get("/me/recommendations", response_model=List[Recommendation])
async def me_recommendations(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    prof = await db[COLL_PROFILES].find_one({"user_id": user_id}) or {}
    country = prof.get("country")
    skills = set([s.lower() for s in prof.get("skills", [])])

    # Placeholder sample opportunities (id, title, country, tags)
    sample = [
        {"id": "1", "title": "Data analyst pricing coopératives", "country": "CI", "tags": ["data", "bi"]},
        {"id": "2", "title": "Dev React tableau de bord", "country": "SN", "tags": ["react", "frontend"]},
        {"id": "3", "title": "Agent terrain collecte besoins", "country": "CI", "tags": ["field", "survey"]},
    ]

    out: List[Recommendation] = []
    for s in sample:
        rs: List[str] = []
        base = 0.4
        if country and s.get("country") == country:
            base += 0.3
            rs.append("pays priorisé (NeedIndex)")
        smatch = skills.intersection(set([t.lower() for t in s.get("tags", [])]))
        if smatch:
            base += 0.2
            rs.append("skills correspondantes")
        rs.append("récence")
        out.append(Recommendation(id=s["id"], title=s["title"], country=s.get("country"), score=round(base, 2), reasons=rs))
    out.sort(key=lambda r: r.score, reverse=True)
    return out
