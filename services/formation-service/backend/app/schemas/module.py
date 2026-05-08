from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ModuleResponse(BaseModel):
    id: str
    title: str
    description: str
    order_index: int
    duration: Optional[str]
    is_published: bool
    created_at: datetime
