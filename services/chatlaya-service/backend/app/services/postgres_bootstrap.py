from __future__ import annotations

from typing import Any


def db_execute(sql: str, params: tuple[Any, ...] | None = None) -> None:
    # TODO(chatlaya-service): replace with extracted Postgres access layer.
    _ = (sql, params)
    return None


def db_fetchone(sql: str, params: tuple[Any, ...] | None = None) -> dict[str, Any] | None:
    # TODO(chatlaya-service): replace with extracted Postgres access layer.
    _ = (sql, params)
    return None


def db_fetchall(sql: str, params: tuple[Any, ...] | None = None) -> list[dict[str, Any]]:
    # TODO(chatlaya-service): replace with extracted Postgres access layer.
    _ = (sql, params)
    return []
