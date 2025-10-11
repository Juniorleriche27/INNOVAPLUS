from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/metrics", tags=["metrics"])


class MetricEvent(BaseModel):
    name: str
    user_id: Optional[str] = None
    payload: Optional[dict] = None
    ts: Optional[str] = None


_events: List[MetricEvent] = []


@router.post("/event")
async def event(e: MetricEvent):
    e.ts = e.ts or datetime.utcnow().isoformat()
    _events.append(e)
    return {"ok": True}


@router.get("/funnel")
async def funnel(period: Optional[str] = "7d"):
    days = int(period.rstrip("d")) if period and period.endswith("d") else 7
    since = datetime.utcnow() - timedelta(days=days)
    window = [e for e in _events if e.ts and datetime.fromisoformat(e.ts) >= since]
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

