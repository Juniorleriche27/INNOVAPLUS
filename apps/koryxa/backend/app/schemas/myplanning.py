from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


PriorityEisenhower = Literal[
    "urgent_important",
    "important_not_urgent",
    "urgent_not_important",
    "not_urgent_not_important",
]
KanbanState = Literal["todo", "in_progress", "done"]
MoSCoWOption = Literal["must", "should", "could", "wont"]
EnergyLevel = Literal["low", "medium", "high"]
TaskSource = Literal["manual", "ia"]
TaskContextType = Literal["personal", "professional", "learning"]


class TaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=260)
    description: Optional[str] = Field(default=None, max_length=4000)
    category: Optional[str] = Field(default=None, max_length=60)
    context_type: TaskContextType = "personal"
    context_id: Optional[str] = Field(default=None, max_length=80, description="Identifier du contexte (ex: certificate_id)")
    priority_eisenhower: PriorityEisenhower = "important_not_urgent"
    kanban_state: KanbanState = "todo"
    high_impact: bool = False
    estimated_duration_minutes: Optional[int] = Field(default=None, ge=5, le=2880)
    start_datetime: Optional[datetime] = None
    due_datetime: Optional[datetime] = None
    linked_goal: Optional[str] = Field(default=None, max_length=120)
    moscow: Optional[MoSCoWOption] = None
    status: Optional[str] = Field(default=None, max_length=60)
    energy_level: Optional[EnergyLevel] = None
    pomodoro_estimated: Optional[int] = Field(default=None, ge=0, le=96)
    pomodoro_done: Optional[int] = Field(default=None, ge=0, le=96)
    comments: Optional[str] = Field(default=None, max_length=2000)
    assignee_user_id: Optional[str] = Field(default=None, max_length=50)
    collaborator_ids: Optional[List[str]] = None
    source: TaskSource = "manual"
    completed_at: Optional[datetime] = None


class TaskCreatePayload(TaskBase):
    pass


class TaskUpdatePayload(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=260)
    description: Optional[str] = Field(default=None, max_length=4000)
    category: Optional[str] = Field(default=None, max_length=60)
    priority_eisenhower: Optional[PriorityEisenhower] = None
    kanban_state: Optional[KanbanState] = None
    high_impact: Optional[bool] = None
    estimated_duration_minutes: Optional[int] = Field(default=None, ge=5, le=2880)
    start_datetime: Optional[datetime] = None
    due_datetime: Optional[datetime] = None
    linked_goal: Optional[str] = Field(default=None, max_length=120)
    moscow: Optional[MoSCoWOption] = None
    status: Optional[str] = Field(default=None, max_length=60)
    energy_level: Optional[EnergyLevel] = None
    pomodoro_estimated: Optional[int] = Field(default=None, ge=0, le=96)
    pomodoro_done: Optional[int] = Field(default=None, ge=0, le=96)
    comments: Optional[str] = Field(default=None, max_length=2000)
    assignee_user_id: Optional[str] = Field(default=None, max_length=50)
    collaborator_ids: Optional[List[str]] = None
    source: Optional[TaskSource] = None
    completed_at: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: str
    user_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int = 0
    has_more: bool = False


class AiTaskDraft(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    priority_eisenhower: Optional[PriorityEisenhower] = None
    high_impact: Optional[bool] = None
    category: Optional[str] = None
    due_datetime: Optional[datetime] = None


class AiSuggestTasksRequest(BaseModel):
    free_text: str = Field(..., min_length=6, max_length=4000)
    language: Optional[str] = Field(default=None, max_length=8)
    preferred_duration_block: Optional[int] = Field(default=None, ge=10, le=240)


class AiSuggestTasksResponse(BaseModel):
    drafts: List[AiTaskDraft]
    used_fallback: bool = False


class AiPlanDayRequest(BaseModel):
    date: Optional[str] = Field(default=None, max_length=20)
    available_minutes: Optional[int] = Field(default=None, ge=30, le=1440)


class AiFocusItem(BaseModel):
    task_id: str
    reason: Optional[str] = None


class AiPlanDayResponse(BaseModel):
    order: List[str]
    focus: List[AiFocusItem]


class AiReplanRequest(BaseModel):
    available_minutes: int = Field(..., ge=15, le=600)
    task_ids: Optional[List[str]] = None


class AiReplanItem(BaseModel):
    task_id: str
    suggested_minutes: Optional[int] = None
    reason: Optional[str] = None


class AiReplanResponse(BaseModel):
    recommendations: List[AiReplanItem]


OnboardingIntent = Literal["study_learn", "work_deliver", "build_project", "organize_better"]
DailyTimeBudget = Literal["30_minutes", "1_hour", "2_hours", "plus_2_hours"]
ImpactLevel = Literal["élevé", "moyen"]


class OnboardingGeneratedTask(BaseModel):
    title: str = Field(..., min_length=2, max_length=160)
    estimated_time: int = Field(..., ge=10, le=240)
    impact_level: ImpactLevel


class OnboardingStateResponse(BaseModel):
    user_intent: Optional[OnboardingIntent] = None
    main_goal: Optional[str] = Field(default=None, max_length=120)
    daily_time_budget: Optional[DailyTimeBudget] = None
    onboarding_completed: bool = False
    generated_tasks: List[OnboardingGeneratedTask] = Field(default_factory=list)
    updated_at: Optional[datetime] = None


class OnboardingUpdatePayload(BaseModel):
    user_intent: Optional[OnboardingIntent] = None
    main_goal: Optional[str] = Field(default=None, max_length=120)
    daily_time_budget: Optional[DailyTimeBudget] = None
    generated_tasks: Optional[List[OnboardingGeneratedTask]] = Field(default=None, max_length=3)
    onboarding_completed: Optional[bool] = None


class OnboardingGeneratePayload(BaseModel):
    user_intent: OnboardingIntent
    main_goal: str = Field(..., min_length=2, max_length=120)
    daily_time_budget: DailyTimeBudget


class OnboardingGenerateResponse(BaseModel):
    generated_tasks: List[OnboardingGeneratedTask] = Field(default_factory=list, max_length=3)


class OnboardingCompletePayload(BaseModel):
    generated_tasks: List[OnboardingGeneratedTask] = Field(..., min_length=1, max_length=3)


class OnboardingCompleteResponse(BaseModel):
    created_tasks: List[TaskResponse] = Field(default_factory=list)
    onboarding_completed: bool = True


# --- Learning planning (KORYXA School) ---

class LearningPlanGenerateRequest(BaseModel):
    certificate_id: str = Field(..., min_length=6, max_length=64, description="KORYXA School certificate _id")
    start_date: Optional[str] = Field(default=None, max_length=20, description="ISO date YYYY-MM-DD (defaults to today)")
    available_minutes_per_day: int = Field(default=120, ge=30, le=720)
    overwrite_existing: bool = True


class LearningPlanGenerateResponse(BaseModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    context_id: str


class LearningTaskImportItem(BaseModel):
    title: str = Field(..., min_length=2, max_length=260)
    description: Optional[str] = Field(default=None, max_length=4000)
    due_datetime: Optional[datetime] = None
    estimated_duration_minutes: Optional[int] = Field(default=None, ge=5, le=2880)
    linked_goal: Optional[str] = Field(default=None, max_length=200)
    priority_eisenhower: Optional[PriorityEisenhower] = None
    high_impact: Optional[bool] = None
    category: Optional[str] = Field(default=None, max_length=60)


class LearningPlanImportRequest(BaseModel):
    context_id: str = Field(..., min_length=2, max_length=80, description="Identifiant du parcours/contexte (ex: data-analyst)")
    overwrite_existing: bool = True
    items: List[LearningTaskImportItem] = Field(default_factory=list, min_length=1, max_length=5000)
