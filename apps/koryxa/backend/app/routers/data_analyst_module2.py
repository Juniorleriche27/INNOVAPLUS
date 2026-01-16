from __future__ import annotations

import csv
import io
import json
import random
import zipfile
from pathlib import PurePosixPath
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user


router = APIRouter(prefix="/school/data-analyst/module-2", tags=["school-data-analyst"])

COLL_THEME1_SUBMISSIONS = "module2_theme1_submissions"
COLL_THEME1_QUIZ_ATTEMPTS = "module2_theme1_quiz_attempts"

COLL_THEME2_SUBMISSIONS = "module2_theme2_submissions"
COLL_THEME2_QUIZ_ATTEMPTS = "module2_theme2_quiz_attempts"

COLL_THEME3_SUBMISSIONS = "module2_theme3_submissions"
COLL_THEME3_QUIZ_SESSIONS = "module2_theme3_quiz_sessions"
COLL_THEME3_QUIZ_ATTEMPTS = "module2_theme3_quiz_attempts"

COLL_THEME4_SUBMISSIONS = "module2_theme4_submissions"
COLL_THEME4_QUIZ_ATTEMPTS = "module2_theme4_quiz_attempts"

COLL_THEME5_SUBMISSIONS = "module2_theme5_submissions"
COLL_THEME5_QUIZ_SESSIONS = "module2_theme5_quiz_sessions"
COLL_THEME5_QUIZ_ATTEMPTS = "module2_theme5_quiz_attempts"

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


def _zip_pick_by_basename(names: List[str], required_basenames: List[str]) -> Dict[str, str]:
    """
    Map each required basename -> member name in zip (case-insensitive), searching recursively.
    If multiple matches exist, keeps the shortest path (closest to root) for stability.
    """
    by_base: Dict[str, str] = {}
    for name in names:
        if name.endswith("/"):
            continue
        base = PurePosixPath(name).name.lower()
        if not base:
            continue
        prev = by_base.get(base)
        if prev is None or name.count("/") < prev.count("/"):
            by_base[base] = name

    picked: Dict[str, str] = {}
    for req in required_basenames:
        member = by_base.get(req.lower())
        if member:
            picked[req] = member
    return picked


def _zip_read_text(z: zipfile.ZipFile, member: str, max_bytes: int = 2_000_000) -> str:
    data = z.read(member)
    if len(data) > max_bytes:
        raise HTTPException(status_code=422, detail=f"Fichier trop volumineux dans le ZIP: {member}")
    try:
        return data.decode("utf-8")
    except Exception:
        return data.decode("latin-1", errors="replace")


def _parse_theme5_capstone_zip(zip_bytes: bytes) -> Dict[str, Any]:
    required = [
        "README.md",
        "manifest.json",
        "lineage.md",
        "data_dictionary.csv",
        "quality_report.json",
        "final_dataset.csv",
        "extract_sql.sql",
        "extract_api.py",
        "powerquery.m",
        "packager.ipynb",
    ]
    warnings: List[str] = []

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        names = z.namelist()
        picked = _zip_pick_by_basename(names, required)
        missing = [b for b in required if b not in picked]

        failed_checks: List[str] = []

        quality_obj: Optional[dict] = None
        if "quality_report.json" in picked:
            try:
                quality_obj = json.loads(_zip_read_text(z, picked["quality_report.json"]))
            except Exception:
                failed_checks.append("quality_report.json: invalid_json")

        manifest_obj: Optional[dict] = None
        if "manifest.json" in picked:
            try:
                manifest_obj = json.loads(_zip_read_text(z, picked["manifest.json"]))
            except Exception:
                failed_checks.append("manifest.json: invalid_json")

        passed = False
        quality_failed_checks: List[str] = []
        if isinstance(quality_obj, dict):
            if "passed" not in quality_obj or "failed_checks" not in quality_obj:
                failed_checks.append("quality_report.json: missing passed/failed_checks")
            else:
                passed = bool(quality_obj.get("passed"))
                fc = quality_obj.get("failed_checks")
                if isinstance(fc, list):
                    quality_failed_checks = [str(x) for x in fc]

        # Best effort validations for manifest shape (non-blocking)
        if isinstance(manifest_obj, dict):
            inputs = manifest_obj.get("inputs")
            if inputs is not None and not isinstance(inputs, list):
                warnings.append("manifest.json: inputs should be a list")

        # Server validation: must have all required files AND quality passed == true
        validated = bool(passed and not missing and not failed_checks)
        if missing:
            failed_checks.insert(0, f"missing_files={missing}")
        if quality_failed_checks:
            failed_checks.extend(quality_failed_checks)

        facts: Dict[str, Any] = {}
        if isinstance(quality_obj, dict):
            facts["rows"] = int(quality_obj.get("rows") or 0)
            facts["duplicate_user_id"] = int(quality_obj.get("duplicate_user_id") or 0)
            facts["date_min"] = quality_obj.get("date_min")
            facts["date_max"] = quality_obj.get("date_max")
            facts["checks"] = quality_obj.get("checks") if isinstance(quality_obj.get("checks"), dict) else {}
            facts["passed"] = bool(quality_obj.get("passed")) if "passed" in quality_obj else None
            facts["failed_checks"] = quality_obj.get("failed_checks") if isinstance(quality_obj.get("failed_checks"), list) else []

        if isinstance(manifest_obj, dict):
            facts["inputs_len"] = len(manifest_obj.get("inputs") or []) if isinstance(manifest_obj.get("inputs"), list) else 0

        return {
            "validated": validated,
            "passed": passed,
            "missing": missing,
            "failed_checks": failed_checks,
            "warnings": warnings,
            "facts": facts,
        }


def _build_theme5_quiz(facts: dict) -> List[Dict[str, Any]]:
    rows = int(facts.get("rows", 0) or 0)
    dup = int(facts.get("duplicate_user_id", 0) or 0)
    date_min = str(facts.get("date_min") or "N/A")
    date_max = str(facts.get("date_max") or "N/A")
    checks = facts.get("checks") if isinstance(facts.get("checks"), dict) else {}
    rows_ge_200 = "true" if bool(checks.get("rows_ge_200")) else "false"
    inputs_len = int(facts.get("inputs_len", 0) or 0)
    failed_checks = facts.get("failed_checks") if isinstance(facts.get("failed_checks"), list) else []
    failed_count = int(len(failed_checks))

    def near_int(n: int) -> List[str]:
        return _unique_options(str(n), [str(max(0, n - 1)), str(n + 1), str(n + 2)], 4)

    def bool_opts(correct: str) -> List[str]:
        return _unique_options(correct, ["true", "false"], 2)

    def date_opts(correct: str) -> List[str]:
        return _unique_options(correct, ["N/A", "2026-01-01T00:00:00Z", "2030-01-01T00:00:00Z"], 4)

    q1 = near_int(rows)
    q2 = near_int(dup)
    q3 = date_opts(date_min)
    q4 = date_opts(date_max)
    q5 = bool_opts(rows_ge_200)
    q6 = near_int(inputs_len)
    q7 = near_int(failed_count)

    return [
        {
            "id": "q1",
            "prompt": "rows : combien de lignes dans final_dataset (quality_report.json) ?",
            "options": q1,
            "answer_index": q1.index(str(rows)) if str(rows) in q1 else 0,
        },
        {
            "id": "q2",
            "prompt": "duplicate_user_id : combien de user_id dupliqués ?",
            "options": q2,
            "answer_index": q2.index(str(dup)) if str(dup) in q2 else 0,
        },
        {
            "id": "q3",
            "prompt": "date_min : quelle est la date minimale ?",
            "options": q3,
            "answer_index": q3.index(date_min) if date_min in q3 else 0,
        },
        {
            "id": "q4",
            "prompt": "date_max : quelle est la date maximale ?",
            "options": q4,
            "answer_index": q4.index(date_max) if date_max in q4 else 0,
        },
        {
            "id": "q5",
            "prompt": "checks.rows_ge_200 vaut quoi (true/false) ?",
            "options": q5,
            "answer_index": q5.index(rows_ge_200) if rows_ge_200 in q5 else 0,
        },
        {
            "id": "q6",
            "prompt": "manifest.json : combien d'inputs (inputs.length) ?",
            "options": q6,
            "answer_index": q6.index(str(inputs_len)) if str(inputs_len) in q6 else 0,
        },
        {
            "id": "q7",
            "prompt": "quality_report.json : combien de failed_checks ?",
            "options": q7,
            "answer_index": q7.index(str(failed_count)) if str(failed_count) in q7 else 0,
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


THEME1_INV_REQUIRED_COLS = [
    "source_name",
    "type",
    "owner",
    "access",
    "refresh",
    "grain",
    "key_fields",
    "coverage",
    "known_issues",
    "privacy",
    "linked_kpis",
]


def _validate_theme1_inventory_csv(text: str) -> Dict[str, Any]:
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=422, detail="inventory_csv est vide.")
    cols = list(rows[0].keys() or [])
    missing = set(THEME1_INV_REQUIRED_COLS) - set(cols)
    if missing:
        raise HTTPException(status_code=422, detail=f"inventory_csv colonnes manquantes: {sorted(missing)}")
    if len(rows) < 8:
        raise HTTPException(status_code=422, detail=f"inventory_csv doit contenir >= 8 lignes (actuel={len(rows)}).")
    return {"rows": len(rows), "cols": cols}


def _validate_theme1_quality_checks(text: str) -> Dict[str, Any]:
    try:
        obj = json.loads(text)
    except Exception:
        raise HTTPException(status_code=422, detail="m2t1_quality_checks.json invalide (JSON parse error).")

    inv_rows = obj.get("inventory_rows")
    req_rows = obj.get("requirements_rows")
    if not isinstance(inv_rows, int) or not isinstance(req_rows, int):
        raise HTTPException(status_code=422, detail="m2t1_quality_checks.json doit contenir inventory_rows et requirements_rows (int).")

    checks_list = obj.get("checks")
    if not isinstance(checks_list, list):
        raise HTTPException(status_code=422, detail="m2t1_quality_checks.json doit contenir checks (array).")

    checks: Dict[str, Any] = {}
    for item in checks_list:
        if not isinstance(item, dict):
            continue
        name = item.get("name")
        ok = item.get("ok")
        if isinstance(name, str):
            checks[name] = bool(ok)

    return {"inventory_rows": inv_rows, "requirements_rows": req_rows, "checks": checks}


def _extract_join_candidates(text: str) -> List[str]:
    # Keep it permissive: look for "->" join lines, prefer those with backticks.
    joins: List[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if "->" not in line:
            continue
        if "`" in line:
            # Example: - `a` -> `b`
            parts = [p.strip("` ").strip() for p in line.replace("- ", "").split("->", 1)]
            if len(parts) == 2 and parts[0] and parts[1]:
                joins.append(f"{parts[0]} -> {parts[1]}")
                continue
        # Fallback: keep raw join line
        joins.append(line)
    # de-dupe while preserving order
    seen = set()
    out: List[str] = []
    for j in joins:
        if j in seen:
            continue
        seen.add(j)
        out.append(j)
    return out


THEME4_TX_REQUIRED_COLS = ["tx_id", "user_id", "amount", "currency", "created_at", "country", "channel"]


def _validate_theme4_transactions_csv(text: str, *, min_rows: int = 1) -> Dict[str, Any]:
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if len(rows) < min_rows:
        raise HTTPException(status_code=422, detail=f"transactions CSV vide ou trop court (min_rows={min_rows}).")
    cols = list(rows[0].keys() or [])
    missing = set(THEME4_TX_REQUIRED_COLS) - set(cols)
    if missing:
        raise HTTPException(status_code=422, detail=f"transactions CSV colonnes manquantes: {sorted(missing)}")
    return {"rows": len(rows), "cols": cols}


def _validate_theme4_run_report(text: str) -> Dict[str, Any]:
    try:
        obj = json.loads(text)
    except Exception:
        raise HTTPException(status_code=422, detail="m2t4_run_report.json invalide (JSON parse error).")

    for key in ["requests_made", "rows_fetched", "n_429"]:
        if not isinstance(obj.get(key), int):
            raise HTTPException(status_code=422, detail=f"m2t4_run_report.json doit contenir {key} (int).")
    return obj


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
        {
            "id": "q6",
            "prompt": "Ton fichier m2t2_powerquery.m est-il détecté comme non vide (OK/KO) ?",
            "options": ["OK", "KO"],
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
    powerquery_ok = bool(checks.get("powerquery_m_ok"))

    correct_map: Dict[str, str] = {
        "q1": str(duplicate_rows),
        "q2": "true" if bool(checks.get("has_expected_columns")) else "false",
        "q3": event_time_min,
        "q4": event_time_max,
        "q5": example_event,
        "q6": "OK" if powerquery_ok else "KO",
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


def _build_theme1_quiz(sub: Dict[str, Any]) -> List[Dict[str, Any]]:
    inv_rows = int(sub.get("inventory_rows") or 0)
    req_rows = int(sub.get("requirements_rows") or 0)
    checks = sub.get("checks") if isinstance(sub.get("checks"), dict) else {}
    joins = sub.get("joins") if isinstance(sub.get("joins"), list) else []
    joins = [j for j in joins if isinstance(j, str)]

    def opt_int(correct: int) -> List[str]:
        candidates = [str(correct), str(max(0, correct - 1)), str(correct + 1), str(correct + 2)]
        return _unique_options(str(correct), candidates, 4)

    inv_ok = bool(checks.get("inventory_min_8_sources"))
    req_ok = bool(checks.get("requirements_min_10_fields"))
    uniq_ok = bool(checks.get("unique_source_name"))
    key_ok = bool(checks.get("has_key_fields"))

    j1 = joins[0] if joins else "platform_events.user_id -> validations.user_id"
    j2 = joins[1] if len(joins) > 1 else "platform_events.user_id -> profile.user_id"

    return [
        {"id": "q1", "prompt": "Ton inventaire contient combien de sources (inventory_rows) ?", "options": opt_int(inv_rows)},
        {"id": "q2", "prompt": "Le check inventory_min_8_sources est-il OK ?", "options": ["true", "false"]},
        {"id": "q3", "prompt": "Le check requirements_min_10_fields est-il OK ?", "options": ["true", "false"]},
        {"id": "q4", "prompt": "Le check unique_source_name est-il OK ?", "options": ["true", "false"]},
        {"id": "q5", "prompt": "Le check has_key_fields est-il OK ?", "options": ["true", "false"]},
        {
            "id": "q6",
            "prompt": "Laquelle de ces jointures est proposee dans ton data mapping ?",
            "options": _unique_options(j1, [j2, "payments.user_id -> refunds.user_id", "sessions.session_id -> marketing.user_id"], 4),
        },
        {
            "id": "q7",
            "prompt": "Quel est l'objectif pro de la collecte (1 phrase) ?",
            "options": [
                "Construire un dataset fiable et tracable (logs + versioning) pour servir une decision",
                "Recuperer le plus de colonnes possibles",
                "Faire un dashboard avant d'avoir des sources",
                "Eviter tout controle qualite",
            ],
        },
        {
            "id": "q8",
            "prompt": "Quelle est la regle pro de pagination recommande pour les APIs ?",
            "options": [
                "Suivre le champ next tant qu'il n'est pas null",
                "Incremente page au hasard",
                "Toujours demander page_size=10000",
                "Ignorer la pagination",
            ],
        },
        {
            "id": "q9",
            "prompt": "Quel est l'ordre recommande pour collecter (priorites) ?",
            "options": [
                "Sources coeur KPI -> segmentation -> garde-fous/qualite",
                "Garde-fous -> segmentation -> coeur KPI",
                "Segmentation uniquement",
                "Ne pas prioriser",
            ],
        },
        {
            "id": "q10",
            "prompt": "Quelle erreur classique rend un KPI faux apres jointure ?",
            "options": [
                "Melanger des grains (commande vs article) et dupliquer les montants",
                "Ajouter des logs de requete",
                "Versionner les extractions",
                "Utiliser des headers d'API",
            ],
        },
    ]


def _grade_theme1_quiz(questions: List[Dict[str, Any]], sub: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    answer_by_id = {a.get("question_id"): a.get("answer_index") for a in answers if isinstance(a, dict)}
    total = len(questions)
    if total == 0:
        raise HTTPException(status_code=500, detail="Quiz vide.")

    inv_rows = int(sub.get("inventory_rows") or 0)
    checks = sub.get("checks") if isinstance(sub.get("checks"), dict) else {}
    joins = sub.get("joins") if isinstance(sub.get("joins"), list) else []
    joins = [j for j in joins if isinstance(j, str)]
    j1 = joins[0] if joins else "platform_events.user_id -> validations.user_id"

    correct_map: Dict[str, str] = {
        "q1": str(inv_rows),
        "q2": "true" if bool(checks.get("inventory_min_8_sources")) else "false",
        "q3": "true" if bool(checks.get("requirements_min_10_fields")) else "false",
        "q4": "true" if bool(checks.get("unique_source_name")) else "false",
        "q5": "true" if bool(checks.get("has_key_fields")) else "false",
        "q6": j1,
        "q7": "Construire un dataset fiable et tracable (logs + versioning) pour servir une decision",
        "q8": "Suivre le champ next tant qu'il n'est pas null",
        "q9": "Sources coeur KPI -> segmentation -> garde-fous/qualite",
        "q10": "Melanger des grains (commande vs article) et dupliquer les montants",
    }

    correct = 0
    for q in questions:
        qid = str(q.get("id"))
        opts = q.get("options") or []
        idx = answer_by_id.get(qid)
        if not isinstance(idx, int) or idx < 0 or idx >= len(opts):
            continue
        expected = correct_map.get(qid)
        if expected is None:
            continue
        if str(opts[idx]) == str(expected):
            correct += 1

    percent = int(round((correct / total) * 100))
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
    return {
        "validated": bool(sub),
        "inventory_rows": (sub.get("inventory_rows") if sub else None),
        "requirements_rows": (sub.get("requirements_rows") if sub else None),
    }


@router.post("/theme-1/submit")
async def theme1_submit(
    inventory_csv: UploadFile = File(...),
    data_mapping_md: UploadFile = File(...),
    collection_plan_md: UploadFile = File(...),
    quality_checks_json: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    errors: List[str] = []

    inv_info: Dict[str, Any] = {}
    qc_info: Dict[str, Any] = {}
    joins: List[str] = []

    try:
        inv_text = _read_text(inventory_csv)
        inv_info = _validate_theme1_inventory_csv(inv_text)
    except HTTPException as e:
        errors.append(str(e.detail))

    try:
        qc_text = _read_text(quality_checks_json)
        qc_info = _validate_theme1_quality_checks(qc_text)
        if int(qc_info.get("inventory_rows") or 0) < 8:
            errors.append("quality_checks.json: inventory_rows doit etre >= 8.")
        if int(qc_info.get("requirements_rows") or 0) < 10:
            errors.append("quality_checks.json: requirements_rows doit etre >= 10.")
    except HTTPException as e:
        errors.append(str(e.detail))

    mapping_text = _read_text(data_mapping_md, max_bytes=500_000).strip()
    if len(mapping_text) < 20:
        errors.append("m2t1_data_mapping.md est vide ou trop court.")
    else:
        joins = _extract_join_candidates(mapping_text)[:20]

    plan_text = _read_text(collection_plan_md, max_bytes=500_000).strip()
    if len(plan_text) < 50:
        errors.append("m2t1_collection_plan.md est vide ou trop court.")

    validated = len(errors) == 0
    doc: Dict[str, Any] = {
        "created_at": _now(),
        "user_id": user_id,
        "validated": validated,
        "errors": errors,
        "inventory_rows": int((qc_info.get("inventory_rows") if isinstance(qc_info, dict) else 0) or 0),
        "requirements_rows": int((qc_info.get("requirements_rows") if isinstance(qc_info, dict) else 0) or 0),
        "checks": (qc_info.get("checks") if isinstance(qc_info, dict) else {}),
        "inv_info": inv_info,
        "joins": joins,
        "files": {
            "inventory_csv": inventory_csv.filename,
            "data_mapping_md": data_mapping_md.filename,
            "collection_plan_md": collection_plan_md.filename,
            "quality_checks_json": quality_checks_json.filename,
        },
    }
    await db[COLL_THEME1_SUBMISSIONS].insert_one(doc)
    return {"validated": validated, "errors": errors, "inventory_rows": doc["inventory_rows"], "requirements_rows": doc["requirements_rows"]}


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
    questions = _build_theme1_quiz(sub)
    # Do not expose answers.
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
    questions = _build_theme1_quiz(sub)
    result = _grade_theme1_quiz(questions=questions, sub=sub, answers=answers)
    await db[COLL_THEME1_QUIZ_ATTEMPTS].insert_one(
        {"created_at": _now(), "user_id": user_id, "percent": result["percent"], "passed": result["passed"], "answers": answers}
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
    checks_payload = (q_info.get("checks") if isinstance(q_info, dict) else None)
    checks_dict: Dict[str, Any] = checks_payload if isinstance(checks_payload, dict) else {}
    checks_dict["powerquery_m_ok"] = len(m_text) >= 30
    checks_dict["data_dictionary_ok"] = len(dd_text) >= 20
    checks_dict["refresh_notes_ok"] = len(notes_text) >= 20

    doc: Dict[str, Any] = {
        "created_at": _now(),
        "user_id": user_id,
        "validated": validated,
        "errors": errors,
        "csv_info": csv_info,
        "checks": checks_dict,
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


def _top_country_from_transactions(text: str) -> Optional[str]:
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


def _build_theme4_quiz(sub: Dict[str, Any]) -> List[Dict[str, Any]]:
    requests_made = int(sub.get("requests_made") or 0)
    rows_fetched = int(sub.get("rows_fetched") or 0)
    n_429 = int(sub.get("n_429") or 0)
    top_country = str(sub.get("top_country") or "Inconnu")
    date_min = str(sub.get("date_min") or "N/A")
    date_max = str(sub.get("date_max") or "N/A")

    def opt_int(correct: int) -> List[str]:
        candidates = [str(correct), str(max(0, correct - 1)), str(correct + 1), str(correct + 2)]
        random.shuffle(candidates)
        return _unique_options(str(correct), candidates, 4)

    country_opts = _unique_options(top_country, ["Togo", "Benin", "Ghana", "Senegal"], 4)
    return [
        {"id": "q1", "prompt": "Combien de requetes as-tu faites (requests_made) ?", "options": opt_int(requests_made)},
        {"id": "q2", "prompt": "Combien de lignes as-tu recupere (rows_fetched) ?", "options": opt_int(rows_fetched)},
        {"id": "q3", "prompt": "Combien de 429 as-tu eu (n_429) ?", "options": opt_int(n_429)},
        {"id": "q4", "prompt": "Quel pays est top-1 (count) dans ton CSV clean ?", "options": country_opts},
        {
            "id": "q5",
            "prompt": "Pourquoi faut-il utiliser un timeout avec requests ?",
            "options": [
                "Pour eviter un appel qui bloque indefiniment",
                "Pour forcer l'API a repondre plus vite",
                "Pour contourner l'auth",
                "Pour supprimer la pagination",
            ],
        },
        {
            "id": "q6",
            "prompt": "Que signifie HTTP 429 ?",
            "options": [
                "Too Many Requests (rate limit)",
                "Not Found",
                "Unauthorized",
                "Server Error",
            ],
        },
        {
            "id": "q7",
            "prompt": "Quel header aide a savoir combien de temps attendre apres un 429 ?",
            "options": ["Retry-After", "Authorization", "Content-Type", "ETag"],
        },
        {
            "id": "q8",
            "prompt": "Quelle est la regle pro pour la pagination 'next' ?",
            "options": [
                "Suivre next jusqu'a null",
                "Toujours demander page=999",
                "Ignorer next",
                "Dupliquer la premiere page",
            ],
        },
        {"id": "q9", "prompt": "Quel est date_min dans ton run report ?", "options": [date_min, date_max, "N/A", "2020-01-01T00:00:00Z"]},
        {"id": "q10", "prompt": "Quel est date_max dans ton run report ?", "options": [date_max, date_min, "N/A", "2030-01-01T00:00:00Z"]},
    ]


def _grade_theme4_quiz(questions: List[Dict[str, Any]], sub: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    answer_by_id = {a.get("question_id"): a.get("answer_index") for a in answers if isinstance(a, dict)}
    total = len(questions)
    if total == 0:
        raise HTTPException(status_code=500, detail="Quiz vide.")

    requests_made = int(sub.get("requests_made") or 0)
    rows_fetched = int(sub.get("rows_fetched") or 0)
    n_429 = int(sub.get("n_429") or 0)
    top_country = str(sub.get("top_country") or "Inconnu")
    date_min = str(sub.get("date_min") or "N/A")
    date_max = str(sub.get("date_max") or "N/A")

    correct_map: Dict[str, str] = {
        "q1": str(requests_made),
        "q2": str(rows_fetched),
        "q3": str(n_429),
        "q4": top_country,
        "q5": "Pour eviter un appel qui bloque indefiniment",
        "q6": "Too Many Requests (rate limit)",
        "q7": "Retry-After",
        "q8": "Suivre next jusqu'a null",
        "q9": date_min,
        "q10": date_max,
    }

    correct = 0
    for q in questions:
        qid = str(q.get("id"))
        opts = q.get("options") or []
        idx = answer_by_id.get(qid)
        if not isinstance(idx, int) or idx < 0 or idx >= len(opts):
            continue
        expected = correct_map.get(qid)
        if expected is None:
            continue
        if str(opts[idx]) == str(expected):
            correct += 1

    percent = int(round((correct / total) * 100))
    return {"correct": correct, "total": total, "percent": percent, "passed": percent >= 70}


@router.get("/theme-4/status")
async def theme4_status(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME4_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    return {
        "validated": bool(sub),
        "rows_fetched": (sub.get("rows_fetched") if sub else None),
        "requests_made": (sub.get("requests_made") if sub else None),
        "n_429": (sub.get("n_429") if sub else None),
    }


@router.post("/theme-4/submit")
async def theme4_submit(
    transactions_raw_csv: UploadFile = File(...),
    transactions_clean_csv: UploadFile = File(...),
    request_log_csv: UploadFile = File(...),
    run_report_json: UploadFile = File(...),
    api_contract_md: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    errors: List[str] = []

    raw_text = _read_text(transactions_raw_csv)
    clean_text = _read_text(transactions_clean_csv)
    log_text = _read_text(request_log_csv)
    report_text = _read_text(run_report_json)
    contract_text = _read_text(api_contract_md, max_bytes=500_000).strip()

    raw_info: Dict[str, Any] = {}
    clean_info: Dict[str, Any] = {}
    report: Dict[str, Any] = {}

    try:
        raw_info = _validate_theme4_transactions_csv(raw_text, min_rows=1)
    except HTTPException as e:
        errors.append(str(e.detail))

    try:
        clean_info = _validate_theme4_transactions_csv(clean_text, min_rows=1)
    except HTTPException as e:
        errors.append(str(e.detail))

    try:
        report = _validate_theme4_run_report(report_text)
    except HTTPException as e:
        errors.append(str(e.detail))
        report = {}

    if len(contract_text) < 50:
        errors.append("m2t4_api_contract.md est vide ou trop court.")

    # request log: at least 2 rows and must include status_code
    try:
        log_rows = _count_csv_rows(log_text)
        if log_rows < 2:
            errors.append("m2t4_request_log.csv est vide ou trop court.")
    except Exception:
        errors.append("m2t4_request_log.csv invalide.")
        log_rows = 0

    rows_fetched = int(report.get("rows_fetched") or 0)
    requests_made = int(report.get("requests_made") or 0)
    n_429 = int(report.get("n_429") or 0)
    date_min = report.get("date_min")
    date_max = report.get("date_max")
    top_country = _top_country_from_transactions(clean_text) or "Inconnu"

    if rows_fetched < 200:
        errors.append("rows_fetched doit etre >= 200 (pagination OK).")
    if requests_made < 2:
        errors.append("requests_made doit etre >= 2.")
    if n_429 < 1:
        errors.append("n_429 doit etre >= 1 (rate limit simule).")
    if not date_min or not date_max:
        errors.append("date_min/date_max doivent etre non nuls.")
    if log_rows and requests_made and log_rows < requests_made:
        errors.append("request_log.csv doit contenir au moins requests_made lignes.")

    validated = len(errors) == 0
    doc: Dict[str, Any] = {
        "created_at": _now(),
        "user_id": user_id,
        "validated": validated,
        "errors": errors,
        "rows_fetched": rows_fetched,
        "requests_made": requests_made,
        "n_429": n_429,
        "date_min": date_min,
        "date_max": date_max,
        "top_country": top_country,
        "raw_info": raw_info,
        "clean_info": clean_info,
        "files": {
            "transactions_raw_csv": transactions_raw_csv.filename,
            "transactions_clean_csv": transactions_clean_csv.filename,
            "request_log_csv": request_log_csv.filename,
            "run_report_json": run_report_json.filename,
            "api_contract_md": api_contract_md.filename,
        },
    }
    await db[COLL_THEME4_SUBMISSIONS].insert_one(doc)
    return {"validated": validated, "errors": errors, "rows_fetched": rows_fetched, "requests_made": requests_made, "n_429": n_429}


@router.get("/theme-4/quiz")
async def theme4_quiz(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME4_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Soumission Thème 4 non validée.")
    questions = _build_theme4_quiz(sub)
    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


@router.post("/theme-4/quiz/submit")
async def theme4_quiz_submit(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME4_SUBMISSIONS].find_one(
        {"user_id": user_id, "validated": True},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Soumission Thème 4 non validée.")
    answers = payload.get("answers") if isinstance(payload.get("answers"), list) else []
    questions = _build_theme4_quiz(sub)
    result = _grade_theme4_quiz(questions=questions, sub=sub, answers=answers)
    await db[COLL_THEME4_QUIZ_ATTEMPTS].insert_one(
        {"created_at": _now(), "user_id": user_id, "percent": result["percent"], "passed": result["passed"], "answers": answers}
    )
    return result


@router.get("/theme-5/status")
async def theme5_status(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME5_SUBMISSIONS].find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    return {
        "has_submission": bool(sub),
        "validated": bool(sub and sub.get("validated")),
        "passed": bool(sub.get("passed")) if sub else None,
        "failed_checks": sub.get("failed_checks") if sub else None,
        "missing": sub.get("missing") if sub else None,
        "warnings": sub.get("warnings") if sub else None,
        "submitted_at": sub.get("created_at") if sub else None,
    }


@router.post("/theme-5/submit")
async def theme5_submit(
    capstone_zip: UploadFile | None = File(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    if capstone_zip is None:
        raise HTTPException(status_code=422, detail="Le fichier ZIP est requis.")

    user_id = _user_id(user)

    max_zip_bytes = 25_000_000
    zip_bytes = capstone_zip.file.read(max_zip_bytes + 1)
    if len(zip_bytes) > max_zip_bytes:
        raise HTTPException(status_code=413, detail="ZIP trop volumineux (max 25 Mo).")

    try:
        parsed = _parse_theme5_capstone_zip(zip_bytes)
    except zipfile.BadZipFile:
        raise HTTPException(status_code=422, detail="ZIP invalide (archive corrompue).")

    doc = {
        "created_at": _now(),
        "user_id": user_id,
        "validated": bool(parsed.get("validated")),
        "passed": bool(parsed.get("passed")),
        "missing": parsed.get("missing") if isinstance(parsed.get("missing"), list) else [],
        "failed_checks": parsed.get("failed_checks") if isinstance(parsed.get("failed_checks"), list) else [],
        "warnings": parsed.get("warnings") if isinstance(parsed.get("warnings"), list) else [],
        "facts": parsed.get("facts") if isinstance(parsed.get("facts"), dict) else {},
        "filename": capstone_zip.filename,
    }
    await db[COLL_THEME5_SUBMISSIONS].insert_one(doc)

    return {
        "validated": doc["validated"],
        "passed": doc["passed"],
        "missing": doc["missing"],
        "failed_checks": doc["failed_checks"],
        "warnings": doc["warnings"],
    }


@router.get("/theme-5/quiz")
async def theme5_quiz(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    sub = await db[COLL_THEME5_SUBMISSIONS].find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    if not sub:
        raise HTTPException(status_code=403, detail="Quiz verrouille. Soumets d'abord un ZIP.")

    facts = sub.get("facts") if isinstance(sub.get("facts"), dict) else {}
    if not facts:
        raise HTTPException(status_code=422, detail="Soumission incomplete: facts manquants.")

    questions = _build_theme5_quiz(facts)
    await db[COLL_THEME5_QUIZ_SESSIONS].delete_many({"user_id": user_id})
    await db[COLL_THEME5_QUIZ_SESSIONS].insert_one(
        {
            "created_at": _now(),
            "user_id": user_id,
            "questions": questions,
        }
    )
    return {"questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in questions]}


@router.post("/theme-5/quiz/submit")
async def theme5_quiz_submit(
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    user_id = _user_id(user)
    session = await db[COLL_THEME5_QUIZ_SESSIONS].find_one({"user_id": user_id})
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

    await db[COLL_THEME5_QUIZ_ATTEMPTS].insert_one(
        {
            "created_at": _now(),
            "user_id": user_id,
            "percent": percent,
            "passed": passed,
            "answers": answers,
        }
    )
    return {"score": correct, "percent": percent, "passed": passed}
