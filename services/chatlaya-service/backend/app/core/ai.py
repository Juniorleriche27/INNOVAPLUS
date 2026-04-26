from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional, Sequence


FALLBACK_REPLY = "Je rencontre un problème technique pour le moment. Merci de réessayer plus tard."


def embed_texts(texts: Sequence[str], dim: int | None = None) -> List[List[float]]:
    # TODO(chatlaya-service): replace this stub with the extracted embedding runtime.
    # This placeholder exists only so copied service modules remain self-contained before extraction.
    dimension = dim or 384
    return [[0.0 for _ in range(dimension)] for _ in texts]


def generate_answer(
    prompt: str,
    provider: str | None = None,
    model: str | None = None,
    timeout: int | None = None,
    max_new_tokens: int | None = None,
    history: Optional[List[dict[str, str]]] = None,
    context: str | None = None,
    rag_sources: Optional[List[Dict[str, Any]]] = None,
    on_token: Optional[Callable[[str], None]] = None,
) -> str:
    # TODO(chatlaya-service): wire the future ChatLAYA LLM runtime here.
    _ = (provider, model, timeout, max_new_tokens, history, context, rag_sources)
    if on_token:
        on_token(FALLBACK_REPLY)
    return FALLBACK_REPLY
