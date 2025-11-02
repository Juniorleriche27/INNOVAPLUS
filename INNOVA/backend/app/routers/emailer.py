from __future__ import annotations

import os
from typing import Optional
from fastapi import APIRouter

router = APIRouter(prefix="/email", tags=["email"])


def _send_email(to: str, subject: str, html: str) -> bool:
    # Placeholder: integrate SendGrid or provider if keys present
    key = os.getenv("EMAIL_SENDGRID_KEY")
    sender = os.getenv("EMAIL_FROM", "no-reply@example.com")
    if not key:
        # Log-only in sandbox
        print(f"[email] {subject} -> {to}\n{html[:120]}...")
        return True
    # TODO: implement real provider call
    print(f"[email] (pretend) send via SendGrid as {sender}")
    return True


@router.post("/weekly-digest/run")
async def weekly_digest_run(dry_run: Optional[int] = 1):
    # In real life: enumerate users and compile top opportunities + stats
    # Here: send a single sample message
    ok = _send_email("sample@user.tld", "Votre synthèse hebdo INNOVA+", "<h1>Top 5 opportunités</h1><p>…</p>")
    return {"ok": ok, "dry_run": dry_run}

