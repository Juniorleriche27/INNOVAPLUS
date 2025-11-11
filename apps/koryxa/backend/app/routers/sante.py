from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.db.mongo import get_db_by_name


router = APIRouter(prefix="/sante", tags=["sante"])


@router.get("/health")
async def health(db: AsyncIOMotorDatabase = Depends(lambda: get_db_by_name(settings.DB_SANTE))):
    ok = False
    try:
        await (await db).command("ping")
        ok = True
    except Exception:
        ok = False
    return {"module": "sante", "status": "ok" if ok else "down", "db": settings.DB_SANTE, "mongo": ok}

