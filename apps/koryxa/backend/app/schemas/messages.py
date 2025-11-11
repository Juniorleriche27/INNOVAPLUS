from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class SendMessage(BaseModel):
    recipient_id: str
    body: str = Field(..., max_length=5000)


class MessageOut(BaseModel):
    id: str
    sender_id: str
    recipient_id: str
    body: str
    read_at: Optional[str] = None

