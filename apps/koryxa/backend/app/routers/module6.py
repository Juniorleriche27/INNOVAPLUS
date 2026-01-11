from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.email import send_email_async
from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.module6 import (
    SubmissionResponse,
    TestQuestion,
    TestStartResponse,
    TestSubmitPayload,
    TestSubmitResponse,
)
from app.services.module6_tests import generate_test_questions


router = APIRouter(tags=["module6"])

UPLOADS_ROOT = Path(settings.UPLOADS_DIR)
UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _parse_admin_emails(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    return [email.strip() for email in raw.split(",") if email.strip()]


@router.post("/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    url_livrable: str = Form(...),
    comment: Optional[str] = Form(None),
    file: UploadFile | None = File(None),
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not url_livrable.strip():
        raise HTTPException(status_code=422, detail="Lien de livrable requis.")

    submission_id = ObjectId()
    file_path = None
    file_name = None
    file_size = None
    if file is not None:
        filename = file.filename or ""
        if not filename.lower().endswith(".zip"):
            raise HTTPException(status_code=422, detail="Seuls les fichiers .zip sont autorises.")
        content = await file.read()
        max_bytes = settings.UPLOAD_MAX_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(status_code=413, detail="Fichier trop volumineux.")
        safe_name = f"module6_{submission_id}_{filename}".replace("/", "_")
        target = UPLOADS_ROOT / safe_name
        target.write_bytes(content)
        file_path = str(target)
        file_name = filename
        file_size = len(content)

    doc = {
        "_id": submission_id,
        "user_id": str(current.get("_id")),
        "module_id": 6,
        "url_livrable": url_livrable.strip(),
        "comment": comment.strip() if comment else None,
        "file_name": file_name,
        "file_path": file_path,
        "file_size": file_size,
        "created_at": _iso(_now()),
    }
    await db["module_submissions"].insert_one(doc)

    recipient = current.get("email")
    admin_emails = _parse_admin_emails(settings.SUBMISSION_NOTIFY_EMAILS)
    if recipient or admin_emails:
        subject = "KORYXA — Soumission recue"
        summary = f"Soumission {submission_id} pour le module 6."
        html = f"<p>{summary}</p><p>Lien: {url_livrable}</p>"
        text = f"{summary}\nLien: {url_livrable}"
        tasks = []
        if recipient:
            tasks.append(send_email_async(subject, recipient, html, text))
        for admin in admin_emails:
            tasks.append(send_email_async(f"[Admin] {subject}", admin, html, text))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    return SubmissionResponse(submission_id=str(submission_id))


@router.get("/tests/module/6", response_model=TestStartResponse)
async def start_module6_test(
    mode: str = "advanced",
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if mode != "advanced":
        raise HTTPException(status_code=400, detail="Mode de test invalide.")

    user_id = str(current.get("_id"))
    cooldown_hours = max(1, settings.MODULE6_TEST_COOLDOWN_HOURS)
    cooldown_limit = _now() - timedelta(hours=cooldown_hours)

    last_attempt = await db["module_test_attempts"].find_one(
        {"user_id": user_id, "module_id": 6},
        sort=[("created_at", -1)],
    )
    if last_attempt:
        try:
            last_ts = datetime.fromisoformat(last_attempt.get("created_at", ""))
        except Exception:
            last_ts = None
        if last_ts and last_ts > cooldown_limit:
            raise HTTPException(
                status_code=429,
                detail="Une tentative recente existe. Reessaie plus tard.",
            )

    counts = {"python": 10, "pandas": 15, "sql": 15, "viz": 10}
    questions = generate_test_questions(counts)
    if len(questions) < 50:
        raise HTTPException(status_code=500, detail="Banque de questions insuffisante.")

    test_id = f"m6_{ObjectId()}"
    payload = {
        "test_id": test_id,
        "user_id": user_id,
        "module_id": 6,
        "questions": questions,
        "created_at": _iso(_now()),
    }
    await db["module_test_sessions"].insert_one(payload)

    public_questions = [
        TestQuestion(id=q["id"], prompt=q["prompt"], options=q["options"]) for q in questions
    ]
    return TestStartResponse(test_id=test_id, questions=public_questions)


@router.post("/tests/submit", response_model=TestSubmitResponse)
async def submit_module6_test(
    payload: TestSubmitPayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current.get("_id"))
    session = await db["module_test_sessions"].find_one({"test_id": payload.test_id, "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session de test introuvable.")

    questions = session.get("questions", [])
    answer_map = {ans.question_id: ans.answer_index for ans in payload.answers}
    total = len(questions)
    correct = 0
    for q in questions:
        selected = answer_map.get(q.get("id"))
        if selected is not None and selected == q.get("answer_index"):
            correct += 1

    percent = int(round((correct / total) * 100)) if total else 0
    passed = percent >= 70
    submission_exists = await db["module_submissions"].find_one({"user_id": user_id, "module_id": 6})
    module_validated = bool(submission_exists) and passed

    attempt_doc = {
        "user_id": user_id,
        "module_id": 6,
        "test_id": payload.test_id,
        "score": correct,
        "percent": percent,
        "passed": passed,
        "created_at": _iso(_now()),
        "answers": [ans.dict() for ans in payload.answers],
    }
    result = await db["module_test_attempts"].insert_one(attempt_doc)

    return TestSubmitResponse(
        attempt_id=str(result.inserted_id),
        score=correct,
        percent=percent,
        passed=passed,
        module_validated=module_validated,
    )
