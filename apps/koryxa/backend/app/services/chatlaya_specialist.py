from __future__ import annotations

import json
import logging
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any


logger = logging.getLogger(__name__)

CHATLAYA_MODE_GENERAL = "general"
CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL = "launch_structure_sell"
CHATLAYA_SUPPORTED_MODES = {
    CHATLAYA_MODE_GENERAL,
    CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL,
}

_STOPWORDS = {
    "a",
    "ai",
    "au",
    "aux",
    "avec",
    "ce",
    "ces",
    "cette",
    "comment",
    "dans",
    "de",
    "des",
    "du",
    "elle",
    "en",
    "et",
    "est",
    "for",
    "how",
    "il",
    "ils",
    "je",
    "la",
    "le",
    "les",
    "leur",
    "ma",
    "mais",
    "mes",
    "mon",
    "nous",
    "our",
    "ou",
    "par",
    "pas",
    "plus",
    "pour",
    "que",
    "qui",
    "sa",
    "ses",
    "son",
    "sur",
    "the",
    "their",
    "to",
    "ton",
    "tu",
    "un",
    "une",
    "vos",
    "votre",
    "vous",
    "what",
    "when",
    "where",
    "why",
}

_INTENT_RULES: tuple[dict[str, tuple[str, ...]], ...] = (
    {
        "name": ("launch",),
        "triggers": (
            "lancer",
            "lancement",
            "launch",
            "start",
            "starting",
            "startup",
            "venture",
            "entrepreneur",
            "entrepreneurship",
            "projet",
            "project",
            "business",
            "company",
            "societe",
            "entreprise",
        ),
        "expansions": (
            "start",
            "startup",
            "venture",
            "entrepreneur",
            "entrepreneurship",
            "business",
            "company",
            "idea",
            "opportunity",
            "market",
            "customer",
            "problem",
        ),
        "priority_phrases": (
            "business idea",
            "new venture",
            "startup team",
            "target market",
        ),
    },
    {
        "name": ("business_plan",),
        "triggers": (
            "business",
            "plan",
            "business plan",
            "plan d affaires",
            "plan d affaire",
            "financial",
            "finance",
            "budget",
            "projection",
            "operations",
            "strategy",
        ),
        "expansions": (
            "business",
            "plan",
            "financial",
            "finance",
            "budget",
            "marketing",
            "operations",
            "mission",
            "summary",
            "strategy",
            "revenue",
            "cost",
            "customer",
        ),
        "priority_phrases": (
            "business plan",
            "executive summary",
            "marketing plan",
            "mission statement",
        ),
    },
    {
        "name": ("offer",),
        "triggers": (
            "offre",
            "offer",
            "service",
            "product",
            "pricing",
            "package",
            "packaging",
            "positioning",
            "positionnement",
            "proposition",
            "valeur",
            "value",
            "solution",
        ),
        "expansions": (
            "offer",
            "service",
            "product",
            "pricing",
            "price",
            "value",
            "proposition",
            "solution",
            "customer",
            "market",
            "benefit",
            "mission",
        ),
        "priority_phrases": (
            "value proposition",
            "target market",
            "customer needs",
            "product line",
        ),
    },
    {
        "name": ("sell",),
        "triggers": (
            "vendre",
            "vente",
            "sell",
            "sales",
            "closing",
            "marketing",
            "client",
            "clients",
            "customer",
            "customers",
            "acquisition",
            "prospect",
            "prospects",
            "pitch",
            "argumentaire",
            "revenue",
        ),
        "expansions": (
            "sell",
            "sales",
            "marketing",
            "customer",
            "customers",
            "client",
            "market",
            "promotion",
            "pricing",
            "revenue",
            "value",
            "proposition",
            "brand",
        ),
        "priority_phrases": (
            "sales process",
            "sales strategy",
            "marketing plan",
            "target customer",
        ),
    },
)


def coerce_assistant_mode(value: str | None) -> str:
    raw = (value or "").strip().lower()
    if raw in CHATLAYA_SUPPORTED_MODES:
        return raw
    return CHATLAYA_MODE_GENERAL


def is_strict_assistant_mode(value: str | None) -> bool:
    return coerce_assistant_mode(value) == CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFD", value.lower().strip())
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    return " ".join(normalized.split())


def _tokenize(value: str | None) -> tuple[str, ...]:
    normalized = _normalize_text(value)
    if not normalized:
        return ()
    return tuple(
        token
        for token in normalized.split()
        if len(token) >= 3 and token not in _STOPWORDS
    )


def _build_query_phrases(tokens: tuple[str, ...]) -> tuple[str, ...]:
    phrases: list[str] = []
    for size in (3, 2):
        if len(tokens) < size:
            continue
        for index in range(0, len(tokens) - size + 1):
            phrases.append(" ".join(tokens[index : index + size]))
    return tuple(dict.fromkeys(phrases))


def _matches_rule(query_normalized: str, query_token_set: set[str], values: tuple[str, ...]) -> bool:
    for value in values:
        normalized_value = _normalize_text(value)
        if not normalized_value:
            continue
        if " " in normalized_value:
            if normalized_value in query_normalized:
                return True
            continue
        if normalized_value in query_token_set:
            return True
    return False


def _expand_query(query: str) -> tuple[set[str], tuple[str, ...], tuple[str, ...]]:
    query_normalized = _normalize_text(query)
    query_tokens = _tokenize(query)
    query_token_set = set(query_tokens)
    expansion_tokens: set[str] = set(query_token_set)
    expansion_phrases: list[str] = []
    matched_intents: list[str] = []

    for rule in _INTENT_RULES:
        if not _matches_rule(query_normalized, query_token_set, rule["triggers"]):
            continue
        matched_intents.extend(rule["name"])
        expansion_tokens.update(_tokenize(" ".join(rule["expansions"])))
        expansion_phrases.extend(rule["priority_phrases"])

    return expansion_tokens, tuple(dict.fromkeys(expansion_phrases)), tuple(dict.fromkeys(matched_intents))


def _chunks_path() -> Path:
    return Path(__file__).resolve().parents[5] / "chatlaya" / "prepared" / "supabase_chunks.jsonl"


@lru_cache(maxsize=1)
def _load_launch_structure_sell_chunks() -> tuple[dict[str, Any], ...]:
    path = _chunks_path()
    if not path.is_file():
        logger.warning("ChatLAYA specialist corpus not found: %s", path)
        return ()

    records: list[dict[str, Any]] = []
    try:
        with path.open("r", encoding="utf-8") as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line:
                    continue
                payload = json.loads(line)
                text = str(payload.get("text") or "").strip()
                if not text:
                    continue
                title = str(payload.get("title") or payload.get("document_id") or "").strip()
                tokens = _tokenize(f"{title} {text}")
                records.append(
                    {
                        "doc_id": payload.get("document_id") or payload.get("doc_id"),
                        "title": title,
                        "source_file": payload.get("source_file"),
                        "text": text,
                        "normalized_text": _normalize_text(text),
                        "title_source_normalized": _normalize_text(f"{title} {payload.get('source_file') or ''}"),
                        "token_set": set(tokens),
                        "title_source_token_set": set(_tokenize(f"{title} {payload.get('source_file') or ''}")),
                    }
                )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to load ChatLAYA specialist corpus: %s", exc)
        return ()

    return tuple(records)


def retrieve_specialist_chunks(
    query: str,
    assistant_mode: str,
    top_k: int = 3,
) -> list[dict[str, Any]]:
    if coerce_assistant_mode(assistant_mode) != CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL:
        return []

    chunks = _load_launch_structure_sell_chunks()
    if not chunks:
        return []

    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    query_token_set = set(query_tokens)
    query_phrases = _build_query_phrases(query_tokens)
    query_normalized = _normalize_text(query)
    expanded_query_token_set, priority_phrases, matched_intents = _expand_query(query)
    ranked: list[tuple[float, dict[str, Any]]] = []

    for chunk in chunks:
        original_overlap = query_token_set & chunk["token_set"]
        expanded_overlap = (expanded_query_token_set - query_token_set) & chunk["token_set"]
        overlap = original_overlap | expanded_overlap
        score = 0.0

        if original_overlap:
            score += len(original_overlap) * 6.0
            score += (len(original_overlap) / max(1, len(query_token_set))) * 11.0

        if expanded_overlap:
            score += len(expanded_overlap) * 2.5
            score += (len(expanded_overlap) / max(1, len(expanded_query_token_set))) * 5.0

        normalized_text = chunk["normalized_text"]
        if query_normalized and len(query_normalized.split()) >= 4 and query_normalized in normalized_text:
            score += 18.0

        if query_phrases:
            score += sum(4.5 for phrase in query_phrases if phrase in normalized_text)

        if priority_phrases:
            score += sum(4.0 for phrase in priority_phrases if phrase in normalized_text)

        title_source_normalized = chunk["title_source_normalized"]
        title_source_token_set = chunk["title_source_token_set"]
        title_original_overlap = query_token_set & title_source_token_set
        title_expanded_overlap = (expanded_query_token_set - query_token_set) & title_source_token_set
        if title_original_overlap:
            score += len(title_original_overlap) * 3.5
        if title_expanded_overlap:
            score += len(title_expanded_overlap) * 1.5
        if priority_phrases:
            score += sum(2.5 for phrase in priority_phrases if phrase in title_source_normalized)

        if matched_intents:
            for intent in matched_intents:
                if intent == "business_plan" and "business plan" in title_source_normalized:
                    score += 6.0
                elif intent == "offer" and "value proposition" in normalized_text:
                    score += 4.0
                elif intent == "sell" and ("sales" in normalized_text or "marketing" in normalized_text):
                    score += 4.0
                elif intent == "launch" and ("startup" in normalized_text or "new venture" in normalized_text):
                    score += 4.0

        if not score:
            continue

        ranked.append(
            (
                score,
                {
                    "doc_id": chunk.get("doc_id"),
                    "score": round(score, 4),
                    "text": chunk["text"],
                    "meta": {
                        "title": chunk.get("title"),
                        "source_file": chunk.get("source_file"),
                        "assistant_mode": CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL,
                    },
                },
            )
        )

    ranked.sort(key=lambda item: item[0], reverse=True)
    limit = max(1, min(top_k, 5))
    selected: list[dict[str, Any]] = []
    doc_counts: dict[str, int] = {}
    for _, item in ranked:
        doc_id = str(item.get("doc_id") or "")
        if doc_id and doc_counts.get(doc_id, 0) >= 2:
            continue
        selected.append(item)
        if doc_id:
            doc_counts[doc_id] = doc_counts.get(doc_id, 0) + 1
        if len(selected) >= limit:
            break
    return selected
