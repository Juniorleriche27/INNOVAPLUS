from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class PostCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    body: str
    group_id: Optional[str] = None


class PostOut(BaseModel):
    id: str
    user_id: str
    group_id: Optional[str] = None
    title: Optional[str] = None
    body: str
    author_name: Optional[str] = None
    group_name: Optional[str] = None


class CommentCreate(BaseModel):
    body: str = Field(..., max_length=5000)


class CommentOut(BaseModel):
    id: str
    user_id: str
    post_id: str
    body: str
    author_name: Optional[str] = None

