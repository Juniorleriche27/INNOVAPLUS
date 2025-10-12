from __future__ import annotations

import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, validator

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


# --- Rate limit (very simple, in-memory, per-IP) ---
RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM_PUBLIC", "120") or 120)
_RL_BUCKET: Dict[Tuple[str, str], Tuple[int, float]] = {}


def rate_limiter(request: Request):
    if RATE_LIMIT_RPM <= 0:
        return
    ip = request.client.host if request.client else "anon"
    key = ("pub", ip)
    used, start = _RL_BUCKET.get(key, (0, time.time()))
    now = time.time()
    if now - start >= 60:
        used, start = 0, now
    used += 1
    _RL_BUCKET[key] = (used, start)
    if used > RATE_LIMIT_RPM:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")


# --- Models ---
class OfferCreate(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    skills: List[str] = Field(default_factory=list)
    country: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default="USD", max_length=8)
    owner_id: str

    @validator("skills")
    def _max_skills(cls, v: List[str]):
        if len(v) > 20:
            raise ValueError("max 20 skills")
        return v


class Offer(BaseModel):
    offer_id: str
    title: str
    skills: List[str] = []
    country: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    owner_id: str
    status: str = "draft"  # draft|live|filled|archived
    created_at: str


class ApplyPayload(BaseModel):
    offer_id: str
    user_id: str


class Assignment(BaseModel):
    id: str
    offer_id: str
    user_id: str
    status: str = "applied"  # applied|accepted|rejected
    created_at: str


_offers: Dict[str, Offer] = {}
_assignments: Dict[str, Assignment] = {}


def _new_id(prefix: str) -> str:
    return f"{prefix}_{int(time.time()*1000)}"


@router.post("/offers/create", dependencies=[Depends(rate_limiter)])
async def create_offer(body: OfferCreate):
    # Idempotence by title+owner in last minute
    now = datetime.utcnow().isoformat()
    for o in _offers.values():
        if o.owner_id == body.owner_id and o.title == body.title and (time.time() - _epoch(o.created_at)) < 60:
            return {"offer_id": o.offer_id, "advice": _advice(body)}

    offer_id = _new_id("offer")
    offer = Offer(
        offer_id=offer_id,
        title=body.title,
        skills=[s.strip() for s in (body.skills or []) if s.strip()],
        country=(body.country or "").strip() or None,
        price=body.price,
        currency=body.currency or "USD",
        owner_id=body.owner_id,
        status="live",
        created_at=now,
    )
    _offers[offer_id] = offer
    return {"offer_id": offer_id, "advice": _advice(body)}


def _advice(body: OfferCreate) -> dict:
    tips = {}
    if not body.price:
        # naive price advice
        tips["price_suggestion"] = 200 if (body.country or "").upper() in {"SN","CI"} else 300
    missing = []
    title_l = body.title.lower()
    if "react" in title_l and "react" not in [s.lower() for s in body.skills]:
        missing.append("react")
    if "data" in title_l and "data" not in [s.lower() for s in body.skills]:
        missing.append("data")
    if missing:
        tips["missing_skills"] = missing
    return tips


def _epoch(iso: str) -> float:
    try:
        return datetime.fromisoformat(iso).timestamp()
    except Exception:
        return time.time()


@router.get("/offers", dependencies=[Depends(rate_limiter)])
async def list_offers(status: Optional[str] = None, country: Optional[str] = None, skills: Optional[str] = None, limit: int = 20, offset: int = 0):
    items = list(_offers.values())
    if status:
        items = [o for o in items if o.status == status]
    if country:
        items = [o for o in items if (o.country or "").upper() == country.upper()]
    if skills:
        want = {s.strip().lower() for s in skills.split(",") if s.strip()}
        items = [o for o in items if want.intersection({s.lower() for s in o.skills})]
    items.sort(key=lambda o: o.created_at, reverse=True)
    return {"items": [o.dict() for o in items[offset:offset+limit]], "total": len(items)}


@router.post("/offers/apply", dependencies=[Depends(rate_limiter)])
async def apply_offer(payload: ApplyPayload):
    if payload.offer_id not in _offers:
        raise HTTPException(status_code=404, detail="Offer not found")
    # idempotent by (offer,user)
    for a in _assignments.values():
        if a.offer_id == payload.offer_id and a.user_id == payload.user_id:
            return {"assignment_id": a.id}
    aid = _new_id("assign")
    a = Assignment(id=aid, offer_id=payload.offer_id, user_id=payload.user_id, created_at=datetime.utcnow().isoformat())
    _assignments[aid] = a
    return {"assignment_id": aid}


@router.post("/offers/close", dependencies=[Depends(rate_limiter)])
async def close_offer(offer_id: str):
    o = _offers.get(offer_id)
    if not o:
        raise HTTPException(status_code=404, detail="Offer not found")
    o.status = "filled"
    # in real life: sync assignments; here just return counts
    count = sum(1 for a in _assignments.values() if a.offer_id == offer_id)
    return {"ok": True, "assignments": count}


@router.get("/recommendations")
async def market_recommendations(user_id: str):
    # naive: reuse profile from me.py if present
    try:
        from .me import _profiles
    except Exception:
        _profiles = {}
    prof = _profiles.get(user_id, {})
    country = (prof.get("country") or "").upper()
    skills = {s.lower() for s in prof.get("skills", [])}
    items = [o for o in _offers.values() if o.status == "live"]
    scored = []
    for o in items:
        score = 0.4
        rs: List[str] = []
        if country and (o.country or "").upper() == country:
            score += 0.3
            rs.append("pays priorisé (NeedIndex)")
        if skills.intersection({s.lower() for s in o.skills}):
            score += 0.2
            rs.append("skills correspondantes")
        rs.append("récence")
        scored.append({"offer": o, "score": round(score, 2), "reasons": rs})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return [
        {
            "offer_id": s["offer"].offer_id,
            "title": s["offer"].title,
            "country": s["offer"].country,
            "score": s["score"],
            "reasons": s["reasons"],
        }
        for s in scored
    ]

