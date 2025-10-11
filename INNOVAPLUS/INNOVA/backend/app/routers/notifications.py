from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["notifications"])


class Notification(BaseModel):
    id: str
    user_id: str
    type: str  # new_opportunity | assignment_update | comment_reply
    payload: dict
    created_at: str
    read_at: Optional[str] = None


_notifs: List[Notification] = []


@router.get("")
async def list_notifications(user_id: str, unread_only: Optional[int] = 0):
    items = [n for n in _notifs if n.user_id == user_id]
    if unread_only:
        items = [n for n in items if not n.read_at]
    return items


@router.post("")
async def create_notification(n: Notification):
    _notifs.append(n)
    return {"ok": True}


@router.post("/read")
async def mark_read(user_id: str, ids: List[str]):
    now = datetime.utcnow().isoformat()
    for n in _notifs:
        if n.user_id == user_id and n.id in ids:
            n.read_at = now
    return {"ok": True}

