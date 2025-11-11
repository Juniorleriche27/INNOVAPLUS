from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.utils.ids import serialize_id


router = APIRouter(prefix="/api/diag", tags=["diagnostics"])


@router.post("/seed")
async def seed(db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = {
        "kind": "seed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db["diagnostics"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return serialize_id(doc)


@router.get("/count")
async def count(db: AsyncIOMotorDatabase = Depends(get_db)):
    total = await db["diagnostics"].count_documents({})
    return {"collection": "diagnostics", "count": total}


@router.get("/collections")
async def collections(db: AsyncIOMotorDatabase = Depends(get_db)):
    names = await db.list_collection_names()
    return {"db": db.name, "collections": sorted(names)}

