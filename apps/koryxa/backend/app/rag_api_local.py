from __future__ import annotations

from functools import lru_cache
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.services.chatlaya_specialist import (
    CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL,
    _load_launch_structure_sell_chunks,
    _normalize_text,
    _tokenize,
    retrieve_specialist_chunks,
)


app = FastAPI(title="KORYXA Local RAG API", version="1.0.0")


class QueryRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=3, ge=1, le=10)


@lru_cache(maxsize=1)
def _get_corpus() -> tuple[dict[str, Any], ...]:
    return _load_launch_structure_sell_chunks()


def _rank_chunks(query: str, top_k: int) -> list[dict[str, Any]]:
    chunks = _get_corpus()
    query_tokens = set(_tokenize(query))
    query_normalized = _normalize_text(query)
    if not chunks or not query_tokens:
        return []

    scored: list[tuple[float, dict[str, Any]]] = []
    for chunk in chunks:
        token_set = set(chunk.get("token_set") or set())
        title_token_set = set(chunk.get("title_source_token_set") or set())
        overlap = query_tokens & token_set
        title_overlap = query_tokens & title_token_set
        score = 0.0
        if overlap:
            score += len(overlap) * 5.0
            score += len(overlap) / max(1, len(query_tokens)) * 8.0
        if title_overlap:
            score += len(title_overlap) * 2.0
        normalized_text = str(chunk.get("normalized_text") or "")
        if query_normalized and query_normalized in normalized_text:
            score += 12.0
        if not score:
            continue
        scored.append(
            (
                score,
                {
                    "doc_id": chunk.get("doc_id"),
                    "score": round(score, 4),
                    "text": chunk.get("text") or "",
                    "meta": {
                        "title": chunk.get("title"),
                        "source_file": chunk.get("source_file"),
                        "mode": "local_lexical",
                    },
                },
            )
        )

    scored.sort(key=lambda item: item[0], reverse=True)
    return [item for _, item in scored[: max(1, min(top_k, 10))]]


@app.get("/health")
def health() -> dict[str, Any]:
    corpus = _get_corpus()
    return {
        "status": "ok",
        "service": "koryxa-local-rag-api",
        "version": "1.0.0",
        "chunks_loaded": len(corpus),
    }


@app.post("/query")
def query(payload: QueryRequest) -> dict[str, Any]:
    results = retrieve_specialist_chunks(
        payload.query,
        assistant_mode=CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL,
        top_k=payload.top_k,
    )
    if not results:
        results = _rank_chunks(payload.query, payload.top_k)
    return {
        "results": results,
        "count": len(results),
    }
