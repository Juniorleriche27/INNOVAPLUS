import os
from app.core.config import settings


def is_myplanning_only() -> bool:
    """Return True when PRODUCT_MODE env is set to 'myplanning' (case-insensitive)."""
    mode = os.getenv("PRODUCT_MODE", getattr(settings, "PRODUCT_MODE", "all") or "all")
    return mode.strip().lower() == "myplanning"
