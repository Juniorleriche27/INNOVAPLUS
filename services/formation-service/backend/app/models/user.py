from dataclasses import dataclass
from typing import Optional

@dataclass
class Profile:
    id: str
    full_name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
