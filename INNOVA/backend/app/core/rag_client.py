from __future__ import annotations

import logging
from typing import Any, Dict, List

import httpx

from app.core.config import settings


logger = logging.getLogger(__name__)


def _build_rag_url() -> str | None:
    base = (settings.RAG_API_URL or "").strip()
    if not base:
        return None
    return base.rstrip("/") + "/query"


async def retrieve_rag_results(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Call the external RAG service and return the retrieved chunks."""
    endpoint = _build_rag_url()
    if not endpoint:
        logger.debug("RAG API URL not configured; skipping retrieval.")
        return []
    if not query.strip():
        return []

    payload = {
        "query": query.strip(),
        "top_k": max(1, min(top_k, 10)),
    }

    timeout = settings.RAG_API_TIMEOUT or 8.0
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("RAG query failed: %s", exc)
        return []

    results = data.get("results") if isinstance(data, dict) else None
    if not isinstance(results, list):
        logger.debug("Unexpected RAG response format: %s", data)
        return []
    cleaned: List[Dict[str, Any]] = []
    for item in results:
        if not isinstance(item, dict):
            continue
        text = (item.get("text") or "").strip()
        if not text:
            continue
        cleaned.append(
            {
                "doc_id": item.get("doc_id"),
                "score": item.get("score"),
                "text": text,
                "meta": item.get("meta") or {},
            }
        )
    return cleaned
