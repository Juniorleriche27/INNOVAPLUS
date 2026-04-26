from __future__ import annotations

import json
import logging
import os
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any

from psycopg2 import sql

from app.core.ai import embed_texts
from app.services.postgres_bootstrap import db_fetchall, db_fetchone, pg_pool_ready

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


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{float(value):.8f}" for value in values) + "]"


def _normalize_meta(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {}
    return {}


def _build_tsquery_expression(query: str) -> str:
    base_tokens = list(_tokenize(query))
    expanded_tokens, _, _ = _expand_query(query)
    ordered_tokens = list(dict.fromkeys([*base_tokens, *sorted(expanded_tokens)]))
    safe_tokens = [token for token in ordered_tokens if token and "'" not in token]
    if not safe_tokens:
        return ""
    return " | ".join(safe_tokens[:24])


def _pick_existing_column(columns: set[str], ordered_names: tuple[str, ...]) -> str | None:
    for name in ordered_names:
        if name in columns:
            return name
    return None


@lru_cache(maxsize=1)
def _has_match_rag_chunks_function() -> bool:
    if not pg_pool_ready():
        return False
    row = db_fetchone(
        """
        select to_regprocedure('app.match_rag_chunks(vector,integer,text)') is not null as exists;
        """
    )
    return bool(row and row.get("exists"))


def _retrieve_specialist_chunks_via_match_function(query: str, top_k: int) -> list[dict[str, Any]]:
    if not pg_pool_ready() or not _has_match_rag_chunks_function():
        return []

    text_query = query.strip()
    if not text_query:
        return []

    try:
        embedding = embed_texts([text_query])[0]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to embed ChatLAYA specialist query for app.match_rag_chunks: %s", exc)
        return []

    try:
        rows = db_fetchall(
            """
            select *
            from app.match_rag_chunks(%s::vector, %s, %s);
            """,
            (
                _vector_literal(embedding),
                max(1, min(int(top_k), 10)),
                "launch_structure_sell",
            ),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("app.match_rag_chunks query failed: %s", exc)
        return []

    results: list[dict[str, Any]] = []
    for row in rows:
        text = str(row.get("content") or "").strip()
        if not text:
            continue
        meta = _normalize_meta(row.get("metadata"))
        title = str(row.get("title") or meta.get("title") or row.get("document_id") or "").strip()
        source_file = str(
            row.get("source_file")
            or meta.get("source_file")
            or meta.get("source")
            or meta.get("path")
            or ""
        ).strip()
        results.append(
            {
                "doc_id": row.get("document_id") or meta.get("document_id") or meta.get("doc_id"),
                "score": round(float(row.get("score") or 0.0), 4),
                "text": text,
                "meta": {
                    "title": title,
                    "source_file": source_file,
                    "assistant_mode": CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL,
                    "retrieval_mode": "supabase_vector_function",
                },
            }
        )
    return results


@lru_cache(maxsize=1)
def _discover_specialist_vector_store() -> dict[str, str] | None:
    if not pg_pool_ready():
        return None

    schema_override = (os.environ.get("CHATLAYA_SPECIALIST_SCHEMA") or "").strip()
    table_override = (os.environ.get("CHATLAYA_SPECIALIST_TABLE") or "").strip()
    if schema_override and table_override:
        columns = db_fetchall(
            """
            select column_name
            from information_schema.columns
            where table_schema = %s and table_name = %s;
            """,
            (schema_override, table_override),
        )
        column_set = {str(row.get("column_name") or "") for row in columns}
        if "embedding" not in column_set:
            logger.warning(
                "ChatLAYA specialist table override %s.%s does not expose an embedding column",
                schema_override,
                table_override,
            )
            return None
        text_col = _pick_existing_column(column_set, ("content", "text", "chunk_text", "page_content", "body"))
        if not text_col:
            logger.warning(
                "ChatLAYA specialist table override %s.%s does not expose a usable text column",
                schema_override,
                table_override,
            )
            return None
        return {
            "schema": schema_override,
            "table": table_override,
            "embedding_col": "embedding",
            "text_col": text_col,
            "doc_id_col": _pick_existing_column(column_set, ("document_id", "doc_id", "id")) or "",
            "title_col": _pick_existing_column(column_set, ("title", "document_title", "name")) or "",
            "source_col": _pick_existing_column(column_set, ("source_file", "source_path", "file_path", "path", "source")) or "",
            "meta_col": _pick_existing_column(column_set, ("metadata", "meta")) or "",
            "filter_col": (os.environ.get("CHATLAYA_SPECIALIST_FILTER_COLUMN") or "").strip(),
            "filter_value": (os.environ.get("CHATLAYA_SPECIALIST_FILTER_VALUE") or "").strip(),
        }

    rows = db_fetchall(
        """
        select table_schema, table_name, column_name, udt_name
        from information_schema.columns
        where table_schema not in ('pg_catalog', 'information_schema')
        order by table_schema, table_name, ordinal_position;
        """
    )
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for row in rows:
        key = (str(row.get("table_schema") or ""), str(row.get("table_name") or ""))
        grouped.setdefault(key, []).append(row)

    best_score = -1
    best_cfg: dict[str, str] | None = None
    for (schema_name, table_name), table_rows in grouped.items():
        columns = {str(row.get("column_name") or "") for row in table_rows}
        vector_columns = {
            str(row.get("column_name") or "")
            for row in table_rows
            if str(row.get("udt_name") or "") == "vector"
        }
        embedding_col = "embedding" if "embedding" in vector_columns else ""
        if not embedding_col:
            continue

        text_col = _pick_existing_column(columns, ("content", "text", "chunk_text", "page_content", "body"))
        if not text_col:
            continue

        score = 0
        lowered_table = table_name.lower()
        lowered_schema = schema_name.lower()
        if "chatlaya" in lowered_table or "chatlaya" in lowered_schema:
            score += 80
        if "special" in lowered_table or "special" in lowered_schema:
            score += 50
        if "chunk" in lowered_table:
            score += 40
        if "rag" in lowered_table:
            score += 35
        if "vector" in lowered_table:
            score += 25
        if "document" in lowered_table:
            score += 15
        if "source_file" in columns:
            score += 10
        if "title" in columns:
            score += 8
        if "document_id" in columns or "doc_id" in columns:
            score += 8

        if score <= best_score:
            continue

        best_score = score
        best_cfg = {
            "schema": schema_name,
            "table": table_name,
            "embedding_col": embedding_col,
            "text_col": text_col,
            "doc_id_col": _pick_existing_column(columns, ("document_id", "doc_id", "id")) or "",
            "title_col": _pick_existing_column(columns, ("title", "document_title", "name")) or "",
            "source_col": _pick_existing_column(columns, ("source_file", "source_path", "file_path", "path", "source")) or "",
            "meta_col": _pick_existing_column(columns, ("metadata", "meta")) or "",
            "filter_col": "",
            "filter_value": "",
        }

    if best_cfg:
        logger.info(
            "ChatLAYA specialist vector store auto-discovered: %s.%s",
            best_cfg["schema"],
            best_cfg["table"],
        )
    else:
        logger.warning("No Supabase/Postgres vector store discovered for ChatLAYA specialist mode")
    return best_cfg


def _retrieve_specialist_chunks_from_pg(query: str, top_k: int) -> list[dict[str, Any]]:
    if not pg_pool_ready():
        return []

    cfg = _discover_specialist_vector_store()
    if not cfg:
        return []

    text_query = query.strip()
    if not text_query:
        return []

    try:
        embedding = embed_texts([text_query])[0]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to embed ChatLAYA specialist query for vector retrieval: %s", exc)
        return []

    select_doc_id = (
        sql.SQL("{}::text as doc_id").format(sql.Identifier(cfg["doc_id_col"]))
        if cfg.get("doc_id_col")
        else sql.SQL("null::text as doc_id")
    )
    select_title = (
        sql.SQL("{}::text as title").format(sql.Identifier(cfg["title_col"]))
        if cfg.get("title_col")
        else sql.SQL("null::text as title")
    )
    select_source = (
        sql.SQL("{}::text as source_file").format(sql.Identifier(cfg["source_col"]))
        if cfg.get("source_col")
        else sql.SQL("null::text as source_file")
    )
    select_meta = (
        sql.SQL("{} as meta").format(sql.Identifier(cfg["meta_col"]))
        if cfg.get("meta_col")
        else sql.SQL("null::jsonb as meta")
    )

    where_parts = [sql.SQL("coalesce({}::text, '') <> ''").format(sql.Identifier(cfg["text_col"]))]
    params: list[Any] = []
    filter_col = (cfg.get("filter_col") or "").strip()
    filter_value = (cfg.get("filter_value") or "").strip()
    if filter_col and filter_value:
        where_parts.append(sql.SQL("{}::text = %s").format(sql.Identifier(filter_col)))
        params.append(filter_value)

    query_sql = sql.SQL(
        """
        select
          {doc_id},
          {text_col}::text as text,
          {title},
          {source},
          {meta},
          1 - ({embedding_col} <=> %s::vector) as score
        from {table_schema}.{table_name}
        where {where_clause}
        order by {embedding_col} <=> %s::vector asc
        limit %s;
        """
    ).format(
        doc_id=select_doc_id,
        text_col=sql.Identifier(cfg["text_col"]),
        title=select_title,
        source=select_source,
        meta=select_meta,
        embedding_col=sql.Identifier(cfg["embedding_col"]),
        table_schema=sql.Identifier(cfg["schema"]),
        table_name=sql.Identifier(cfg["table"]),
        where_clause=sql.SQL(" and ").join(where_parts),
    )
    vector_literal = _vector_literal(embedding)
    params = [*params, vector_literal, vector_literal, max(1, min(int(top_k), 10))]

    try:
        rows = db_fetchall(query_sql, tuple(params))
    except Exception as exc:  # noqa: BLE001
        logger.warning("ChatLAYA specialist vector query failed: %s", exc)
        return []

    results: list[dict[str, Any]] = []
    for row in rows:
        text = str(row.get("text") or "").strip()
        if not text:
            continue
        meta = _normalize_meta(row.get("meta"))
        title = str(row.get("title") or meta.get("title") or row.get("doc_id") or "").strip()
        source_file = str(
            row.get("source_file")
            or meta.get("source_file")
            or meta.get("source")
            or meta.get("path")
            or ""
        ).strip()
        results.append(
            {
                "doc_id": row.get("doc_id") or meta.get("document_id") or meta.get("doc_id"),
                "score": round(float(row.get("score") or 0.0), 4),
                "text": text,
                "meta": {
                    "title": title,
                    "source_file": source_file,
                    "assistant_mode": CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL,
                    "retrieval_mode": "supabase_vector",
                },
            }
        )
    return results


def _retrieve_specialist_chunks_from_rag_tables(query: str, top_k: int) -> list[dict[str, Any]]:
    if not pg_pool_ready():
        return []

    tsquery = _build_tsquery_expression(query)
    if not tsquery:
        return []

    try:
        rows = db_fetchall(
            """
            with q as (
              select to_tsquery('simple', %s) as tsq
            )
            select
              d.id::text as doc_id,
              c.title,
              c.source_file,
              c.content as text,
              c.metadata as meta,
              ts_rank_cd(
                setweight(to_tsvector('simple', coalesce(c.title, '')), 'A') ||
                setweight(to_tsvector('simple', coalesce(c.source_file, '')), 'B') ||
                setweight(c.content_tsv, 'C'),
                q.tsq
              ) as score
            from app.rag_chunks c
            join app.rag_documents d on d.id = c.document_id
            cross join q
            where coalesce(d.metadata->>'corpus', '') = 'launch_structure_sell'
              and (
                setweight(to_tsvector('simple', coalesce(c.title, '')), 'A') ||
                setweight(to_tsvector('simple', coalesce(c.source_file, '')), 'B') ||
                setweight(c.content_tsv, 'C')
              ) @@ q.tsq
            order by score desc nulls last, c.chunk_index asc
            limit %s;
            """,
            (tsquery, max(1, min(int(top_k), 10))),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("ChatLAYA specialist RAG table query failed: %s", exc)
        return []

    results: list[dict[str, Any]] = []
    for row in rows:
        text = str(row.get("text") or "").strip()
        if not text:
            continue
        meta = _normalize_meta(row.get("meta"))
        title = str(row.get("title") or meta.get("title") or row.get("doc_id") or "").strip()
        source_file = str(
            row.get("source_file")
            or meta.get("source_file")
            or meta.get("source")
            or meta.get("path")
            or ""
        ).strip()
        results.append(
            {
                "doc_id": row.get("doc_id"),
                "score": round(float(row.get("score") or 0.0), 4),
                "text": text,
                "meta": {
                    "title": title,
                    "source_file": source_file,
                    "assistant_mode": CHATLAYA_MODE_LAUNCH_STRUCTURE_SELL,
                    "retrieval_mode": "supabase_rag_fts",
                },
            }
        )
    return results


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

    fn_results = _retrieve_specialist_chunks_via_match_function(query, top_k=top_k)
    if fn_results:
        return fn_results

    pg_results = _retrieve_specialist_chunks_from_pg(query, top_k=top_k)
    if pg_results:
        return pg_results

    rag_results = _retrieve_specialist_chunks_from_rag_tables(query, top_k=top_k)
    if rag_results:
        return rag_results

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
