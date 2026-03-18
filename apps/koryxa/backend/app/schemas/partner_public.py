from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field


PartnerType = Literal["organisme", "plateforme", "coach"]
PartnerStatus = Literal["draft", "review", "published", "archived"]


class PublicPartnerItem(BaseModel):
    slug: str
    type: PartnerType
    name: str
    headline: str
    summary: str
    domains: List[str] = Field(default_factory=list)
    levels: List[str] = Field(default_factory=list)
    formats: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    geographies: List[str] = Field(default_factory=list)
    remote: bool = True
    price_range: str | None = None
    rhythm_options: List[str] = Field(default_factory=list)
    proof_capabilities: List[str] = Field(default_factory=list)
    target_profiles: List[str] = Field(default_factory=list)
    external_url: str | None = None
    status: PartnerStatus


class PublicPartnerListResponse(BaseModel):
    items: List[PublicPartnerItem]
