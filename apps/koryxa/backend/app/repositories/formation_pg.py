from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from app.services.postgres_bootstrap import db_execute, db_fetchall, db_fetchone


def _json_load(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default
    return default


def _normalize_track(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["skills"] = _json_load(row.get("skills"), [])
    row["module_count"] = int(row.get("module_count") or 0)
    return row


def _normalize_resource(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["module_id"] = str(row.get("module_id") or "")
    return row


def _normalize_module(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["track_id"] = str(row.get("track_id") or "")
    row["skills"] = _json_load(row.get("skills"), [])
    row["lesson_count"] = int(row.get("lesson_count") or 0)
    row["resources"] = _json_load(row.get("resources"), [])
    return row


def _normalize_progress(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["module_id"] = str(row.get("module_id") or "")
    return row


def _normalize_certificate(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    row["id"] = str(row.get("id") or "")
    row["user_id"] = str(row.get("user_id") or "")
    row["track_id"] = str(row.get("track_id") or "")
    return row


def list_public_tracks() -> list[dict[str, Any]]:
    rows = db_fetchall(
        """
        select
          t.id::text as id,
          t.track_key,
          t.title,
          t.summary,
          t.description,
          t.domain,
          t.difficulty,
          t.estimated_duration,
          t.skills,
          count(m.id) filter (where m.is_published = true) as module_count,
          t.created_at,
          t.updated_at
        from app.formation_tracks t
        left join app.formation_modules m on m.track_id = t.id
        where t.is_published = true
        group by t.id
        order by t.created_at asc;
        """
    )
    return [_normalize_track(row) for row in rows if row]


def get_track_by_key(track_key: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select
          t.id::text as id,
          t.track_key,
          t.title,
          t.summary,
          t.description,
          t.domain,
          t.difficulty,
          t.estimated_duration,
          t.skills,
          count(m.id) filter (where m.is_published = true) as module_count,
          t.created_at,
          t.updated_at
        from app.formation_tracks t
        left join app.formation_modules m on m.track_id = t.id
        where t.track_key = %s and t.is_published = true
        group by t.id
        limit 1;
        """,
        (track_key,),
    )
    return _normalize_track(row)


def list_track_modules(track_key: str) -> list[dict[str, Any]]:
    rows = db_fetchall(
        """
        select
          m.id::text as id,
          m.track_id::text as track_id,
          t.track_key,
          m.module_key,
          m.title,
          m.description,
          m.order_index,
          m.duration,
          m.notebook_path,
          m.lesson_count,
          m.skills,
          m.is_published,
          m.created_at,
          m.updated_at
        from app.formation_modules m
        join app.formation_tracks t on t.id = m.track_id
        where t.track_key = %s
          and t.is_published = true
          and m.is_published = true
        order by m.order_index asc;
        """,
        (track_key,),
    )
    modules = [_normalize_module(row) for row in rows if row]
    module_ids = [module["id"] for module in modules]
    if not module_ids:
        return modules

    resource_rows = db_fetchall(
        """
        select
          id::text as id,
          module_id::text as module_id,
          title,
          url,
          resource_type,
          description,
          order_index,
          created_at
        from app.formation_module_resources
        where module_id::text = any(%s)
        order by order_index asc, created_at asc;
        """,
        (module_ids,),
    )
    resource_map: dict[str, list[dict[str, Any]]] = {}
    for row in resource_rows:
        resource = _normalize_resource(row)
        if not resource:
            continue
        resource_map.setdefault(resource["module_id"], []).append(resource)

    for module in modules:
        module["resources"] = resource_map.get(module["id"], [])
    return modules


def get_module_by_id(module_id: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select
          m.id::text as id,
          m.track_id::text as track_id,
          t.track_key,
          m.module_key,
          m.title,
          m.description,
          m.order_index,
          m.duration,
          m.notebook_path,
          m.lesson_count,
          m.skills,
          m.is_published,
          m.created_at,
          m.updated_at
        from app.formation_modules m
        join app.formation_tracks t on t.id = m.track_id
        where m.id = %s::uuid
          and t.is_published = true
          and m.is_published = true
        limit 1;
        """,
        (module_id,),
    )
    module = _normalize_module(row)
    if not module:
        return None
    resource_rows = db_fetchall(
        """
        select
          id::text as id,
          module_id::text as module_id,
          title,
          url,
          resource_type,
          description,
          order_index,
          created_at
        from app.formation_module_resources
        where module_id = %s::uuid
        order by order_index asc, created_at asc;
        """,
        (module_id,),
    )
    module["resources"] = [_normalize_resource(item) for item in resource_rows if item]
    return module


def list_user_progress(track_key: str, user_id: str) -> dict[str, Any] | None:
    track = get_track_by_key(track_key)
    if not track:
        return None
    module_rows = db_fetchall(
        """
        select
          m.id::text as module_id,
          m.module_key,
          coalesce(p.completed, false) as completed,
          p.completed_at
        from app.formation_modules m
        join app.formation_tracks t on t.id = m.track_id
        left join app.formation_progress p
          on p.module_id = m.id
         and p.user_id = %s::uuid
        where t.track_key = %s
          and t.is_published = true
          and m.is_published = true
        order by m.order_index asc;
        """,
        (user_id, track_key),
    )
    items = [_normalize_progress(row) for row in module_rows if row]
    total = len(items)
    completed = sum(1 for item in items if item and item.get("completed"))
    percentage = round((completed / total) * 100, 1) if total else 0.0
    return {
        "track_key": track_key,
        "total_modules": total,
        "completed_modules": completed,
        "percentage": percentage,
        "items": items,
    }


def upsert_user_progress(module_id: str, user_id: str, completed: bool, now: datetime) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        insert into app.formation_progress(
          user_id, track_id, module_id, completed, completed_at, created_at, updated_at
        )
        select
          %s::uuid,
          m.track_id,
          m.id,
          %s,
          %s,
          %s,
          %s
        from app.formation_modules m
        join app.formation_tracks t on t.id = m.track_id
        where m.id = %s::uuid and m.is_published = true and t.is_published = true
        on conflict (user_id, module_id) do update
        set completed = excluded.completed,
            completed_at = excluded.completed_at,
            updated_at = excluded.updated_at
        returning user_id::text as user_id, track_id::text as track_id, module_id::text as module_id, completed, completed_at;
        """,
        (user_id, completed, now if completed else None, now, now, module_id),
    )
    return row


def maybe_issue_certificate(track_key: str, user_id: str, now: datetime) -> None:
    progress = list_user_progress(track_key, user_id)
    track = get_track_by_key(track_key)
    if not progress or not track:
        return
    if progress["total_modules"] == 0 or progress["completed_modules"] != progress["total_modules"]:
        return
    db_execute(
        """
        insert into app.formation_certificates(track_id, user_id, issued_at)
        values (%s::uuid, %s::uuid, %s)
        on conflict (user_id, track_id) do nothing;
        """,
        (track["id"], user_id, now),
    )


def get_user_certificate(track_key: str, user_id: str) -> dict[str, Any] | None:
    row = db_fetchone(
        """
        select
          c.id::text as id,
          c.user_id::text as user_id,
          c.track_id::text as track_id,
          t.track_key,
          c.issued_at,
          c.certificate_url
        from app.formation_certificates c
        join app.formation_tracks t on t.id = c.track_id
        where c.user_id = %s::uuid
          and t.track_key = %s
        limit 1;
        """,
        (user_id, track_key),
    )
    return _normalize_certificate(row)
