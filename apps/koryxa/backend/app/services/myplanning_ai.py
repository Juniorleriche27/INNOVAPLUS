from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Tuple
import os

from fastapi.concurrency import run_in_threadpool

from app.core.ai import FALLBACK_REPLY, generate_answer
from app.core.config import settings


logger = logging.getLogger(__name__)


def _json_default(obj: Any) -> str:
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


def _extract_json(raw: str) -> Any:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r"(\{.*\})", raw, re.DOTALL)
    if match:
        snippet = match.group(1)
        try:
            return json.loads(snippet)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON snippet from AI output.")
    return None


def _has_hour(text: str) -> bool:
    return bool(re.search(r"\b([01]?\d|2[0-3])h", text))


def _compute_priority(title: str, description: str | None) -> str:
    txt = f"{title} {description or ''}".lower()
    hour = _has_hour(txt)
    urgent_keywords = ["rendez", "rdv", "réunion", "formation", "cours", "examen", "entretien", "médec", "facture", "payer", "deadline"]
    important_keywords = ["projet", "koryxa", "travail", "réviser", "étude", "budget", "finance", "sport", "santé", "dormir", "préparer", "organisation"]
    if hour and any(k in txt for k in urgent_keywords):
        return "urgent_important"
    if hour:
        return "urgent_not_important"
    if any(k in txt for k in important_keywords):
        return "important_not_urgent"
    return "not_urgent_not_important"


def _compute_impact(title: str, description: str | None) -> bool:
    txt = f"{title} {description or ''}".lower()
    impact_keywords = [
        "projet",
        "koryxa",
        "travail",
        "réviser",
        "étude",
        "formation",
        "certification",
        "budget",
        "finance",
        "sport",
        "santé",
        "préparer",
        "objectif",
        "dlci",
        "d-clic",
    ]
    return any(k in txt for k in impact_keywords)


def _fallback_tasks(free_text: str) -> list[dict]:
    chunks = re.split(r"[\\.?!;\\n]+", free_text)
    tasks: list[dict] = []
    for chunk in chunks:
        title = " ".join(chunk.strip().split())
        if len(title) < 12:
            continue
        desc = None
        priority = _compute_priority(title, desc)
        impact = _compute_impact(title, desc)
        tasks.append(
            {
                "title": title[:260],
                "description": desc,
                "estimated_duration_minutes": None,
                "priority_eisenhower": priority,
                "high_impact": impact,
                "category": None,
                "due_datetime": None,
            }
        )
        if len(tasks) >= 8:
            break
    return tasks


async def _call_llama(prompt: str) -> str:
    # Try local SmolLM first when available, then fall back to configured provider, then echo
    provider_candidates = []
    enable_smollm = os.getenv("ENABLE_SMOLLM", "false").lower() == "true"
    if enable_smollm or settings.SMOLLM_MODEL_PATH:
        provider_candidates.extend(["smollm", "local"])
    provider_candidates.extend([settings.CHAT_PROVIDER, settings.LLM_PROVIDER, "echo"])

    seen = set()
    for provider in provider_candidates:
        if not provider:
            continue
        name = str(provider).lower()
        if name in seen:
            continue
        seen.add(name)
        try:
            response = await run_in_threadpool(generate_answer, prompt, name)
            if response and response != FALLBACK_REPLY:
                return response
        except Exception:
            logger.warning("LLM provider %s failed, trying next fallback", name, exc_info=True)
            continue
    return FALLBACK_REPLY


async def suggest_tasks_from_text(
    free_text: str,
    language: str | None,
    preferred_duration_block: int | None,
) -> List[Dict[str, Any]]:
    prompt = (
        "Tu es un assistant KORYXA qui structure une journée en tâches actionnables. "
        "Retourne UNIQUEMENT un JSON valide de la forme "
        "{\"tasks\":[{\"title\":str,\"description\":str,\"estimated_duration_minutes\":int,"
        "\"priority_eisenhower\":\"urgent_important|important_not_urgent|urgent_not_important|not_urgent_not_important\","
        "\"high_impact\":true|false,\"category\":str|optional,\"due_datetime\":ISO8601|optional}]}. "
        "Règles de priorité (Eisenhower) : "
        "Rendez-vous / cours / formation / santé / examen / réunion à heure fixe aujourd'hui ou deadline aujourd'hui -> urgent_important. "
        "Progrès long terme (études, projet stratégique, santé, finances, préparation du lendemain) sans heure stricte -> important_not_urgent. "
        "Petites urgences logistiques à heure fixe sans enjeu majeur -> urgent_not_important. "
        "Loisirs/distractions sans enjeu -> not_urgent_not_important. "
        "Impact élevé = true si la tâche contribue à un objectif prioritaire (études, projet, santé, finances) ou réduit un risque important. Sinon false. "
        "Ne crée pas plus de 8 tâches et n'invente pas d'informations non présentes."
    )
    payload: Dict[str, Any] = {"texte": free_text}
    if language:
        payload["langue"] = language
    if preferred_duration_block:
        payload["duree_bloc_minutes"] = preferred_duration_block
    prompt += f"\n\nContexte:\n{json.dumps(payload, ensure_ascii=False)}"
    raw = await _call_llama(prompt)
    if raw == FALLBACK_REPLY:
        return _fallback_tasks(free_text)[:8]
    data = _extract_json(raw) or {}
    tasks = data.get("tasks") if isinstance(data, dict) else None
    if not isinstance(tasks, list):
        logger.warning("AI suggest tasks returned unexpected payload: %s", raw)
        tasks = []
    cleaned: List[Dict[str, Any]] = []
    for item in tasks:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        if not title:
            continue
        description = (item.get("description") or "").strip() or None
        priority = item.get("priority_eisenhower") or _compute_priority(title, description)
        impact = item.get("high_impact")
        if impact is None:
            impact = _compute_impact(title, description)
        cleaned.append(
            {
                "title": title[:260],
                "description": description,
                "estimated_duration_minutes": item.get("estimated_duration_minutes"),
                "priority_eisenhower": priority,
                "high_impact": impact,
                "category": item.get("category"),
                "due_datetime": item.get("due_datetime"),
            }
        )
    return cleaned[:8]


def _build_task_snapshot(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    snapshot: List[Dict[str, Any]] = []
    for task in tasks:
        snapshot.append(
            {
                "id": str(task.get("_id") or task.get("id")),
                "title": task.get("title"),
                "priority_eisenhower": task.get("priority_eisenhower"),
                "high_impact": task.get("high_impact"),
                "estimated_duration_minutes": task.get("estimated_duration_minutes"),
                "due_datetime": task.get("due_datetime"),
                "start_datetime": task.get("start_datetime"),
                "energy_level": task.get("energy_level"),
            }
        )
    return snapshot


async def plan_day_with_llama(
    tasks: List[Dict[str, Any]],
    date_label: str | None,
    available_minutes: int | None,
) -> Tuple[List[str], List[Dict[str, str]]]:
    if not tasks:
        return [], []
    snapshot = _build_task_snapshot(tasks)
    context = json.dumps({"tasks": snapshot, "date": date_label, "available_minutes": available_minutes}, default=_json_default, ensure_ascii=False)
    prompt = (
        "Tu es un coach de productivité pour KORYXA. "
        "A partir de la liste JSON ci-dessous, construis le plan du jour. "
        "Sélectionne les tâches réellement faisables aujourd'hui, priorise selon urgence, impact et énergie, "
        "et retourne uniquement un JSON valide: "
        "{\"order\":[task_id...],\"focus\":[{\"task_id\":str,\"reason\":str}]} où la liste focus contient 3 à 5 tâches maximum."
        "\n\nDonnées:\n"
        f"{context}"
    )
    raw = await _call_llama(prompt)
    data = _extract_json(raw) or {}
    order = data.get("order") if isinstance(data, dict) else None
    focus = data.get("focus") if isinstance(data, dict) else None
    order_ids = [str(tid) for tid in order if isinstance(tid, (str, int))]
    focus_items: List[Dict[str, str]] = []
    if isinstance(focus, list):
        for item in focus:
            if not isinstance(item, dict):
                continue
            tid = item.get("task_id")
            if not tid:
                continue
            focus_items.append({"task_id": str(tid), "reason": str(item.get("reason") or "").strip() or None})
    return order_ids, focus_items[:5]


async def replan_with_time_limit(
    tasks: List[Dict[str, Any]],
    available_minutes: int,
) -> List[Dict[str, Any]]:
    if not tasks:
        return []
    snapshot = _build_task_snapshot(tasks)
    context = json.dumps(
        {"tasks": snapshot, "available_minutes": available_minutes},
        default=_json_default,
        ensure_ascii=False,
    )
    prompt = (
        "Planifie une séquence express compte tenu du temps restant. "
        "Priorise les tâches high_impact=true puis les plus urgentes. "
        "Retourne un JSON {\"recommendations\":[{\"task_id\":str,\"suggested_minutes\":int,\"reason\":str}]} "
        "avec un cumul inférieur ou égal au temps disponible."
        "\n\nDonnées:\n"
        f"{context}"
    )
    raw = await _call_llama(prompt)
    data = _extract_json(raw) or {}
    recs = data.get("recommendations") if isinstance(data, dict) else None
    results: List[Dict[str, Any]] = []
    if isinstance(recs, list):
        for item in recs:
            if not isinstance(item, dict):
                continue
            tid = item.get("task_id")
            if not tid:
                continue
            results.append(
                {
                    "task_id": str(tid),
                    "suggested_minutes": item.get("suggested_minutes"),
                    "reason": str(item.get("reason") or "").strip() or None,
                }
            )
    return results
