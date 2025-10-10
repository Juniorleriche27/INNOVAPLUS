from __future__ import annotations

import hashlib
import os
import time
from typing import List, Sequence

from app.core.config import settings
import logging
logger = logging.getLogger(__name__)


def _hash_to_float32(seed: bytes) -> float:
    # Map 8 bytes to a float in [-1, 1]
    h = int.from_bytes(seed[:8], byteorder="big", signed=False)
    return (h % 2000000) / 1000000.0 - 1.0


_cohere_client = None


def _get_cohere_client():
    global _cohere_client
    if _cohere_client is None:
        try:
            import cohere

            if not settings.COHERE_API_KEY:
                raise RuntimeError("Missing COHERE_API_KEY")
            _cohere_client = cohere.Client(api_key=settings.COHERE_API_KEY)
        except Exception as e:
            logger.warning("Cohere client init failed: %s", e)
            _cohere_client = False
    return _cohere_client


def embed_texts(texts: Sequence[str], dim: int | None = None) -> List[List[float]]:
    client = None
    if (settings.LLM_PROVIDER or "").lower() == "cohere":
        client = _get_cohere_client()
    if client:
        try:
            model = settings.EMBED_MODEL or "embed-multilingual-v3.0"
            resp = client.embed(texts=list(texts), model=model, input_type="search_query")
            # Cohere SDK returns resp.embeddings
            return [list(map(float, v)) for v in resp.embeddings]
        except Exception as e:
            logger.warning("Cohere embed failed, falling back to stub: %s", e)
    # Fallback deterministic stub
    d = dim or settings.EMBED_DIM
    vectors: List[List[float]] = []
    for t in texts:
        base = hashlib.sha256(t.encode("utf-8")).digest()
        vec: List[float] = []
        chunk = base
        i = 0
        while len(vec) < d:
            if i % len(base) == 0:
                chunk = hashlib.sha256(chunk).digest()
            vec.append(_hash_to_float32(chunk[i % len(chunk):] + i.to_bytes(2, 'big')))
            i += 1
        vectors.append(vec)
    return vectors


def generate_answer(prompt: str, provider: str | None = None, model: str | None = None, timeout: int | None = None) -> str:
    prov = (provider or settings.LLM_PROVIDER or "").lower()
    if prov == "cohere":
        client = _get_cohere_client()
        if client:
            try:
                mdl = model or settings.LLM_MODEL or "command-r"
                resp = client.chat(model=mdl, message=prompt)
                # New SDK: resp.text contains the assistant reply
                return getattr(resp, "text", None) or str(resp)
            except Exception as e:
                logger.warning("Cohere chat failed, falling back to stub: %s", e)
    # Fallback stub
    return (
        "Réponse générée (stub).\n\n"
        "Contexte traité: " + (prompt[:500] + ("..." if len(prompt) > 500 else ""))
    )


def detect_embed_dim() -> int:
    """Best-effort detection of embedding dimension.
    - If a real provider is plugged later, this should call it once and
      return len(vector).
    - With the current stub, we infer from settings.EMBED_DIM.
    """
    try:
        # In a real setup, replace this by one provider call and measure len.
        v = embed_texts(["dimension_probe"], dim=None)[0]
        return len(v)
    except Exception as e:
        logger.warning("Failed to detect embed dim automatically: %s", e)
        return settings.EMBED_DIM
