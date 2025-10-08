from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.messages import SendMessage, MessageOut
from app.utils.ids import serialize_id, to_object_id


router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("/with/{user_id}")
async def thread(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    me = str(current["_id"])
    other = str(to_object_id(user_id))
    msgs = []
    cursor = db["messages"].find({
        "$or": [
            {"sender_id": me, "recipient_id": other},
            {"sender_id": other, "recipient_id": me},
        ]
    }).sort("_id", 1)
    async for doc in cursor:
        msgs.append(serialize_id(doc))

    # mark as read messages from other to me
    await db["messages"].update_many({
        "sender_id": other,
        "recipient_id": me,
        "read_at": {"$in": [None, ""]},
    }, {"$set": {"read_at": datetime.now(timezone.utc).isoformat()}})

    return msgs


@router.post("/")
async def send(payload: SendMessage, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    # ensure recipient exists
    _ = await db["users"].find_one({"_id": to_object_id(payload.recipient_id)})
    if not _:
        raise HTTPException(status_code=422, detail="Destinataire introuvable")
    doc = {
        "sender_id": str(current["_id"]),
        "recipient_id": str(to_object_id(payload.recipient_id)),
        "body": payload.body,
        "read_at": None,
    }
    res = await db["messages"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return serialize_id(doc)


@router.get("/unread_count")
async def unread_count(db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    me = str(current["_id"])
    count = await db["messages"].count_documents({"recipient_id": me, "read_at": {"$in": [None, ""]}})
    return {"unread": count}

