from __future__ import annotations

from datetime import datetime
from typing import Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/invite", tags=["invite"])


class InvitePayload(BaseModel):
    sender_id: str
    email: EmailStr


_quota: Dict[str, Dict[str, int]] = {}


@router.post("")
async def invite(body: InvitePayload):
    day = datetime.utcnow().strftime("%Y-%m-%d")
    q = _quota.setdefault(body.sender_id, {}).setdefault(day, 0)
    if q >= 10:
        raise HTTPException(status_code=429, detail="Daily invite limit reached")
    _quota[body.sender_id][day] = q + 1
    # TODO: send invite email
    return {"ok": True, "sent": True}

