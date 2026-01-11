from __future__ import annotations

import csv
import io
import json
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user


router = APIRouter(prefix="/school/data-analyst/module-1", tags=["school-data-analyst"])

COLL_SUBMISSIONS = "module1_submissions"
COLL_VALIDATIONS = "module1_notebook_validations"
COLL_QUIZ_SESSIONS = "module1_quiz_sessions"
COLL_QUIZ_ATTEMPTS = "module1_quiz_attempts"

LESSONS = ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"]
COUNTRIES = ["Togo", "Benin", "Ghana", "Senegal", "Nigeria"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _seeded_rng(seed: str) -> random.Random:
    return random.Random(abs(hash(seed)) % (2**32))


def _generate_dataset(seed: str) -> List[Dict[str, str | int | float]]:
    rng = _seeded_rng(seed)
    rows: List[Dict[str, str | int | float]] = []
    start_date = _now() - timedelta(days=30)
    for user_idx in range(1, 201):
        user_id = f"u{user_idx:03d}"
        country = rng.choice(COUNTRIES)
        enrolled_at = start_date + timedelta(days=rng.randint(0, 10))
        rows.append(
            {
                "user_id": user_id,
                "event_date": enrolled_at.date().isoformat(),
                "event_type": "enrolled",
                "module": "Module 1",
                "lesson": "",
                "country": country,
            }
        )
        completed_lessons = rng.randint(2, 5)
        for idx in range(completed_lessons):
            rows.append(
                {
                    "user_id": user_id,
                    "event_date": (enrolled_at + timedelta(days=idx + 1)).date().isoformat(),
                    "event_type": "lesson_completed",
                    "module": "Module 1",
                    "lesson": LESSONS[idx],
                    "country": country,
                }
            )
        if completed_lessons == 5 and rng.random() > 0.35:
            rows.append(
                {
                    "user_id": user_id,
                    "event_date": (enrolled_at + timedelta(days=6)).date().isoformat(),
                    "event_type": "module_completed",
                    "module": "Module 1",
                    "lesson": "",
                    "country": country,
                }
            )
    return rows


def _compute_kpis(rows: List[Dict[str, str | int | float]]) -> Dict[str, float | int]:
    enrolled_users = {r["user_id"] for r in rows if r["event_type"] == "enrolled"}
    completed_users = {r["user_id"] for r in rows if r["event_type"] == "module_completed"}
    lessons_completed = [r for r in rows if r["event_type"] == "lesson_completed"]
    lesson_count_by_user: Dict[str, int] = {}
    for row in lessons_completed:
        user_id = str(row["user_id"])
        lesson_count_by_user[user_id] = lesson_count_by_user.get(user_id, 0) + 1

    total_enrolled = len(enrolled_users)
    completed = len(completed_users)
    completion_rate = completed / total_enrolled if total_enrolled else 0.0
    avg_lessons = (
        sum(lesson_count_by_user.values()) / total_enrolled if total_enrolled else 0.0
    )

    recent_cutoff = (_now() - timedelta(days=7)).date().isoformat()
    active_users = {
        r["user_id"]
        for r in rows
        if r["event_date"] >= recent_cutoff and r["event_type"] != "enrolled"
    }

    return {
        "total_enrolled": total_enrolled,
        "completed_users": completed,
        "completion_rate": round(completion_rate, 4),
        "avg_lessons_completed": round(avg_lessons, 2),
        "active_users_7d": len(active_users),
    }


@router.get("/dataset")
async def get_dataset(seed: Optional[str] = None, format: Optional[str] = None):
    effective_seed = seed or "demo"
    rows = _generate_dataset(effective_seed)
    kpis = _compute_kpis(rows)
    if format == "json":
        return {
            "seed": effective_seed,
            "generated_at": _iso(_now()),
            "rows": rows,
            "kpis": kpis,
        }
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    headers = {
        "X-Koryxa-Seed": effective_seed,
        "X-Koryxa-Row-Count": str(len(rows)),
        "X-Koryxa-KPIs": json.dumps(kpis),
    }
    return Response(content=buffer.getvalue(), media_type="text/csv", headers=headers)


@router.get("/kpis")
async def get_kpis(seed: Optional[str] = None):
    effective_seed = seed or "demo"
    rows = _generate_dataset(effective_seed)
    return {
        "seed": effective_seed,
        "generated_at": _iso(_now()),
        "kpis": _compute_kpis(rows),
    }


@router.get("/status")
async def get_status(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    validation = await db[COLL_VALIDATIONS].find_one({"user_id": user_id})
    quiz_pass = await db[COLL_QUIZ_ATTEMPTS].find_one(
        {"user_id": user_id, "passed": True}, sort=[("created_at", -1)]
    )
    return {
        "notebooks_validated": bool(validation),
        "quiz_passed": bool(quiz_pass),
        "validation": validation,
    }


@router.post("/submit", response_model=dict, status_code=status.HTTP_201_CREATED)
async def submit_module1(
    seed: str = Form("demo"),
    kpi_results: UploadFile | None = File(None),
    kpi_dictionary: UploadFile | None = File(None),
    brief: UploadFile | None = File(None),
    project_link: Optional[str] = Form(None),
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if kpi_results is None or kpi_dictionary is None:
        raise HTTPException(status_code=422, detail="Fichiers KPI requis.")

    try:
        results_payload = json.loads((await kpi_results.read()).decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=422, detail="module1_kpi_results.json invalide.")

    effective_seed = results_payload.get("seed") or seed or "demo"
    rows = _generate_dataset(effective_seed)
    expected_kpis = _compute_kpis(rows)
    provided = results_payload.get("kpis") or {}

    def _match_number(key: str, tolerance: float = 0.02) -> bool:
        if key not in provided:
            return False
        try:
            expected = float(expected_kpis[key])
            actual = float(provided[key])
        except Exception:
            return False
        if expected == 0:
            return abs(actual) < tolerance
        return abs(actual - expected) / expected <= tolerance

    required_keys = ["total_enrolled", "completed_users", "completion_rate", "avg_lessons_completed"]
    match = all(_match_number(key) for key in required_keys)

    csv_content = (await kpi_dictionary.read()).decode("utf-8", errors="ignore")
    header = csv_content.splitlines()[0].lower() if csv_content else ""
    expected_cols = ["kpi", "definition", "formula", "granularity", "source"]
    has_columns = all(col in header for col in expected_cols)

    validation_ok = bool(match and has_columns)
    user_id = str(current.get("_id"))

    submission_doc = {
        "user_id": user_id,
        "seed": effective_seed,
        "project_link": project_link,
        "created_at": _iso(_now()),
        "validation_ok": validation_ok,
    }
    await db[COLL_SUBMISSIONS].insert_one(submission_doc)

    if validation_ok:
        await db[COLL_VALIDATIONS].update_one(
            {"user_id": user_id},
            {"$set": {"user_id": user_id, "seed": effective_seed, "kpis": expected_kpis, "validated_at": _iso(_now())}},
            upsert=True,
        )

    return {"ok": validation_ok, "expected_kpis": expected_kpis}


@router.get("/quiz")
async def get_quiz(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    validation = await db[COLL_VALIDATIONS].find_one({"user_id": user_id})
    if not validation:
        raise HTTPException(status_code=403, detail="Notebooks non valides.")

    kpis = validation.get("kpis") or {}
    completion_rate = round(float(kpis.get("completion_rate", 0.0)) * 100)
    total_enrolled = int(kpis.get("total_enrolled", 0))

    questions = [
        {
            "id": "q1",
            "prompt": "Un KPI est :",
            "options": [
                "Une mesure cle liee a un objectif",
                "Un tableau decoratif",
                "Un indicateur sans contexte",
            ],
            "answer_index": 0,
        },
        {
            "id": "q2",
            "prompt": "SMART signifie notamment :",
            "options": ["Specifique et Mesurable", "Simple et Mathematique", "Symbolique et Moderne"],
            "answer_index": 0,
        },
        {
            "id": "q3",
            "prompt": "Quel est le taux de completion du Module 1 (baseline) ?",
            "options": [f"{completion_rate}%", f"{completion_rate + 10}%", f"{max(completion_rate - 10, 0)}%"],
            "answer_index": 0,
        },
        {
            "id": "q4",
            "prompt": "Combien d'inscrits (baseline) dans le dataset ?",
            "options": [str(total_enrolled), str(total_enrolled + 20), str(max(total_enrolled - 20, 0))],
            "answer_index": 0,
        },
    ]

    # Add generic questions to reach 10
    while len(questions) < 10:
        idx = len(questions) + 1
        questions.append(
            {
                "id": f"q{idx}",
                "prompt": "Un objectif SMART doit etre :",
                "options": ["Mesurable", "Flou", "Subjectif"],
                "answer_index": 0,
            }
        )

    session = {
        "user_id": user_id,
        "created_at": _iso(_now()),
        "questions": questions,
    }
    await db[COLL_QUIZ_SESSIONS].delete_many({"user_id": user_id})
    await db[COLL_QUIZ_SESSIONS].insert_one(session)

    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


@router.post("/quiz/submit")
async def submit_quiz(
    payload: dict,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    session = await db[COLL_QUIZ_SESSIONS].find_one({"user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session de quiz introuvable.")

    answers = {item["question_id"]: item["answer_index"] for item in payload.get("answers", [])}
    questions = session.get("questions", [])
    total = len(questions)
    correct = 0
    for q in questions:
        if answers.get(q["id"]) == q["answer_index"]:
            correct += 1
    percent = int(round((correct / total) * 100)) if total else 0
    passed = percent >= 70
    attempt = {
        "user_id": user_id,
        "created_at": _iso(_now()),
        "score": correct,
        "percent": percent,
        "passed": passed,
    }
    await db[COLL_QUIZ_ATTEMPTS].insert_one(attempt)
    return {"score": correct, "percent": percent, "passed": passed}
