from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class PublicProductItem(BaseModel):
    slug: str
    name: str
    href: str
    eyebrow: str
    summary: str
    bullets: List[str] = Field(default_factory=list)
    cta: str


class PublicProductListResponse(BaseModel):
    items: List[PublicProductItem]
