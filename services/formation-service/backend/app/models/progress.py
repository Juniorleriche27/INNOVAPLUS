from dataclasses import dataclass
from typing import Optional

@dataclass
class Progress:
    id: str
    user_id: str
    module_id: str
    completed: bool
    completed_at: Optional[str] = None
