from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProgressUpdate(BaseModel):
    module_id: str
    completed: bool

class ProgressResponse(BaseModel):
    id: str
    user_id: str
    module_id: str
    completed: bool
    completed_at: Optional[datetime]

class CompletionResponse(BaseModel):
    percentage: float
