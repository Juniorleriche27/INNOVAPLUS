from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT_S = 10


def fire_webhook(webhook_url: str, payload: dict[str, Any]) -> None:
    """POST payload to webhook_url. Logs errors, never raises."""
    try:
        with httpx.Client(timeout=_TIMEOUT_S) as client:
            response = client.post(webhook_url, json=payload)
            response.raise_for_status()
        logger.info("Webhook delivered to %s (status %s)", webhook_url, response.status_code)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Webhook delivery failed for %s: %s", webhook_url, exc)
