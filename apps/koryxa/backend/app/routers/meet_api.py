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
    author: Optional[str] = None


class Post(BaseModel):
    id: str
    user_id: str
    author: Optional[str] = None
    text: str
    tags: List[str] = []
    country: Optional[str] = None
    created_at: str


COLL_MEET = "meet_posts"
COLL_LIKES = "meet_likes"
COLL_COMMENTS = "meet_comments"


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
    p = Post(
        id=pid,
        user_id=body.user_id,
        author=body.author,
        text=body.text,
        tags=body.tags,
        country=body.country,
        created_at=datetime.utcnow().isoformat(),
    )
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
    # enrich with likes/comments counts
    response = []
    for x in items:
        likes = await db[COLL_LIKES].count_documents({"post_id": x.id})
        comments = await db[COLL_COMMENTS].count_documents({"post_id": x.id})
        d = x.dict()
        d["likes_count"] = likes
        d["comments_count"] = comments
        response.append(d)
    return {"items": response, "total": total}


class LikePayload(BaseModel):
    post_id: str
    user_id: str
    action: str = Field("like", regex="^(like|unlike)$")


@router.post("/like", dependencies=[Depends(rate_limiter)])
async def like_post(payload: LikePayload, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not await db[COLL_MEET].find_one({"id": payload.post_id}):
        raise HTTPException(status_code=404, detail="Post non trouvé")
    if payload.action == "like":
        await db[COLL_LIKES].update_one(
            {"post_id": payload.post_id, "user_id": payload.user_id},
            {"$set": {"post_id": payload.post_id, "user_id": payload.user_id, "ts": datetime.utcnow().isoformat()}},
            upsert=True,
        )
    else:
        await db[COLL_LIKES].delete_one({"post_id": payload.post_id, "user_id": payload.user_id})
    likes = await db[COLL_LIKES].count_documents({"post_id": payload.post_id})
    return {"ok": True, "likes": likes}


class CommentPayload(BaseModel):
    post_id: str
    user_id: str
    text: str = Field(min_length=1, max_length=1000)
    author: Optional[str] = None


@router.post("/comment", dependencies=[Depends(rate_limiter)])
async def comment_post(payload: CommentPayload, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not await db[COLL_MEET].find_one({"id": payload.post_id}):
        raise HTTPException(status_code=404, detail="Post non trouvé")
    cid = _new_id("c")
    doc = {
        "_id": cid,
        "post_id": payload.post_id,
        "user_id": payload.user_id,
        "author": payload.author,
        "text": payload.text,
        "created_at": datetime.utcnow().isoformat(),
    }
    await db[COLL_COMMENTS].insert_one(doc)
    count = await db[COLL_COMMENTS].count_documents({"post_id": payload.post_id})
    return {"ok": True, "comment_id": cid, "comments": count}


@router.get("/comments")
async def list_comments(post_id: str, limit: int = 30, db: AsyncIOMotorDatabase = Depends(get_db)):
    cur = (
        db[COLL_COMMENTS]
        .find({"post_id": post_id})
        .sort("created_at", -1)
        .limit(min(limit, 200))
    )
    items = []
    async for c in cur:
        items.append(
            {
                "comment_id": c.get("_id"),
                "post_id": c.get("post_id"),
                "user_id": c.get("user_id"),
                "author": c.get("author"),
                "text": c.get("text"),
                "created_at": c.get("created_at"),
            }
        )
    return {"items": items, "total": len(items)}
