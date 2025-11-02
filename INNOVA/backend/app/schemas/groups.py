from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = True


class GroupOut(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    is_public: bool = True
    members_count: int = 0
    posts_count: int = 0

