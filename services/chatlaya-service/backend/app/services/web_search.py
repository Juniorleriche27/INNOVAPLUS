"""Web search for ChatLAYA Mode Fondateur — Tavily primary, Serper fallback."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_TAVILY_URL = "https://api.tavily.com/search"
_SERPER_URL = "https://google.serper.dev/search"
_TIMEOUT = 8.0


async def _search_tavily(query: str, max_results: int) -> list[dict[str, Any]]:
    if not settings.TAVILY_API_KEY:
        raise ValueError("TAVILY_API_KEY not configured")
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            _TAVILY_URL,
            json={
                "api_key": settings.TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "max_results": max_results,
                "include_answer": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return [
            {
                "title": r.get("title", "").strip(),
                "url": r.get("url", ""),
                "snippet": r.get("content", "").strip(),
            }
            for r in data.get("results", [])
            if r.get("content") or r.get("title")
        ]


async def _search_serper(query: str, max_results: int) -> list[dict[str, Any]]:
    if not settings.SERPER_API_KEY:
        raise ValueError("SERPER_API_KEY not configured")
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            _SERPER_URL,
            headers={"X-API-KEY": settings.SERPER_API_KEY, "Content-Type": "application/json"},
            json={"q": query, "num": max_results, "hl": "fr", "gl": "fr"},
        )
        resp.raise_for_status()
        data = resp.json()
        return [
            {
                "title": r.get("title", "").strip(),
                "url": r.get("link", ""),
                "snippet": r.get("snippet", "").strip(),
            }
            for r in data.get("organic", [])
            if r.get("snippet") or r.get("title")
        ]


async def search_web(query: str, max_results: int | None = None) -> list[dict[str, Any]]:
    """Try Tavily first, fall back to Serper. Returns [] if both fail or search is disabled."""
    if not settings.WEB_SEARCH_ENABLED:
        return []
    n = max_results or settings.WEB_SEARCH_MAX_RESULTS

    try:
        results = await _search_tavily(query, n)
        if results:
            logger.debug("Web search via Tavily: %d results for %r", len(results), query[:60])
            return results
        logger.debug("Tavily returned 0 results, trying Serper")
    except Exception as exc:
        logger.warning("Tavily search failed (%s), falling back to Serper", exc)

    try:
        results = await _search_serper(query, n)
        logger.debug("Web search via Serper: %d results for %r", len(results), query[:60])
        return results
    except Exception as exc:
        logger.warning("Serper search also failed: %s", exc)

    return []


def format_web_context(results: list[dict[str, Any]]) -> str:
    """Format search results as a compact block for LLM injection."""
    if not results:
        return ""
    lines = []
    for i, r in enumerate(results, 1):
        title = r.get("title", "")
        snippet = r.get("snippet", "")
        if snippet:
            line = f"{i}. {title} : {snippet}" if title else f"{i}. {snippet}"
            lines.append(line)
    return "\n".join(lines)
