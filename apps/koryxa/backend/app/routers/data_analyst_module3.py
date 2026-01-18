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


router = APIRouter(prefix="/school/data-analyst/module-3", tags=["school-data-analyst"])

COLL_THEME1_SUBMISSIONS = "module3_theme1_submissions"
COLL_THEME1_QUIZ_ATTEMPTS = "module3_theme1_quiz_attempts"

COLL_THEME2_SUBMISSIONS = "module3_theme2_submissions"
COLL_THEME2_QUIZ_ATTEMPTS = "module3_theme2_quiz_attempts"

REQUIRED_CHECKS = ["user_id_unique", "age_reasonable", "dates_parsable"]
REQUIRED_MISSING_COLS = [
    "missing_country",
    "missing_channel",
    "missing_age",
    "missing_signup_date",
    "missing_last_active",
    "missing_revenue",
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


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


def _csv_fieldnames(text: str) -> List[str]:
    reader = csv.reader(io.StringIO(text))
    try:
        header = next(reader)
    except StopIteration:
        return []
    return [str(h).strip() for h in header if str(h).strip()]


def _count_csv_rows(text: str) -> int:
    reader = csv.DictReader(io.StringIO(text))
    return sum(1 for _ in reader)


def _top_country(text: str) -> Optional[str]:
    reader = csv.DictReader(io.StringIO(text))
    counts: Dict[str, int] = {}
    for row in reader:
        c = (row.get("country") or "").strip()
        if not c:
            continue
        counts[c] = counts.get(c, 0) + 1
    if not counts:
        return None
    return max(counts.items(), key=lambda kv: kv[1])[0]


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


def _read_csv_dicts(text: str) -> List[Dict[str, str]]:
    reader = csv.DictReader(io.StringIO(text))
    return [dict(r) for r in reader]


def _near_percent(val: float) -> List[str]:
    base = round(float(val), 2)
    candidates = [
        f"{base:.2f}%",
        f"{max(base - 1.0, 0.0):.2f}%",
        f"{base + 1.0:.2f}%",
        f"{min(base + 3.0, 100.0):.2f}%",
    ]
    rng = random.Random()
    rng.seed(str(base), version=2)
    rng.shuffle(candidates)
    return _unique_options(f"{base:.2f}%", candidates, 4)


def _build_theme1_quiz(facts: dict) -> List[Dict[str, Any]]:
    rng = random.Random()
    rng.seed(str(facts.get("seed", "")) or "m3t1", version=2)

    rows = int(facts.get("rows") or 0)
    top_country = str(facts.get("top_country") or "Inconnu")
    missing_revenue_pct = float(facts.get("missing_revenue_pct") or 0.0)
    missing_cols_n = int(facts.get("missing_cols_n") or 0)

    def _near_int(n: int) -> List[str]:
        candidates = [str(n), str(max(n - 1, 0)), str(n + 1), str(n + 10)]
        rng.shuffle(candidates)
        return _unique_options(str(n), candidates, 4)

    q1_opts = _unique_options(top_country, ["Togo", "Benin", "Ghana", "Nigeria"], 4)
    q2_opts = _near_int(rows)
    q3_opts = _near_percent(missing_revenue_pct)
    q4_opts = _near_int(missing_cols_n)

    return [
        {
            "id": "q1",
            "prompt": "Quel est le top-1 country (count) dans ton dataset clean ?",
            "options": q1_opts,
            "answer_index": q1_opts.index(top_country) if top_country in q1_opts else 0,
        },
        {
            "id": "q2",
            "prompt": "Combien de lignes a ton dataset clean (après dédup) ?",
            "options": q2_opts,
            "answer_index": q2_opts.index(str(rows)) if str(rows) in q2_opts else 0,
        },
        {
            "id": "q3",
            "prompt": "Quel % de valeurs manquantes sur revenue (après nettoyage) selon ton quality_report ?",
            "options": q3_opts,
            "answer_index": q3_opts.index(f"{round(missing_revenue_pct, 2):.2f}%") if f"{round(missing_revenue_pct, 2):.2f}%" in q3_opts else 0,
        },
        {
            "id": "q4",
            "prompt": "Combien de colonnes missing_* sont présentes dans ton dataset clean ?",
            "options": q4_opts,
            "answer_index": q4_opts.index(str(missing_cols_n)) if str(missing_cols_n) in q4_opts else 0,
        },
        {
            "id": "q5",
            "prompt": "Quel type pandas préserve les NA lors du nettoyage des strings (au lieu de astype(str)) ?",
            "options": ["dtype object", "dtype string", "dtype category"],
            "answer_index": 1,
        },
    ]


def _build_theme2_quiz(facts: dict) -> List[Dict[str, Any]]:
    rng = random.Random()
    rng.seed(str(facts.get("seed", "")) or "m3t2", version=2)

    rows_before = int(facts.get("rows_before") or 0)
    rows_after = int(facts.get("rows_after") or 0)
    dropped_rows = int(facts.get("dropped_rows") or 0)
    exact_row_duplicates = int(facts.get("exact_row_duplicates") or 0)
    best_key = str(facts.get("best_key") or "user_id")
    entity_id_unique = bool(facts.get("entity_id_unique"))

    def _near_int(n: int) -> List[str]:
        candidates = [str(n), str(max(n - 1, 0)), str(n + 1), str(n + 10)]
        rng.shuffle(candidates)
        return _unique_options(str(n), candidates, 4)

    q1_opts = _near_int(rows_before)
    q2_opts = _near_int(rows_after)
    q3_opts = _near_int(dropped_rows)
    q4_opts = _near_int(exact_row_duplicates)
    q5_opts = _unique_options(best_key, ["user_id", "email", "phone", "email_or_phone"], 4)
    q6_opts = ["Oui", "Non"]

    return [
        {
            "id": "q1",
            "prompt": "Combien de lignes avant déduplication ?",
            "options": q1_opts,
            "answer_index": q1_opts.index(str(rows_before)) if str(rows_before) in q1_opts else 0,
        },
        {
            "id": "q2",
            "prompt": "Combien de lignes après déduplication ?",
            "options": q2_opts,
            "answer_index": q2_opts.index(str(rows_after)) if str(rows_after) in q2_opts else 0,
        },
        {
            "id": "q3",
            "prompt": "Combien de lignes ont été supprimées ?",
            "options": q3_opts,
            "answer_index": q3_opts.index(str(dropped_rows)) if str(dropped_rows) in q3_opts else 0,
        },
        {
            "id": "q4",
            "prompt": "Combien de exact_row_duplicates y avait-il ?",
            "options": q4_opts,
            "answer_index": q4_opts.index(str(exact_row_duplicates)) if str(exact_row_duplicates) in q4_opts else 0,
        },
        {
            "id": "q5",
            "prompt": "Quelle clé candidate a le plus faible duplicate_rate_pct ?",
            "options": q5_opts,
            "answer_index": q5_opts.index(best_key) if best_key in q5_opts else 0,
        },
        {
            "id": "q6",
            "prompt": "Le check entity_id_unique est-il OK ?",
            "options": q6_opts,
            "answer_index": 0 if entity_id_unique else 1,
        },
    ]


def _grade_quiz(questions: List[Dict[str, Any]], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    answer_by_id: Dict[str, int] = {}
    for a in answers:
        qid = str(a.get("question_id"))
        idx = a.get("answer_index")
        if isinstance(idx, int):
            answer_by_id[qid] = idx

    total = len(questions)
    correct = 0
    for q in questions:
        qid = str(q.get("id"))
        opts = q.get("options") or []
        idx = answer_by_id.get(qid)
        if not isinstance(idx, int) or idx < 0 or idx >= len(opts):
            continue
        if idx == int(q.get("answer_index") or 0):
            correct += 1

    percent = int(round((correct / total) * 100)) if total else 0
    return {"correct": correct, "total": total, "percent": percent, "passed": percent >= 70}


@router.get("/theme-1/status")
async def theme1_status(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME1_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    return {"validated": bool(sub), "checks": (sub.get("checks") if sub else None)}


@router.post("/theme-1/submit")
async def theme1_submit(
    profiling_table_csv: UploadFile = File(...),
    dataset_clean_csv: UploadFile = File(...),
    quality_report_json: UploadFile = File(...),
    missingness_plan_md: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    errors: List[str] = []

    profiling_text = _read_text(profiling_table_csv)
    dataset_text = _read_text(dataset_clean_csv)
    report_text = _read_text(quality_report_json)
    plan_text = _read_text(missingness_plan_md, max_bytes=500_000).strip()

    # basic presence checks
    if _count_csv_rows(profiling_text) < 1:
        errors.append("m3t1_profiling_table.csv est vide ou trop court.")
    if _count_csv_rows(dataset_text) < 1:
        errors.append("m3t1_dataset_clean.csv est vide ou trop court.")
    if len(plan_text) < 50:
        errors.append("m3t1_missingness_plan.md est vide ou trop court.")

    # validate profiling columns
    profiling_cols = _csv_fieldnames(profiling_text)
    for col in ["column", "dtype", "na_pct", "n_unique", "top3"]:
        if col not in profiling_cols:
            errors.append(f"m3t1_profiling_table.csv: colonne manquante '{col}'.")

    # validate dataset missing_* columns
    dataset_cols = _csv_fieldnames(dataset_text)
    for col in REQUIRED_MISSING_COLS:
        if col not in dataset_cols:
            errors.append(f"m3t1_dataset_clean.csv: colonne manquante '{col}'.")

    # validate quality report + checks
    report_obj: Dict[str, Any] = {}
    try:
        report_obj = json.loads(report_text)
        if not isinstance(report_obj, dict):
            raise ValueError("not an object")
    except Exception:
        errors.append("m3t1_quality_report.json invalide (JSON).")
        report_obj = {}

    checks = report_obj.get("checks") if isinstance(report_obj.get("checks"), dict) else {}
    for key in REQUIRED_CHECKS:
        if checks.get(key) is not True:
            errors.append(f"quality_report.checks.{key} doit être true.")

    missing_pct = report_obj.get("missing_pct") if isinstance(report_obj.get("missing_pct"), dict) else {}
    missing_revenue_pct = float(missing_pct.get("revenue") or 0.0) if isinstance(missing_pct, dict) else 0.0

    # derive facts for quiz
    top_country = _top_country(dataset_text) or "Inconnu"
    rows = _count_csv_rows(dataset_text)
    missing_cols_n = len([c for c in dataset_cols if c.startswith("missing_")])

    validated = len(errors) == 0
    doc: Dict[str, Any] = {
        "created_at": _now(),
        "user_id": user_id,
        "validated": validated,
        "errors": errors,
        "checks": {k: bool(checks.get(k)) for k in REQUIRED_CHECKS},
        "facts": {
            "seed": f"{user_id}:{int(_now().timestamp())}",
            "rows": rows,
            "top_country": top_country,
            "missing_revenue_pct": missing_revenue_pct,
            "missing_cols_n": missing_cols_n,
        },
        "files": {
            "profiling_table_csv": profiling_table_csv.filename,
            "dataset_clean_csv": dataset_clean_csv.filename,
            "quality_report_json": quality_report_json.filename,
            "missingness_plan_md": missingness_plan_md.filename,
        },
    }
    await db[COLL_THEME1_SUBMISSIONS].insert_one(doc)
    return {"validated": validated, "errors": errors, "checks": doc["checks"]}


@router.get("/theme-1/quiz")
async def theme1_quiz(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME1_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Soumission Thème 1 non validée.")
    questions = _build_theme1_quiz(sub.get("facts") or {})
    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


@router.post("/theme-1/quiz/submit")
async def theme1_quiz_submit(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME1_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Soumission Thème 1 non validée.")

    answers = payload.get("answers") if isinstance(payload.get("answers"), list) else []
    questions = _build_theme1_quiz(sub.get("facts") or {})
    result = _grade_quiz(questions=questions, answers=answers)
    await db[COLL_THEME1_QUIZ_ATTEMPTS].insert_one(
        {
            "created_at": _now(),
            "user_id": user_id,
            "percent": result["percent"],
            "passed": result["passed"],
            "answers": answers,
        }
    )
    return result


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
    return {"validated": bool(sub), "checks": (sub.get("checks") if sub else None)}


@router.post("/theme-2/submit")
async def theme2_submit(
    key_audit_csv: UploadFile = File(...),
    duplicates_report_csv: UploadFile = File(...),
    dataset_dedup_csv: UploadFile = File(...),
    dedup_audit_csv: UploadFile = File(...),
    quality_report_json: UploadFile = File(...),
    dedup_rules_md: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    errors: List[str] = []

    key_audit_text = _read_text(key_audit_csv)
    dup_report_text = _read_text(duplicates_report_csv)
    dataset_text = _read_text(dataset_dedup_csv)
    audit_text = _read_text(dedup_audit_csv)
    report_text = _read_text(quality_report_json)
    rules_text = _read_text(dedup_rules_md, max_bytes=500_000).strip()

    # basic file sanity checks
    if _count_csv_rows(key_audit_text) < 1:
        errors.append("m3t2_key_audit.csv est vide ou trop court.")
    if _count_csv_rows(dup_report_text) < 1:
        errors.append("m3t2_duplicates_report.csv est vide ou trop court.")
    if _count_csv_rows(dataset_text) < 1:
        errors.append("m3t2_dataset_dedup.csv est vide ou trop court.")
    audit_rows = 0
    try:
        audit_rows = _count_csv_rows(audit_text)
        if audit_rows < 1:
            errors.append("m3t2_dedup_audit.csv doit contenir au moins 1 ligne.")
    except Exception:
        errors.append("m3t2_dedup_audit.csv invalide.")
    if len(rules_text) < 50:
        errors.append("m3t2_dedup_rules.md est vide ou trop court.")

    dataset_cols = _csv_fieldnames(dataset_text)
    if "entity_id" not in dataset_cols:
        errors.append("m3t2_dataset_dedup.csv doit contenir la colonne entity_id.")

    report_obj: Dict[str, Any] = {}
    try:
        report_obj = json.loads(report_text)
        if not isinstance(report_obj, dict):
            raise ValueError("not an object")
    except Exception:
        errors.append("m3t2_quality_report.json invalide (JSON).")
        report_obj = {}

    checks = report_obj.get("checks") if isinstance(report_obj.get("checks"), dict) else {}
    if checks.get("entity_id_unique") is not True:
        errors.append("quality_report.checks.entity_id_unique doit être true.")
    if checks.get("rows_ge_200") is not True:
        errors.append("quality_report.checks.rows_ge_200 doit être true.")

    rows_before = int(report_obj.get("rows_before") or 0)
    rows_after = int(report_obj.get("rows_after") or 0)
    dropped_rows = int(report_obj.get("dropped_rows") or 0)
    entity_id_unique = bool(checks.get("entity_id_unique"))

    # derive quiz facts from key audit + duplicates report
    best_key = "user_id"
    try:
        audit_rows_parsed = _read_csv_dicts(key_audit_text)
        if audit_rows_parsed:
            ranked = []
            for r in audit_rows_parsed:
                name = str(r.get("candidate_key") or "").strip()
                rate_raw = str(r.get("duplicate_rate_pct") or "").strip()
                if not name:
                    continue
                try:
                    rate = float(rate_raw)
                except Exception:
                    continue
                ranked.append((rate, name))
            if ranked:
                ranked.sort(key=lambda x: x[0])
                best_key = ranked[0][1]
    except Exception:
        pass

    exact_row_duplicates = 0
    try:
        rep_rows = _read_csv_dicts(dup_report_text)
        for r in rep_rows:
            if str(r.get("type") or "") == "exact_row_duplicates":
                exact_row_duplicates = int(float(str(r.get("duplicate_rows") or "0") or "0"))
                break
    except Exception:
        pass

    validated = len(errors) == 0
    doc: Dict[str, Any] = {
        "created_at": _now(),
        "user_id": user_id,
        "validated": validated,
        "errors": errors,
        "checks": {
            "entity_id_unique": bool(checks.get("entity_id_unique")),
            "rows_ge_200": bool(checks.get("rows_ge_200")),
        },
        "facts": {
            "seed": f"{user_id}:{int(_now().timestamp())}",
            "rows_before": rows_before,
            "rows_after": rows_after,
            "dropped_rows": dropped_rows,
            "exact_row_duplicates": exact_row_duplicates,
            "best_key": best_key,
            "entity_id_unique": entity_id_unique,
        },
        "files": {
            "key_audit_csv": key_audit_csv.filename,
            "duplicates_report_csv": duplicates_report_csv.filename,
            "dataset_dedup_csv": dataset_dedup_csv.filename,
            "dedup_audit_csv": dedup_audit_csv.filename,
            "quality_report_json": quality_report_json.filename,
            "dedup_rules_md": dedup_rules_md.filename,
        },
        "audit_rows": audit_rows,
    }
    await db[COLL_THEME2_SUBMISSIONS].insert_one(doc)
    return {"validated": validated, "errors": errors, "checks": doc["checks"]}


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
    questions = _build_theme2_quiz(sub.get("facts") or {})
    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


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

    answers = payload.get("answers") if isinstance(payload.get("answers"), list) else []
    questions = _build_theme2_quiz(sub.get("facts") or {})
    result = _grade_quiz(questions=questions, answers=answers)
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
