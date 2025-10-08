from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db


router = APIRouter(prefix="/api", tags=["contact"])


@router.post("/contact")
async def send_contact(payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = {
        "name": payload.get("name"),
        "email": payload.get("email"),
        "subject": payload.get("subject"),
        "message": payload.get("message"),
    }
    await db["contacts"].insert_one(doc)
    return {"ok": True}

