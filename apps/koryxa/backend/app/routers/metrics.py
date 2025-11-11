from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db

router = APIRouter(prefix="/metrics", tags=["metrics"])


class MetricEvent(BaseModel):
    name: str
    user_id: Optional[str] = None
    payload: Optional[dict] = None
    ts: Optional[str] = None


COLL_METRICS = "metrics_product"


@router.post("/event")
async def event(e: MetricEvent, db: AsyncIOMotorDatabase = Depends(get_db)):
    e.ts = e.ts or datetime.utcnow().isoformat()
    await db[COLL_METRICS].insert_one(e.dict())
    return {"ok": True}


@router.get("/funnel")
async def funnel(period: Optional[str] = "7d", db: AsyncIOMotorDatabase = Depends(get_db)):
    days = int(period.rstrip("d")) if period and period.endswith("d") else 7
    since = datetime.utcnow() - timedelta(days=days)
    cur = db[COLL_METRICS].find({"ts": {"$gte": since.isoformat()}})
    window = [MetricEvent(**doc) async for doc in cur]
    def c(name):
        return sum(1 for e in window if e.name == name)
    return {
        "period": period,
        "onboarding_finished": c("onboarding_finished"),
        "view_me_reco": c("view_me_reco"),
        "assignment": c("assignment"),
        "notif_click": c("notif_click"),
        "email_open": c("email_open"),
        "invite_sent": c("invite_sent"),
    }
