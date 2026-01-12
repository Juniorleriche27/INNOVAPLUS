from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter(prefix="/youtube", tags=["youtube"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/validate")
async def validate_youtube_video(videoId: str):
    if not videoId:
        raise HTTPException(status_code=422, detail="videoId is required")

    api_key = settings.YOUTUBE_API_KEY
    if not api_key:
        return {
            "ok": False,
            "reason": "api_key_missing",
            "checkedAt": _now_iso(),
        }

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "status,contentDetails",
        "id": videoId,
        "key": api_key,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)

    if resp.status_code != 200:
        return {
            "ok": False,
            "reason": "youtube_api_error",
            "status": resp.status_code,
            "checkedAt": _now_iso(),
        }

    payload: dict[str, Any] = resp.json()
    items = payload.get("items") or []
    if not items:
        return {
            "ok": False,
            "reason": "not_found",
            "checkedAt": _now_iso(),
        }

    status = items[0].get("status") or {}
    privacy = status.get("privacyStatus")
    embeddable = status.get("embeddable")

    ok = bool(privacy == "public" and embeddable is True)
    return {
        "ok": ok,
        "privacyStatus": privacy,
        "embeddable": embeddable,
        "checkedAt": _now_iso(),
    }
