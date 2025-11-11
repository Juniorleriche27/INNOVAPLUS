from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


class ConversationResponse(BaseModel):
    conversation_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    archived: bool = False


class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    page: int
    limit: int


class ChatMessagePayload(BaseModel):
    conversation_id: str
    message: str = Field(..., min_length=1, max_length=4000)


class ChatMessageItem(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class MessagesResponse(BaseModel):
    items: List[ChatMessageItem]
