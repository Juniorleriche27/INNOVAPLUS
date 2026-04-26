from __future__ import annotations

from fastapi import Request


async def get_current_user_optional(request: Request) -> dict | None:
    # TODO(chatlaya-service): replace with core-backed auth/session validation after extraction.
    _ = request
    return None
