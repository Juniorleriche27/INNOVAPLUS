from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CertificateResponse(BaseModel):
    id: str
    user_id: str
    issued_at: datetime
    certificate_url: Optional[str]
