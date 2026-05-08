from dataclasses import dataclass
from typing import Optional

@dataclass
class Module:
    id: str
    title: str
    description: str
    order_index: int
    duration: Optional[str]
    is_published: bool
