from __future__ import annotations

import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, validator
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db

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
    description: str = Field(min_length=10, max_length=4000)
    category: Literal["talent", "service", "product", "mission", "bundle"] = "service"
    skills: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    country: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default="USD", max_length=8)
    owner_id: str
    owner_name: Optional[str] = None
    owner_avatar: Optional[str] = None
    cover_image: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    @validator("skills", "tags")
    def _max_skills(cls, v: List[str]):
        if len(v) > 20:
            raise ValueError("max 20 items")
        return [item.strip() for item in v if item.strip()]

    @validator("country")
    def _normalize_country(cls, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        clean = value.strip().upper()
        return clean or None

    @validator("cover_image")
    def _sanitize_cover(cls, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        return value.strip()


class Offer(BaseModel):
    offer_id: str
    title: str
    description: str = ""
    category: str = "service"
    skills: List[str] = []
    tags: List[str] = []
    country: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    owner_id: str
    owner_name: Optional[str] = None
    owner_avatar: Optional[str] = None
    cover_image: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
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


COLL_OFFERS = "market_offers"
COLL_ASSIGN = "assignments"
COLL_AUDIT = "decisions_audit"


def _new_id(prefix: str) -> str:
    return f"{prefix}_{int(time.time()*1000)}"


@router.post("/offers/create", dependencies=[Depends(rate_limiter)])
async def create_offer(body: OfferCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    now = datetime.utcnow().isoformat()
    # Idempotence: existing with same title/owner in last 60s
    recent = datetime.utcnow().timestamp() - 60
    cur = db[COLL_OFFERS].find({
        "owner_id": body.owner_id,
        "title": body.title,
        "created_at": {"$gte": datetime.utcfromtimestamp(recent).isoformat()}
    }).limit(1)
    if await cur.to_list(1):
        exist = (await cur.to_list(1))[0]
        return {"offer_id": exist["offer_id"], "advice": _advice(body)}

    offer_id = _new_id("offer")
    doc = Offer(
        offer_id=offer_id,
        title=body.title,
        description=body.description.strip(),
        category=body.category,
        skills=[s.strip() for s in (body.skills or []) if s.strip()],
        tags=[t.strip() for t in (body.tags or body.skills or []) if t.strip()],
        country=body.country,
        price=body.price,
        currency=body.currency or "USD",
        owner_id=body.owner_id,
        owner_name=(body.owner_name or "").strip() or None,
        owner_avatar=body.owner_avatar,
        cover_image=body.cover_image,
        contact_email=(body.contact_email or "").strip() or None,
        contact_phone=(body.contact_phone or "").strip() or None,
        status="live",
        created_at=now,
    ).dict()
    await db[COLL_OFFERS].insert_one(doc)
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
async def list_offers(
    status: Optional[str] = None,
    country: Optional[str] = None,
    skills: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    q: Dict = {}
    if status:
        q["status"] = status
    if country:
        q["country"] = country.upper()
    if category and category != "all":
        q["category"] = category
    cur = db[COLL_OFFERS].find(q).sort("created_at", -1).skip(offset).limit(limit)
    items = [Offer(**doc) async for doc in cur]
    # skills filter in-memory for simplicity
    if skills:
        want = {s.strip().lower() for s in skills.split(",") if s.strip()}
        items = [o for o in items if want.intersection({s.lower() for s in o.skills})]
    total = await db[COLL_OFFERS].count_documents(q)
    return {"items": [o.dict() for o in items], "total": total}


@router.post("/offers/apply", dependencies=[Depends(rate_limiter)])
async def apply_offer(payload: ApplyPayload, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not await db[COLL_OFFERS].find_one({"offer_id": payload.offer_id}):
        raise HTTPException(status_code=404, detail="Offer not found")
    exist = await db[COLL_ASSIGN].find_one({"offer_id": payload.offer_id, "user_id": payload.user_id})
    if exist:
        return {"assignment_id": exist["id"]}
    aid = _new_id("assign")
    a = Assignment(id=aid, offer_id=payload.offer_id, user_id=payload.user_id, created_at=datetime.utcnow().isoformat()).dict()
    await db[COLL_ASSIGN].insert_one(a)
    # fairness audit placeholder
    await db[COLL_AUDIT].insert_one({
        "kind": "marketplace_apply",
        "offer_id": payload.offer_id,
        "user_id": payload.user_id,
        "need_index": None,
        "quota": {"target": None, "used": None},
        "ts": datetime.utcnow().isoformat(),
    })
    return {"assignment_id": aid}


@router.post("/offers/close", dependencies=[Depends(rate_limiter)])
async def close_offer(offer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    o = await db[COLL_OFFERS].find_one({"offer_id": offer_id})
    if not o:
        raise HTTPException(status_code=404, detail="Offer not found")
    await db[COLL_OFFERS].update_one({"offer_id": offer_id}, {"$set": {"status": "filled"}})
    count = await db[COLL_ASSIGN].count_documents({"offer_id": offer_id})
    await db[COLL_AUDIT].insert_one({
        "kind": "marketplace_close",
        "offer_id": offer_id,
        "ts": datetime.utcnow().isoformat(),
        "assignments": count,
    })
    return {"ok": True, "assignments": count}


@router.get("/recommendations")
async def market_recommendations(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    prof = await db["me_profiles"].find_one({"user_id": user_id}) or {}
    country = (prof.get("country") or "").upper()
    skills = {s.lower() for s in prof.get("skills", [])}
    cur = db[COLL_OFFERS].find({"status": "live"})
    items = [Offer(**doc) async for doc in cur]
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
