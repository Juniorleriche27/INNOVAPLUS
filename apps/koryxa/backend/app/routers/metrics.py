from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db
from app.core.config import is_production_env
from app.deps.auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])


class MetricEvent(BaseModel):
    name: str
    user_id: Optional[str] = None
    payload: Optional[dict] = None
    ts: Optional[str] = None


COLL_METRICS = "metrics_product"


def _require_metrics_read_access(request: Request, user: dict) -> None:
    roles = user.get("roles") or []
    if not isinstance(roles, list):
        roles = [str(roles)]
    if "admin" in roles or "dev" in roles:
        return
    if not is_production_env() and request.headers.get("X-Admin-Token"):
        return
    raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/event")
async def event(
    e: MetricEvent,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    e.ts = e.ts or datetime.utcnow().isoformat()
    payload = e.model_dump()
    if not payload.get("user_id"):
        payload["user_id"] = str(user.get("_id") or user.get("id") or "")
    await db[COLL_METRICS].insert_one(payload)
    return {"ok": True}


@router.get("/funnel")
async def funnel(
    request: Request,
    period: str = Query("7d", pattern=r"^[1-9][0-9]*d$"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    _require_metrics_read_access(request, user)
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
