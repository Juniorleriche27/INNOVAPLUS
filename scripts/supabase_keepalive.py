#!/usr/bin/env python3
from __future__ import annotations

import os
import sys
import time

import psycopg2


def main() -> int:
    dsn = (os.environ.get("SUPABASE_DATABASE_URL") or os.environ.get("DATABASE_URL") or "").strip()
    if not dsn:
        print("error: SUPABASE_DATABASE_URL (or DATABASE_URL) is required", file=sys.stderr)
        return 2

    start = time.time()
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        with conn.cursor() as cur:
            # One cheap query is enough to wake the project.
            cur.execute("select now(), 1;")
            row = cur.fetchone()
        elapsed_ms = int((time.time() - start) * 1000)
        print(f"supabase_keepalive_ok elapsed_ms={elapsed_ms} server_time={row[0]}")
        return 0
    except Exception as exc:
        print(f"supabase_keepalive_failed error={exc.__class__.__name__}: {exc}", file=sys.stderr)
        return 1
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
