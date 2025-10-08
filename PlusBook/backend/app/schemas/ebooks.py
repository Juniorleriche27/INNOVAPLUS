from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class EbookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(default=0, ge=0)


class EbookOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    price: float = 0
    file_path: Optional[str] = None
    file_url: Optional[str] = None

