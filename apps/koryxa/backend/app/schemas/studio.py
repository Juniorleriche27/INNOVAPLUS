from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class RoleType(str, Enum):
    client = "client"
    redacteur = "redacteur"
    apprenant = "apprenant"


class ContentBriefCreate(BaseModel):
    content_type: str
    title: Optional[str] = None
    context: str
    target_audience: str
    objective: str
    tone: str
    length_hint: Optional[str] = None


class ContentBrief(ContentBriefCreate):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class GeneratedContent(BaseModel):
    id: str = Field(alias="_id")
    brief_id: str
    user_id: str
    plan: List[str]
    body: str
    titles: List[str]
    keywords: List[str]
    created_at: datetime

    class Config:
        populate_by_name = True


class GeneratedContentCreate(BaseModel):
    brief_id: str


class Budget(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = None


class MissionStatus(str, Enum):
    ouverte = "ouverte"
    prise = "prise"
    en_cours = "en_cours"
    soumise = "soumise"
    validee = "validee"
    a_reviser = "a_reviser"
    annulee = "annulee"


class ContentMissionCreate(BaseModel):
    title: str
    description: str
    content_type: str
    target_audience: str
    objective: str
    tone: str
    budget: Optional[Budget] = None
    deadline: Optional[datetime] = None


class ContentMission(ContentMissionCreate):
    id: str = Field(alias="_id")
    client_id: str
    redacteur_id: Optional[str] = None
    status: MissionStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class DeliveryStatus(str, Enum):
    soumis = "soumis"
    accepte = "accepte"
    a_reviser = "a_reviser"


class MissionDeliveryCreate(BaseModel):
    mission_id: str
    content: str
    note: Optional[str] = None
    version: Optional[int] = None


class MissionDelivery(BaseModel):
    id: str = Field(alias="_id")
    mission_id: str
    redacteur_id: str
    version: int
    content: str
    note: Optional[str] = None
    status: DeliveryStatus
    created_at: datetime

    class Config:
        populate_by_name = True


class AcademyModuleCreate(BaseModel):
    title: str
    description: str
    order: int
    content: str


class AcademyModule(AcademyModuleCreate):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class ProgressStatus(str, Enum):
    non_commence = "non_commence"
    en_cours = "en_cours"
    termine = "termine"


class AcademyProgressUpdate(BaseModel):
    module_id: str
    status: ProgressStatus


class AcademyProgress(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    module_id: str
    status: ProgressStatus
    completed_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        populate_by_name = True
