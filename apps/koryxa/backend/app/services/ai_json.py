from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

from app.core.ai import generate_answer
from app.core.config import settings


logger = logging.getLogger(__name__)

_JSON_BLOCK_RE = re.compile(r"```json\s*(\{.*?\})\s*```", re.DOTALL | re.IGNORECASE)


def _extract_json_payload(text: str) -> dict[str, Any] | None:
    if not text:
        return None

    fenced = _JSON_BLOCK_RE.search(text)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            return None

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return None


async def generate_structured_json(prompt: str) -> dict[str, Any] | None:
    try:
        raw = await asyncio.to_thread(
            generate_answer,
            prompt,
            settings.CHAT_PROVIDER,
            settings.CHAT_MODEL,
            settings.LLM_TIMEOUT,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Structured AI generation failed before parsing: %s", exc)
        return None

    parsed = _extract_json_payload(raw)
    if parsed is None:
        logger.warning("Structured AI generation returned non-JSON payload.")
    return parsed
