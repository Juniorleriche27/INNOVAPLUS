from __future__ import annotations

from typing import Any, List, Optional
from pydantic import BaseModel


class PageMeta(BaseModel):
    current_page: int
    last_page: int
    total: int


class Paginated(BaseModel):
    data: List[Any]
    current_page: int
    last_page: int
    total: int

