from __future__ import annotations

from fastapi import APIRouter


# Minimal billing router so local/dev startup is not blocked when the payment
# implementation is not present in the repository snapshot.
router = APIRouter(tags=["billing"])
