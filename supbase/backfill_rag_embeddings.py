#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

import psycopg2
from dotenv import dotenv_values
from psycopg2.extras import execute_batch


REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "apps" / "koryxa" / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _load_env() -> None:
    for candidate in (
        Path("/etc/innovaplus/backend.env"),
        BACKEND_DIR / ".env",
        REPO_ROOT / ".env",
    ):
        if not candidate.is_file():
            continue
        for key, value in dotenv_values(candidate).items():
            if value is not None and key not in os.environ:
                os.environ[key] = str(value)


_load_env()

from app.core.ai import detect_embed_dim, embed_texts  # noqa: E402


def _database_url() -> str:
    dsn = (os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DATABASE_URL") or "").strip()
    if not dsn:
        raise RuntimeError("DATABASE_URL or SUPABASE_DATABASE_URL is required")
    return dsn


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{float(value):.8f}" for value in values) + "]"


def _embedding_dimension() -> int:
    explicit = (os.environ.get("CHATLAYA_EMBED_DIM") or "").strip()
    if explicit:
        return int(explicit)
    return int(detect_embed_dim())


def _fetch_chunks(
    conn: psycopg2.extensions.connection,
    *,
    corpus: str,
    batch_size: int,
    limit: int | None,
) -> list[tuple[str, str]]:
    sql = """
    select c.id::text as id, c.content
    from app.rag_chunks c
    join app.rag_documents d on d.id = c.document_id
    where c.embedding is null
      and coalesce(d.metadata->>'corpus', '') = %s
    order by c.created_at asc, c.chunk_index asc
    limit %s
    """
    effective_limit = min(limit, batch_size) if limit is not None else batch_size
    with conn.cursor() as cur:
        cur.execute(sql, (corpus, effective_limit))
        return [(str(row[0]), str(row[1] or "")) for row in cur.fetchall()]


def _update_embeddings(
    conn: psycopg2.extensions.connection,
    rows: list[tuple[str, list[float]]],
) -> None:
    payload = [(_vector_literal(vector), chunk_id) for chunk_id, vector in rows]
    with conn.cursor() as cur:
        execute_batch(
            cur,
            """
            update app.rag_chunks
            set embedding = %s::vector
            where id = %s::uuid
            """,
            payload,
            page_size=200,
        )


def _count_remaining(conn: psycopg2.extensions.connection, *, corpus: str) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            select count(*)
            from app.rag_chunks c
            join app.rag_documents d on d.id = c.document_id
            where c.embedding is null
              and coalesce(d.metadata->>'corpus', '') = %s
            """,
            (corpus,),
        )
        return int(cur.fetchone()[0])


def _validate_schema(conn: psycopg2.extensions.connection, *, expected_dim: int) -> None:
    with conn.cursor() as cur:
        cur.execute("select to_regclass('app.rag_chunks')::text;")
        if not cur.fetchone()[0]:
            raise RuntimeError("table app.rag_chunks is missing")
        cur.execute("select to_regprocedure('app.match_rag_chunks(vector,integer,text)')::text;")
        has_match_fn = cur.fetchone()[0]
        cur.execute(
            """
            select format_type(a.atttypid, a.atttypmod) as formatted_type
            from pg_attribute a
            where a.attrelid = 'app.rag_chunks'::regclass
              and a.attname = 'embedding'
              and not a.attisdropped
            """
        )
        row = cur.fetchone()
        if not row:
            raise RuntimeError("column app.rag_chunks.embedding is missing; replay supbase/schema.sql first")
        formatted_type = str(row[0] or "")
        match = None
        import re

        match = re.search(r"vector\((\d+)\)", formatted_type)
        actual_dim = int(match.group(1)) if match else None
        if actual_dim is not None and actual_dim != expected_dim:
            raise RuntimeError(
                f"embedding dimension mismatch: schema={actual_dim}, model={expected_dim}"
            )
        print(f"SCHEMA: rag_chunks.embedding dimension = {actual_dim or 'unknown'}")
        print(f"SCHEMA: match_rag_chunks present = {bool(has_match_fn)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill embeddings for app.rag_chunks")
    parser.add_argument("--corpus", default="launch_structure_sell")
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    dsn = _database_url()
    expected_dim = _embedding_dimension()
    print(f"CONFIG: corpus={args.corpus} batch_size={args.batch_size} dry_run={args.dry_run}")
    print(f"CONFIG: embedding_dim={expected_dim}")

    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    try:
        _validate_schema(conn, expected_dim=expected_dim)
        rows = _fetch_chunks(
            conn,
            corpus=args.corpus,
            batch_size=max(1, args.batch_size),
            limit=args.limit,
        )
        print(f"FETCH: selected={len(rows)} chunk(s)")
        if not rows:
            remaining = _count_remaining(conn, corpus=args.corpus)
            print(f"DONE: nothing to backfill, remaining={remaining}")
            conn.rollback()
            return 0

        contents = [content for _, content in rows]
        vectors = embed_texts(contents)
        if len(vectors) != len(rows):
            raise RuntimeError("embedding count mismatch")
        for vector in vectors:
            if len(vector) != expected_dim:
                raise RuntimeError(
                    f"generated embedding dimension mismatch: expected {expected_dim}, got {len(vector)}"
                )

        if args.dry_run:
            print("DRY_RUN: embeddings generated successfully; no update executed")
            conn.rollback()
            return 0

        _update_embeddings(
            conn,
            [(chunk_id, vector) for (chunk_id, _), vector in zip(rows, vectors, strict=True)],
        )
        conn.commit()
        remaining = _count_remaining(conn, corpus=args.corpus)
        print(f"UPDATE: committed={len(rows)} chunk(s)")
        print(f"REMAINING: {remaining}")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
