from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.db.mongo import get_db_by_name


router = APIRouter(prefix="/innova", tags=["innova"])


async def get_innova_db() -> AsyncIOMotorDatabase:
    async for db in get_db_by_name(settings.DB_INNOVA):
        return db
    raise RuntimeError("MongoDB dependency could not be resolved")


@router.get("/health")
async def health(db: AsyncIOMotorDatabase = Depends(get_innova_db)):
    ok = False
    try:
        await db.command("ping")
        ok = True
    except Exception:
        ok = False
    return {"module": "innova", "status": "ok" if ok else "down", "db": settings.DB_INNOVA, "mongo": ok}

