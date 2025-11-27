from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from app.core.security import get_user_id_anon
from app.db.mongo import get_db_instance


def _db():
    return get_db_instance()


async def log_ai_interaction(
    *,
    user_internal_id: str,
    product: str,
    model_id: str,
    provider: str,
    input_text: str,
    output_text: str,
    meta: Optional[Dict[str, Any]] = None,
    feedback: Optional[Dict[str, Any]] = None,
) -> None:
    doc = {
        "user_id_anon": get_user_id_anon(user_internal_id),
        "product": product,
        "model_id": model_id,
        "provider": provider,
        "ts": datetime.utcnow(),
        "input_text": input_text,
        "output_text": output_text,
        "meta": meta or {},
        "feedback": feedback or {},
    }
    await _db()["ai_interactions"].insert_one(doc)


async def log_social_message(
    *,
    user_internal_id: str,
    thread_id: str,
    text: str,
    language: str,
    tags: Optional[list[str]] = None,
    parent_message_id: Optional[str] = None,
    reactions: Optional[Dict[str, Any]] = None,
    is_accepted_answer: bool = False,
) -> None:
    doc = {
        "user_id_anon": get_user_id_anon(user_internal_id),
        "thread_id": thread_id,
        "parent_message_id": parent_message_id,
        "ts": datetime.utcnow(),
        "language": language,
        "text": text,
        "tags": tags or [],
        "reactions": reactions or {"likes": 0, "dislikes": 0, "helpful_votes": 0},
        "is_accepted_answer": bool(is_accepted_answer),
    }
    await _db()["social_messages"].insert_one(doc)


async def log_planning_event(
    *,
    user_internal_id: str,
    event_type: str,
    task_id: str,
    task_title: str,
    task_description: Optional[str],
    priority: Optional[str],
    category: Optional[str],
    status: Optional[str],
    due_datetime: Optional[datetime],
    completion_datetime: Optional[datetime] = None,
    ai_suggestion: Optional[Dict[str, Any]] = None,
    user_action: Optional[Dict[str, Any]] = None,
) -> None:
    doc = {
        "user_id_anon": get_user_id_anon(user_internal_id),
        "event_type": event_type,
        "ts": datetime.utcnow(),
        "task_id": task_id,
        "task_title": task_title,
        "task_description": task_description,
        "priority": priority,
        "category": category,
        "status": status,
        "due_datetime": due_datetime,
        "completion_datetime": completion_datetime,
        "ai_suggestion": ai_suggestion or {},
        "user_action": user_action or {},
    }
    await _db()["planning_events"].insert_one(doc)

