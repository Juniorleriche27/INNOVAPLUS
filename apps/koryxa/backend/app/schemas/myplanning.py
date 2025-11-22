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


class TaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=260)
    description: Optional[str] = Field(default=None, max_length=4000)
    category: Optional[str] = Field(default=None, max_length=60)
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


class AiTaskDraft(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    priority_eisenhower: Optional[PriorityEisenhower] = None
    high_impact: Optional[bool] = None


class AiSuggestTasksRequest(BaseModel):
    free_text: str = Field(..., min_length=6, max_length=4000)
    language: Optional[str] = Field(default=None, max_length=8)
    preferred_duration_block: Optional[int] = Field(default=None, ge=10, le=240)


class AiSuggestTasksResponse(BaseModel):
    drafts: List[AiTaskDraft]


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
