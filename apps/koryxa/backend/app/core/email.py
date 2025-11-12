from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings


logger = logging.getLogger(__name__)


def _send_email(
    subject: str,
    recipient: str,
    html_body: str,
    text_body: Optional[str],
) -> None:
    sender = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    if not sender:
        sender = "no-reply@innovaplus.africa"

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient
    message["Content-Language"] = "fr"

    if text_body:
        message.attach(MIMEText(text_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
        if settings.SMTP_USE_TLS:
            smtp.starttls()
        if settings.SMTP_USER:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASS or "")
        smtp.send_message(message)


async def send_email_async(
    subject: str,
    recipient: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> None:
    if not settings.SMTP_HOST:
        logger.info("SMTP host not configured. Email to %s logged only.", recipient)
        logger.info("Subject: %s\n%s", subject, text_body or html_body)
        return

    await asyncio.to_thread(_send_email, subject, recipient, html_body, text_body)
