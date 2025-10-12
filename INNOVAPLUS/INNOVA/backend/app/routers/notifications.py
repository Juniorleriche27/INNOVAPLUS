from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


class Notification(BaseModel):
    id: str
    user_id: str
    type: str  # new_opportunity | assignment_update | comment_reply
    payload: dict
    created_at: str
    read_at: Optional[str] = None


COLL_NOTIFS = "notifications"


@router.get("")
async def list_notifications(user_id: str, unread_only: Optional[int] = 0, db: AsyncIOMotorDatabase = Depends(get_db)):
    q = {"user_id": user_id}
    if unread_only:
        q["read_at"] = {"$in": [None, ""]}
    cur = db[COLL_NOTIFS].find(q).sort("created_at", -1)
    return [Notification(**doc) async for doc in cur]


@router.post("")
async def create_notification(n: Notification, db: AsyncIOMotorDatabase = Depends(get_db)):
    await db[COLL_NOTIFS].insert_one(n.dict())
    return {"ok": True}


@router.post("/read")
async def mark_read(user_id: str, ids: List[str], db: AsyncIOMotorDatabase = Depends(get_db)):
    now = datetime.utcnow().isoformat()
    await db[COLL_NOTIFS].update_many({"user_id": user_id, "id": {"$in": ids}}, {"$set": {"read_at": now}})
    return {"ok": True}
