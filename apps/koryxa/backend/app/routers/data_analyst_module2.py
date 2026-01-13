from __future__ import annotations

import csv
import io
import json
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user


router = APIRouter(prefix="/school/data-analyst/module-2", tags=["school-data-analyst"])

COLL_THEME2_SUBMISSIONS = "module2_theme2_submissions"
COLL_THEME2_QUIZ_ATTEMPTS = "module2_theme2_quiz_attempts"

COLL_THEME3_SUBMISSIONS = "module2_theme3_submissions"
COLL_THEME3_QUIZ_SESSIONS = "module2_theme3_quiz_sessions"
COLL_THEME3_QUIZ_ATTEMPTS = "module2_theme3_quiz_attempts"

EXPECTED_COLS = ["user_id", "event_time", "event_type", "theme", "country", "channel"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_mongo(doc: Optional[dict]) -> Optional[dict]:
    if not doc:
        return None
    out: Dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            out[key] = str(value)
        else:
            out[key] = value
    return out


def _user_id(user: dict) -> str:
    return str(user.get("_id"))


def _read_text(file: UploadFile, max_bytes: int = 2_000_000) -> str:
    data = file.file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Fichier trop volumineux: {file.filename}")
    try:
        return data.decode("utf-8")
    except Exception:
        return data.decode("latin-1", errors="replace")


def _count_csv_rows(text: str) -> int:
    reader = csv.DictReader(io.StringIO(text))
    return sum(1 for _ in reader)


def _sql_requirements(sql_text: str) -> List[str]:
    t = sql_text.lower()
    missing = []
    if "join" not in t:
        missing.append("JOIN")
    if "group by" not in t:
        missing.append("GROUP BY")
    if "having" not in t:
        missing.append("HAVING")
    if "with" not in t:
        missing.append("WITH (CTE)")
    return missing


def _read_csv_top_by_float(text: str, key: str, value_col: str) -> Optional[Dict[str, Any]]:
    reader = csv.DictReader(io.StringIO(text))
    best_key: Optional[str] = None
    best_value: Optional[float] = None
    for row in reader:
        raw_key = (row.get(key) or "").strip()
        raw_value = (row.get(value_col) or "").strip()
        if not raw_key:
            continue
        try:
            v = float(raw_value)
        except Exception:
            continue
        if best_value is None or v > best_value:
            best_key = raw_key
            best_value = v
    if best_key is None or best_value is None:
        return None
    return {"key": best_key, "value": best_value}


def _unique_options(correct: str, extras: List[str], max_n: int = 4) -> List[str]:
    seen = set()
    out: List[str] = []
    for item in [correct] + extras:
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
        if len(out) >= max_n:
            break
    return out


def _build_theme3_quiz(facts: dict) -> List[Dict[str, Any]]:
    rng = random.Random()
    rng.seed(str(facts.get("seed", "")) or "m2t3", version=2)

    events_rows = int(facts.get("events_rows", 0))
    q1_rows = int(facts.get("q1_rows", 0))
    q2_seconds = float(facts.get("q2_seconds", 0.0))
    top_country = str(facts.get("q2_top_country", "") or "Inconnu")
    best_segment = str(facts.get("q3_best_segment", "") or "Inconnu")

    def _near_int(n: int) -> List[str]:
        candidates = [str(n), str(max(n - 1, 0)), str(n + 1), str(n + 2)]
        rng.shuffle(candidates)
        return _unique_options(str(n), candidates, 4)

    def _near_seconds(s: float) -> List[str]:
        base = round(float(s), 4)
        candidates = [f"{base:.4f}", f"{max(base - 0.1, 0):.4f}", f"{base + 0.1:.4f}", f"{base + 0.25:.4f}"]
        rng.shuffle(candidates)
        return _unique_options(f"{base:.4f}", candidates, 4)

    q1_opts = _near_int(q1_rows)
    ev_opts = _near_int(events_rows)
    correct_sec = f"{round(q2_seconds, 4):.4f}"
    sec_opts = _near_seconds(q2_seconds)
    country_opts = _unique_options(top_country, ["Togo", "Benin", "Ghana", "Senegal"], 4)
    seg_opts = _unique_options(best_segment, ["opened_notebook_48h", "not_opened_48h"], 3)

    return [
        {
            "id": "q1",
            "prompt": "Combien de lignes dans l'export q1 (funnel par theme) ?",
            "options": q1_opts,
            "answer_index": q1_opts.index(str(q1_rows)) if str(q1_rows) in q1_opts else 0,
        },
        {
            "id": "q2",
            "prompt": "Ton notebook a chargé combien de lignes dans la table events ?",
            "options": ev_opts,
            "answer_index": ev_opts.index(str(events_rows)) if str(events_rows) in ev_opts else 0,
        },
        {
            "id": "q3",
            "prompt": "Combien de secondes pour exécuter q2 (completion par pays) selon le run report ?",
            "options": sec_opts,
            "answer_index": sec_opts.index(correct_sec) if correct_sec in sec_opts else 0,
        },
        {
            "id": "q4",
            "prompt": "Quel pays est top-1 en completion_rate dans q2 ?",
            "options": country_opts,
            "answer_index": country_opts.index(top_country) if top_country in country_opts else 0,
        },
        {
            "id": "q5",
            "prompt": "Quel segment a le meilleur completion_rate dans q3 ?",
            "options": seg_opts,
            "answer_index": seg_opts.index(best_segment) if best_segment in seg_opts else 0,
        },
        {
            "id": "q6",
            "prompt": "Quel mot-clé SQL permet de filtrer des groupes après un GROUP BY ?",
            "options": ["WHERE", "HAVING", "ORDER BY"],
            "answer_index": 1,
        },
    ]


def _validate_clean_csv(text: str) -> Dict[str, Any]:
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=422, detail="CSV vide.")
    cols = list(rows[0].keys() or [])
    missing = set(EXPECTED_COLS) - set(cols)
    extra = set(cols) - set(EXPECTED_COLS)
    if missing or extra:
        raise HTTPException(
            status_code=422,
            detail=f"Colonnes invalides. Missing={sorted(missing)} Extra={sorted(extra)}",
        )

    # Basic sanity: event_time should be present for a majority of rows (not strict parsing)
    non_empty_event_time = sum(1 for r in rows if (r.get("event_time") or "").strip())
    if non_empty_event_time < max(1, int(len(rows) * 0.5)):
        raise HTTPException(status_code=422, detail="event_time est vide pour trop de lignes.")

    return {"rows": len(rows), "cols": cols, "non_empty_event_time": non_empty_event_time}


def _validate_quality_json(text: str) -> Dict[str, Any]:
    try:
        obj = json.loads(text)
    except Exception:
        raise HTTPException(status_code=422, detail="quality_report.json invalide (JSON parse error).")
    checks = obj.get("checks")
    if not isinstance(checks, dict):
        raise HTTPException(status_code=422, detail="quality_report.json doit contenir un objet 'checks'.")
    if checks.get("has_expected_columns") is not True:
        raise HTTPException(status_code=422, detail="checks.has_expected_columns doit être true.")
    return {"checks": checks}


def _build_quiz_from_checks(checks: Dict[str, Any]) -> List[Dict[str, Any]]:
    def opt_numeric(correct: int) -> List[str]:
        a = [correct, max(0, correct - 1), correct + 1, correct + 2]
        seen = set()
        out = []
        for x in a:
            if x not in seen:
                seen.add(x)
                out.append(str(x))
        return out[:4]

    duplicate_rows = int(checks.get("duplicate_rows") or 0)
    has_expected = bool(checks.get("has_expected_columns"))
    event_time_min = str(checks.get("event_time_min") or "N/A")
    event_time_max = str(checks.get("event_time_max") or "N/A")
    top10 = checks.get("event_type_top10") if isinstance(checks.get("event_type_top10"), dict) else {}
    top_keys = list(top10.keys())[:2]
    example_event = top_keys[0] if top_keys else "enrolled"

    # Build questions; answers are computed server-side on submit.
    return [
        {
            "id": "q1",
            "prompt": "Combien de lignes dupliquées (duplicate_rows) dans ton rapport qualité ?",
            "options": opt_numeric(duplicate_rows),
        },
        {
            "id": "q2",
            "prompt": "has_expected_columns vaut quoi ?",
            "options": ["true", "false"],
        },
        {
            "id": "q3",
            "prompt": "Quelle est la valeur de event_time_min dans ton JSON ?",
            "options": [event_time_min, event_time_max, "N/A", "2020-01-01T00:00:00Z"],
        },
        {
            "id": "q4",
            "prompt": "Quelle est la valeur de event_time_max dans ton JSON ?",
            "options": [event_time_max, event_time_min, "N/A", "2030-01-01T00:00:00Z"],
        },
        {
            "id": "q5",
            "prompt": "Quelle valeur fait partie de event_type_top10 (top 10) ?",
            "options": [example_event, "payment_failed", "unknown_event", "video_played"],
        },
    ]


def _grade_quiz(questions: List[Dict[str, Any]], checks: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    answer_by_id = {a.get("question_id"): a.get("answer_index") for a in answers}
    total = len(questions)
    if total == 0:
        raise HTTPException(status_code=500, detail="Quiz vide.")

    duplicate_rows = int(checks.get("duplicate_rows") or 0)
    event_time_min = str(checks.get("event_time_min") or "N/A")
    event_time_max = str(checks.get("event_time_max") or "N/A")
    top10 = checks.get("event_type_top10") if isinstance(checks.get("event_type_top10"), dict) else {}
    top_keys = list(top10.keys())[:1]
    example_event = top_keys[0] if top_keys else "enrolled"

    correct_map: Dict[str, str] = {
        "q1": str(duplicate_rows),
        "q2": "true" if bool(checks.get("has_expected_columns")) else "false",
        "q3": event_time_min,
        "q4": event_time_max,
        "q5": example_event,
    }

    correct = 0
    for q in questions:
        qid = q.get("id")
        opts = q.get("options") or []
        idx = answer_by_id.get(qid)
        if not isinstance(idx, int) or idx < 0 or idx >= len(opts):
            continue
        expected_value = correct_map.get(str(qid))
        if expected_value is None:
            continue
        if str(opts[idx]) == str(expected_value):
            correct += 1

    percent = int(round((correct / total) * 100))
    return {"correct": correct, "total": total, "percent": percent, "passed": percent >= 70}


@router.get("/theme-2/status")
async def theme2_status(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME2_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    return {"validated": bool(sub), "submission": _serialize_mongo(sub)}


@router.post("/theme-2/submit")
async def theme2_submit(
    clean_csv: UploadFile = File(...),
    quality_report_json: UploadFile = File(...),
    data_dictionary_md: UploadFile = File(...),
    powerquery_m: UploadFile = File(...),
    refresh_notes_md: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    errors: List[str] = []

    try:
        csv_text = _read_text(clean_csv)
        csv_info = _validate_clean_csv(csv_text)
    except HTTPException as e:
        errors.append(str(e.detail))
        csv_info = {}

    try:
        json_text = _read_text(quality_report_json)
        q_info = _validate_quality_json(json_text)
    except HTTPException as e:
        errors.append(str(e.detail))
        q_info = {}

    dd_text = _read_text(data_dictionary_md, max_bytes=500_000).strip()
    if len(dd_text) < 20:
        errors.append("m2t2_data_dictionary.md est vide ou trop court.")

    m_text = _read_text(powerquery_m, max_bytes=500_000).strip()
    if len(m_text) < 30:
        errors.append("m2t2_powerquery.m est vide ou trop court.")

    notes_text = _read_text(refresh_notes_md, max_bytes=200_000).strip()
    if len(notes_text) < 20:
        errors.append("m2t2_refresh_notes.md est vide ou trop court.")

    validated = len(errors) == 0
    doc: Dict[str, Any] = {
        "created_at": _now(),
        "user_id": user_id,
        "validated": validated,
        "errors": errors,
        "csv_info": csv_info,
        "checks": (q_info.get("checks") if isinstance(q_info, dict) else None),
        "files": {
            "clean_csv": clean_csv.filename,
            "quality_report_json": quality_report_json.filename,
            "data_dictionary_md": data_dictionary_md.filename,
            "powerquery_m": powerquery_m.filename,
            "refresh_notes_md": refresh_notes_md.filename,
        },
    }
    await db[COLL_THEME2_SUBMISSIONS].insert_one(doc)

    if not validated:
        raise HTTPException(status_code=422, detail=" / ".join(errors))

    return {"ok": True, "validated": True}


@router.get("/theme-2/quiz")
async def theme2_quiz(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME2_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Soumission Thème 2 non validée.")
    checks = sub.get("checks") if isinstance(sub.get("checks"), dict) else {}
    questions = _build_quiz_from_checks(checks)
    return {"questions": questions}


@router.post("/theme-2/quiz/submit")
async def theme2_quiz_submit(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME2_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Soumission Thème 2 non validée.")

    checks = sub.get("checks") if isinstance(sub.get("checks"), dict) else {}
    questions = _build_quiz_from_checks(checks)
    answers = payload.get("answers") if isinstance(payload.get("answers"), list) else []

    result = _grade_quiz(questions=questions, checks=checks, answers=answers)
    await db[COLL_THEME2_QUIZ_ATTEMPTS].insert_one(
        {
            "created_at": _now(),
            "user_id": user_id,
            "percent": result["percent"],
            "passed": result["passed"],
            "answers": answers,
        }
    )
    return result


@router.get("/theme-3/status")
async def theme3_status(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME3_SUBMISSIONS].find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    return {
        "validated": bool(sub and sub.get("validated")),
        "last_submitted_at": sub.get("created_at") if sub else None,
    }


@router.post("/theme-3/submit")
async def theme3_submit(
    queries_sql: UploadFile | None = File(None),
    run_report: UploadFile | None = File(None),
    q1_csv: UploadFile | None = File(None),
    q2_csv: UploadFile | None = File(None),
    q3_csv: UploadFile | None = File(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    if queries_sql is None or run_report is None or q1_csv is None or q2_csv is None or q3_csv is None:
        raise HTTPException(status_code=422, detail="Tous les fichiers sont requis.")

    failed_checks: List[Dict[str, str]] = []
    sql_text = _read_text(queries_sql).strip()
    if not sql_text:
        failed_checks.append({"check": "m2t3_queries.sql non vide", "detail": "empty"})
    else:
        missing = _sql_requirements(sql_text)
        if missing:
            failed_checks.append({"check": "SQL contient JOIN/GROUP BY/HAVING/WITH", "detail": f"missing={missing}"})

    report_text = _read_text(run_report).strip()
    report_obj: Optional[dict] = None
    try:
        report_obj = json.loads(report_text) if report_text else None
    except Exception:
        report_obj = None
        failed_checks.append({"check": "m2t3_run_report.json valide", "detail": "invalid_json"})

    q1_text = _read_text(q1_csv)
    q2_text = _read_text(q2_csv)
    q3_text = _read_text(q3_csv)

    q1_rows_csv = _count_csv_rows(q1_text)
    q2_rows_csv = _count_csv_rows(q2_text)
    q3_rows_csv = _count_csv_rows(q3_text)
    if q1_rows_csv < 1:
        failed_checks.append({"check": "m2t3_q1_funnel_by_theme.csv non vide", "detail": "rows<1"})
    if q2_rows_csv < 1:
        failed_checks.append({"check": "m2t3_q2_completion_by_country.csv non vide", "detail": "rows<1"})
    if q3_rows_csv < 1:
        failed_checks.append({"check": "m2t3_q3_notebook48h_vs_validation.csv non vide", "detail": "rows<1"})

    facts: Dict[str, Any] = {"seed": user_id}
    if isinstance(report_obj, dict):
        tables_rows = report_obj.get("tables_rows")
        queries = report_obj.get("queries")
        if not isinstance(tables_rows, dict):
            failed_checks.append({"check": "run report contient tables_rows", "detail": "missing_tables_rows"})
        if not isinstance(queries, dict):
            failed_checks.append({"check": "run report contient queries", "detail": "missing_queries"})

        if isinstance(tables_rows, dict):
            required_tables = ["events", "profiles", "marketing", "support_tickets", "validations"]
            missing_tables = [t for t in required_tables if t not in tables_rows]
            if missing_tables:
                failed_checks.append({"check": "run report tables_rows complets", "detail": f"missing={missing_tables}"})
            else:
                facts["events_rows"] = int(tables_rows.get("events") or 0)

        if isinstance(queries, dict):
            required_queries = ["q1_funnel_by_theme", "q2_completion_by_country", "q3_notebook48h_vs_validation"]
            missing_queries = [q for q in required_queries if q not in queries]
            if missing_queries:
                failed_checks.append({"check": "run report queries complets", "detail": f"missing={missing_queries}"})
            else:
                q1_meta = queries.get("q1_funnel_by_theme") if isinstance(queries.get("q1_funnel_by_theme"), dict) else {}
                q2_meta = queries.get("q2_completion_by_country") if isinstance(queries.get("q2_completion_by_country"), dict) else {}
                facts["q1_rows"] = int((q1_meta or {}).get("rows") or 0)
                try:
                    facts["q2_seconds"] = float((q2_meta or {}).get("seconds") or 0.0)
                except Exception:
                    facts["q2_seconds"] = 0.0

    if "q1_rows" not in facts:
        facts["q1_rows"] = q1_rows_csv

    top_country = _read_csv_top_by_float(q2_text, key="country", value_col="completion_rate")
    if top_country:
        facts["q2_top_country"] = top_country["key"]
        facts["q2_top_completion_rate"] = top_country["value"]

    best_segment = _read_csv_top_by_float(q3_text, key="segment", value_col="completion_rate")
    if best_segment:
        facts["q3_best_segment"] = best_segment["key"]
        facts["q3_best_completion_rate"] = best_segment["value"]

    validated = len(failed_checks) == 0

    await db[COLL_THEME3_SUBMISSIONS].insert_one(
        {
            "created_at": _now(),
            "user_id": user_id,
            "validated": validated,
            "failed_checks": failed_checks,
            "facts": facts,
            "files": {
                "queries_sql": queries_sql.filename,
                "run_report": run_report.filename,
                "q1_csv": q1_csv.filename,
                "q2_csv": q2_csv.filename,
                "q3_csv": q3_csv.filename,
            },
        }
    )

    return {"validated": validated, "failed_checks": failed_checks}


@router.get("/theme-3/quiz")
async def theme3_quiz(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME3_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Quiz verrouille. Soumets d'abord des livrables valides.")

    facts = sub.get("facts") if isinstance(sub.get("facts"), dict) else {}
    questions = _build_theme3_quiz(facts)

    await db[COLL_THEME3_QUIZ_SESSIONS].delete_many({"user_id": user_id})
    await db[COLL_THEME3_QUIZ_SESSIONS].insert_one(
        {
            "created_at": _now(),
            "user_id": user_id,
            "questions": questions,
        }
    )

    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


@router.post("/theme-3/quiz/submit")
async def theme3_quiz_submit(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    session = await db[COLL_THEME3_QUIZ_SESSIONS].find_one({"user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session de quiz introuvable.")

    questions = session.get("questions", [])
    answers = payload.get("answers") if isinstance(payload.get("answers"), list) else []

    answers_map = {a.get("question_id"): a.get("answer_index") for a in answers if isinstance(a, dict)}

    total = len(questions)
    correct = 0
    for q in questions:
        if answers_map.get(q.get("id")) == q.get("answer_index"):
            correct += 1
    percent = int(round((correct / total) * 100)) if total else 0
    passed = percent >= 70

    await db[COLL_THEME3_QUIZ_ATTEMPTS].insert_one(
        {
            "created_at": _now(),
            "user_id": user_id,
            "percent": percent,
            "passed": passed,
            "answers": answers,
        }
    )
    return {"score": correct, "percent": percent, "passed": passed}
