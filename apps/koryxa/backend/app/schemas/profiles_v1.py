from __future__ import annotations

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class LearnerProfilePayload(BaseModel):
    level: Literal["beginner", "intermediate", "advanced"]
    main_goal: Literal["job", "upskill", "real_projects", "startup"]
    weekly_availability: Literal["<5h", "5-10h", "10-20h", ">20h"]
    languages: List[str] = Field(default_factory=list)


class MissionProfilePayload(BaseModel):
    mission_interest: bool
    mission_types: List[Literal["cleaning", "analysis", "dashboard", "modeling", "automation"]] = Field(default_factory=list)
    mission_availability: Literal["now", "1-3_months", "later"]
    portfolio_url: Optional[str] = None


class CompanyProfilePayload(BaseModel):
    organization_name: str = Field(..., min_length=2, max_length=160)
    country: str = Field(..., min_length=2, max_length=120)
    sector: str = Field(..., min_length=2, max_length=160)
    size: Literal["1-10", "10-50", "50+"]
    data_needs: List[Literal["reporting", "analysis", "automation", "ai_modeling"]] = Field(default_factory=list)
    commitment_to_post_missions: bool


class ProfileResponse(BaseModel):
    user_id: str
    account_type: Optional[Literal["learner", "company", "organization"]] = None
    country: Optional[str] = None
    learner: Optional[LearnerProfilePayload] = None
    mission: Optional[MissionProfilePayload] = None
    company: Optional[CompanyProfilePayload] = None
    skills_validated: List[str] = Field(default_factory=list)
    updated_at: Optional[str] = None
