from __future__ import annotations

import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db

router = APIRouter(prefix="/meet", tags=["meet"])


RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM_PUBLIC", "120") or 120)
_RL_BUCKET: Dict[Tuple[str, str], Tuple[int, float]] = {}


def rate_limiter(request: Request):
    if RATE_LIMIT_RPM <= 0:
        return
    ip = request.client.host if request.client else "anon"
    key = ("meet", ip)
    used, start = _RL_BUCKET.get(key, (0, time.time()))
    now = time.time()
    if now - start >= 60:
        used, start = 0, now
    used += 1
    _RL_BUCKET[key] = (used, start)
    if used > RATE_LIMIT_RPM:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")


class PostCreate(BaseModel):
    user_id: str
    text: str = Field(min_length=5, max_length=2000)
    tags: List[str] = []
    country: Optional[str] = None


class Post(BaseModel):
    id: str
    user_id: str
    text: str
    tags: List[str] = []
    country: Optional[str] = None
    created_at: str


COLL_MEET = "meet_posts"


def _new_id(prefix: str) -> str:
    return f"{prefix}_{int(time.time()*1000)}"


@router.post("/post", dependencies=[Depends(rate_limiter)])
async def create_post(body: PostCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Basic moderation: naive spam filter
    spam = ["http://", "https://", "buy now", "$$$"]
    text_l = body.text.lower()
    if sum(1 for s in spam if s in text_l) >= 2:
        raise HTTPException(status_code=400, detail="Spam detected")
    pid = _new_id("post")
    p = Post(id=pid, user_id=body.user_id, text=body.text, tags=body.tags, country=body.country, created_at=datetime.utcnow().isoformat())
    await db[COLL_MEET].insert_one(p.dict())
    return {"post_id": pid}


@router.get("/feed", dependencies=[Depends(rate_limiter)])
async def feed(country: Optional[str] = None, tags: Optional[str] = None, limit: int = 20, offset: int = 0, db: AsyncIOMotorDatabase = Depends(get_db)):
    q: Dict = {}
    if country:
        q["country"] = country.upper()
    cur = db[COLL_MEET].find(q).sort("created_at", -1).skip(offset).limit(limit)
    items = [Post(**doc) async for doc in cur]
    if tags:
        want = {t.strip().lower() for t in tags.split(",") if t.strip()}
        items = [x for x in items if want.intersection({t.lower() for t in x.tags})]
    total = await db[COLL_MEET].count_documents(q)
    return {"items": [x.dict() for x in items], "total": total}
