from __future__ import annotations

from typing import Any


CHATLAYA_MODE_GENERAL = "general"
CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL = "launch_structure_sell"


def coerce_assistant_mode(value: str | None) -> str:
    if value == CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL:
        return CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL
    return CHATLAYA_MODE_GENERAL


def is_strict_assistant_mode(value: str | None) -> bool:
    return coerce_assistant_mode(value) == CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL


def retrieve_specialist_chunks(
    query: str,
    *,
    assistant_mode: str,
    top_k: int,
) -> list[dict[str, Any]]:
    # TODO(chatlaya-service): replace this stub with the extracted specialist retrieval logic.
    _ = (query, assistant_mode, top_k)
    return []
