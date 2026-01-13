from __future__ import annotations

import csv
import io
import json
import random
import zipfile
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
COLL_THEME1_SUBMISSIONS = "module1_theme1_submissions"
COLL_THEME1_QUIZ_ATTEMPTS = "module1_theme1_quiz_attempts"
COLL_THEME5_SUBMISSIONS = "module1_theme5_submissions"
COLL_THEME5_QUIZ_ATTEMPTS = "module1_theme5_quiz_attempts"

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


def _parse_theme1_csv(text: str) -> Dict[str, object]:
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    required = {
        "name",
        "role",
        "type",
        "power",
        "interest",
        "expectation",
        "quadrant",
        "strategy",
        "priority_score",
    }
    if not rows:
        raise HTTPException(status_code=422, detail="CSV vide.")
    missing = required - set(rows[0].keys() or [])
    if missing:
        raise HTTPException(status_code=422, detail=f"Colonnes manquantes: {sorted(missing)}")
    if len(rows) < 10:
        raise HTTPException(status_code=422, detail="Au moins 10 lignes sont requises.")

    def _to_float(value: str) -> float:
        try:
            return float(str(value).strip())
        except Exception:
            return 0.0

    normalized = []
    for row in rows:
        item = {k: (v or "").strip() for k, v in row.items()}
        item["priority_score"] = _to_float(item.get("priority_score", "0"))
        normalized.append(item)

    keep_satisfied_count = sum(
        1
        for r in normalized
        if "keep satisfied" in (r.get("quadrant", "").lower())
    )
    top_row = max(normalized, key=lambda r: r.get("priority_score", 0.0))
    top_name = top_row.get("name") or "Inconnu"
    devops_row = next(
        (r for r in normalized if r.get("name", "").lower() in {"devops", "dev-ops"}), None
    )
    devops_strategy = devops_row.get("strategy") if devops_row else "Non defini"

    names = [r.get("name") or "Inconnu" for r in normalized]
    strategies = list({r.get("strategy") or "" for r in normalized if r.get("strategy")})

    return {
        "rows_count": len(normalized),
        "keep_satisfied_count": keep_satisfied_count,
        "top_name": top_name,
        "devops_strategy": devops_strategy,
        "names": names,
        "strategies": strategies,
    }


def _build_theme1_quiz(summary: Dict[str, object]) -> List[Dict[str, object]]:
    keep_count = int(summary.get("keep_satisfied_count", 0))
    top_name = str(summary.get("top_name", "Inconnu"))
    devops_strategy = str(summary.get("devops_strategy", "Non defini"))
    names = [n for n in summary.get("names", []) if isinstance(n, str)]
    strategies = [s for s in summary.get("strategies", []) if isinstance(s, str)]

    def _unique(items: List[str]) -> List[str]:
        seen = set()
        result = []
        for item in items:
            if item not in seen:
                seen.add(item)
                result.append(item)
        return result

    count_options = _unique([str(keep_count), str(max(0, keep_count - 1)), str(keep_count + 1), str(keep_count + 2)])
    name_options = _unique([top_name] + [n for n in names if n != top_name][:3])
    strategy_options = _unique([devops_strategy] + [s for s in strategies if s != devops_strategy][:3])

    return [
        {
            "id": "q1",
            "prompt": "Combien de stakeholders sont dans Keep satisfied ?",
            "options": count_options,
            "answer_index": count_options.index(str(keep_count)) if str(keep_count) in count_options else 0,
        },
        {
            "id": "q2",
            "prompt": "Quel acteur a le priority_score le plus eleve ?",
            "options": name_options,
            "answer_index": name_options.index(top_name) if top_name in name_options else 0,
        },
        {
            "id": "q3",
            "prompt": "Donne la strategie associee au quadrant du DevOps.",
            "options": strategy_options,
            "answer_index": strategy_options.index(devops_strategy) if devops_strategy in strategy_options else 0,
        },
    ]


def _zip_pick_members(names: List[str], required: List[str]) -> Dict[str, str]:
    lower_names = {n.lower(): n for n in names}
    mapping: Dict[str, str] = {}
    for req in required:
        req_lower = req.lower()
        if req_lower in lower_names:
            mapping[req] = lower_names[req_lower]
            continue
        # allow files nested in a folder inside the zip
        found = next((n for n in names if n.lower().endswith("/" + req_lower)), None)
        if found:
            mapping[req] = found
    return mapping


def _zip_read_file(z: zipfile.ZipFile, member: str, max_bytes: int = 2_000_000) -> bytes:
    data = z.read(member)
    if len(data) > max_bytes:
        raise HTTPException(status_code=422, detail=f"Fichier trop volumineux dans le ZIP: {member}")
    return data


def _count_csv_rows(text: str) -> int:
    reader = csv.DictReader(io.StringIO(text))
    return sum(1 for _ in reader)


def _parse_capstone_from_zip(zip_bytes: bytes) -> Dict[str, object]:
    required_files = [
        "capstone_brief.md",
        "theme2_baseline_metrics.json",
        "theme3_kpi_dictionary.csv",
        "theme4_analysis_plan.md",
        "theme4_data_requirements.csv",
        "theme4_acceptance_criteria.json",
        "capstone_checklist.json",
        "README.md",
    ]
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        members = z.namelist()
        picked = _zip_pick_members(members, required_files)
        missing = [f for f in required_files if f not in picked]
        if missing:
            return {"missing_files": missing, "passed": False, "checks": []}

        checklist_raw = _zip_read_file(z, picked["capstone_checklist.json"]).decode("utf-8", errors="ignore")
        try:
            checklist = json.loads(checklist_raw)
        except Exception:
            raise HTTPException(status_code=422, detail="capstone_checklist.json invalide.")

        passed = bool(checklist.get("passed"))
        checks = checklist.get("checks") if isinstance(checklist.get("checks"), list) else []

        baseline_raw = _zip_read_file(z, picked["theme2_baseline_metrics.json"]).decode("utf-8", errors="ignore")
        try:
            baseline = json.loads(baseline_raw)
        except Exception:
            baseline = {}

        acc_raw = _zip_read_file(z, picked["theme4_acceptance_criteria.json"]).decode("utf-8", errors="ignore")
        try:
            acceptance = json.loads(acc_raw)
        except Exception:
            acceptance = {}

        req_csv = _zip_read_file(z, picked["theme4_data_requirements.csv"]).decode("utf-8", errors="ignore")
        kpi_csv = _zip_read_file(z, picked["theme3_kpi_dictionary.csv"]).decode("utf-8", errors="ignore")

        completion = baseline.get("completion_rate")
        if completion is None:
            completion = baseline.get("completion_rate_m1")

        acceptance_criteria = acceptance.get("acceptance_criteria") if isinstance(acceptance.get("acceptance_criteria"), list) else []

        # KPI row count
        kpi_rows = _count_csv_rows(kpi_csv)
        req_rows = _count_csv_rows(req_csv)

        # brief check from checklist (if present)
        brief_ok = None
        for item in checks:
            if isinstance(item, dict) and str(item.get("check", "")).lower().startswith("brief word count"):
                brief_ok = bool(item.get("ok"))
                break

        return {
            "missing_files": [],
            "passed": passed,
            "checks": checks,
            "metrics": {
                "requirements_rows": req_rows,
                "acceptance_criteria_count": len(acceptance_criteria),
                "completion_rate": completion,
                "kpi_rows": kpi_rows,
                "brief_wordcount_ok": brief_ok,
            },
        }


def _build_theme5_quiz(metrics: Dict[str, object]) -> List[Dict[str, object]]:
    req_rows = int(metrics.get("requirements_rows") or 0)
    acc_count = int(metrics.get("acceptance_criteria_count") or 0)
    kpi_rows = int(metrics.get("kpi_rows") or 0)
    completion = metrics.get("completion_rate")
    try:
        completion_float = float(completion) if completion is not None else None
    except Exception:
        completion_float = None

    brief_ok = metrics.get("brief_wordcount_ok")
    brief_ok_str = "true" if brief_ok else "false"

    def _opts_int(value: int) -> List[str]:
        return list(dict.fromkeys([str(value), str(max(0, value - 1)), str(value + 1), str(value + 2)]))

    def _opts_bool(value: bool) -> List[str]:
        return ["true", "false"] if value else ["false", "true"]

    def _opts_float(value: float) -> List[str]:
        base = round(value, 4)
        return list(
            dict.fromkeys(
                [
                    f"{base}",
                    f"{round(max(base - 0.05, 0.0), 4)}",
                    f"{round(min(base + 0.05, 1.0), 4)}",
                    f"{round(min(base + 0.1, 1.0), 4)}",
                ]
            )
        )

    questions: List[Dict[str, object]] = [
        {
            "id": "q1",
            "prompt": "Combien de lignes contient theme4_data_requirements.csv ?",
            "options": _opts_int(req_rows),
            "answer_index": _opts_int(req_rows).index(str(req_rows)),
        },
        {
            "id": "q2",
            "prompt": "Combien de critères d’acceptation sont dans theme4_acceptance_criteria.json ?",
            "options": _opts_int(acc_count),
            "answer_index": _opts_int(acc_count).index(str(acc_count)),
        },
        {
            "id": "q3",
            "prompt": "Combien de KPI y a-t-il dans theme3_kpi_dictionary.csv ?",
            "options": _opts_int(kpi_rows),
            "answer_index": _opts_int(kpi_rows).index(str(kpi_rows)),
        },
        {
            "id": "q4",
            "prompt": "Le checklist final est-il passed (true/false) ?",
            "options": _opts_bool(True),
            "answer_index": 0,
        },
        {
            "id": "q5",
            "prompt": "Le brief respecte-t-il 500–800 mots (true/false) ?",
            "options": _opts_bool(brief_ok is True),
            "answer_index": 0 if brief_ok is True else 1,
        },
    ]

    if completion_float is not None:
        opts = _opts_float(completion_float)
        questions.insert(
            3,
            {
                "id": "q3b",
                "prompt": "Quelle est la valeur du baseline completion_rate (ou completion_rate_m1) ?",
                "options": opts,
                "answer_index": opts.index(f"{round(completion_float, 4)}") if f"{round(completion_float, 4)}" in opts else 0,
            },
        )

    while len(questions) < 10:
        idx = len(questions) + 1
        questions.append(
            {
                "id": f"q{idx}",
                "prompt": "Le Capstone Pack sert principalement à :",
                "options": [
                    "Verrouiller alignement, exécutabilité et validation",
                    "Ajouter plus de graphiques sans cadrage",
                    "Remplacer les KPI par des impressions",
                ],
                "answer_index": 0,
            }
        )

    return questions


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


@router.get("/theme-1/status")
async def theme1_status(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    submission = await db[COLL_THEME1_SUBMISSIONS].find_one({"user_id": user_id}, sort=[("created_at", -1)])
    return {
        "validated": bool(submission and submission.get("validated")),
        "rows_count": submission.get("rows_count") if submission else None,
    }


@router.post("/theme-1/submit")
async def theme1_submit(
    stakeholder_register: UploadFile | None = File(None),
    engagement_plan: UploadFile | None = File(None),
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if stakeholder_register is None or engagement_plan is None:
        raise HTTPException(status_code=422, detail="Les deux fichiers sont requis.")

    try:
        csv_text = (await stakeholder_register.read()).decode("utf-8")
    except Exception:
        raise HTTPException(status_code=422, detail="CSV invalide.")

    summary = _parse_theme1_csv(csv_text)
    user_id = str(current.get("_id"))

    doc = {
        "user_id": user_id,
        "created_at": _iso(_now()),
        "validated": True,
        "rows_count": summary.get("rows_count"),
        "summary": summary,
        "files": {
            "register": stakeholder_register.filename,
            "plan": engagement_plan.filename,
        },
    }
    await db[COLL_THEME1_SUBMISSIONS].insert_one(doc)
    return {"validated": True, "rows_count": summary.get("rows_count")}


@router.get("/theme-1/quiz")
async def theme1_quiz(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    submission = await db[COLL_THEME1_SUBMISSIONS].find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not submission or not submission.get("validated"):
        raise HTTPException(status_code=403, detail="Quiz verrouille. Soumets d'abord les preuves.")

    summary = submission.get("summary") or {}
    questions = _build_theme1_quiz(summary)
    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


@router.post("/theme-1/quiz/submit")
async def theme1_quiz_submit(
    payload: dict,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    submission = await db[COLL_THEME1_SUBMISSIONS].find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not submission or not submission.get("validated"):
        raise HTTPException(status_code=403, detail="Quiz verrouille. Soumets d'abord les preuves.")

    summary = submission.get("summary") or {}
    questions = _build_theme1_quiz(summary)
    answers = {item["question_id"]: item["answer_index"] for item in payload.get("answers", [])}
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
    await db[COLL_THEME1_QUIZ_ATTEMPTS].insert_one(attempt)
    return {"score": correct, "percent": percent, "passed": passed}


@router.get("/theme-5/status")
async def theme5_status(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    submission = await db[COLL_THEME5_SUBMISSIONS].find_one({"user_id": user_id}, sort=[("created_at", -1)])
    return {
        "validated": bool(submission and submission.get("validated")),
        "passed": submission.get("passed") if submission else None,
    }


@router.post("/theme-5/submit")
async def theme5_submit(
    capstone_zip: UploadFile | None = File(None),
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if capstone_zip is None:
        raise HTTPException(status_code=422, detail="Le fichier ZIP est requis.")

    try:
        zip_bytes = await capstone_zip.read()
    except Exception:
        raise HTTPException(status_code=422, detail="ZIP invalide.")

    try:
        parsed = _parse_capstone_from_zip(zip_bytes)
    except zipfile.BadZipFile:
        raise HTTPException(status_code=422, detail="ZIP invalide (archive corrompue).")

    missing_files = parsed.get("missing_files") if isinstance(parsed, dict) else []
    passed = bool(parsed.get("passed")) if isinstance(parsed, dict) else False
    checks = parsed.get("checks") if isinstance(parsed, dict) else []
    metrics = parsed.get("metrics") if isinstance(parsed, dict) else {}

    failed_checks = []
    if isinstance(checks, list):
        failed_checks = [
            {"check": str(c.get("check", "")), "detail": str(c.get("detail", ""))}
            for c in checks
            if isinstance(c, dict) and not bool(c.get("ok"))
        ]

    if isinstance(missing_files, list) and missing_files:
        failed_checks.insert(0, {"check": "ZIP contient tous les fichiers requis", "detail": f"missing={missing_files}"})

    validated = bool(passed and not (isinstance(missing_files, list) and missing_files))

    doc = {
        "user_id": str(current.get("_id")),
        "created_at": _iso(_now()),
        "validated": validated,
        "passed": passed,
        "missing_files": missing_files,
        "failed_checks": failed_checks,
        "metrics": metrics,
        "filename": capstone_zip.filename,
    }
    await db[COLL_THEME5_SUBMISSIONS].insert_one(doc)

    return {"validated": validated, "passed": passed, "failed_checks": failed_checks}


@router.get("/theme-5/quiz")
async def theme5_quiz(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    submission = await db[COLL_THEME5_SUBMISSIONS].find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not submission or not submission.get("validated"):
        raise HTTPException(status_code=403, detail="Quiz verrouille. Soumets d'abord le ZIP valide.")

    metrics = submission.get("metrics") or {}
    questions = _build_theme5_quiz(metrics)
    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


@router.post("/theme-5/quiz/submit")
async def theme5_quiz_submit(
    payload: dict,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    submission = await db[COLL_THEME5_SUBMISSIONS].find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not submission or not submission.get("validated"):
        raise HTTPException(status_code=403, detail="Quiz verrouille. Soumets d'abord le ZIP valide.")

    metrics = submission.get("metrics") or {}
    questions = _build_theme5_quiz(metrics)
    answers = {item["question_id"]: item["answer_index"] for item in payload.get("answers", [])}
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
    await db[COLL_THEME5_QUIZ_ATTEMPTS].insert_one(attempt)
    return {"score": correct, "percent": percent, "passed": passed}
