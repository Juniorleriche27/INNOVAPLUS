from __future__ import annotations

import base64
import hashlib
import json
import secrets
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Literal

import segno


EventType = Literal["check_in", "check_out"]


@dataclass(frozen=True)
class QrIssueResult:
    qr_payload: str
    valid_to: datetime
    token_hash: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(text: str) -> bytes:
    # Add padding for urlsafe_b64decode
    pad = "=" * ((4 - (len(text) % 4)) % 4)
    return base64.urlsafe_b64decode((text + pad).encode("ascii"))


def encode_qr_payload(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return _b64url_encode(raw)


def decode_qr_payload(qr_payload: str) -> dict[str, Any]:
    raw = _b64url_decode((qr_payload or "").strip())
    obj = json.loads(raw.decode("utf-8"))
    if not isinstance(obj, dict):
        raise ValueError("payload must be object")
    return obj


def issue_qr_token(
    *,
    workspace_id: str,
    location_id: str,
    rotation_seconds: int = 60,
) -> QrIssueResult:
    now = _utcnow()
    rotation_seconds = max(10, min(int(rotation_seconds), 300))
    valid_to = now + timedelta(seconds=rotation_seconds)

    token_plain = secrets.token_urlsafe(18)  # 16-24 bytes base64url-ish
    token_hash = sha256_hex(token_plain)

    payload = {
        "v": 1,
        "w": workspace_id,
        "l": location_id,
        "t": token_plain,
        "exp": int(valid_to.timestamp()),
    }
    qr_payload = encode_qr_payload(payload)
    return QrIssueResult(qr_payload=qr_payload, valid_to=valid_to, token_hash=token_hash)


def render_qr_svg(qr_payload: str, *, scale: int = 6, border: int = 2) -> str:
    # Returns an SVG string. Caller can inline it in the DOM.
    qr = segno.make(qr_payload, micro=False, error="M")
    return qr.svg_inline(scale=scale, border=border)


def coerce_iso_datetime(value: str | None) -> datetime | None:
    raw = (value or "").strip()
    if not raw:
        return None
    candidate = raw[:-1] + "+00:00" if raw.endswith("Z") else raw
    parsed = datetime.fromisoformat(candidate)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def parse_day(value: str | None) -> date | None:
    raw = (value or "").strip()
    if not raw:
        return None
    return date.fromisoformat(raw)


def clamp_date_window(from_day: date | None, to_day: date | None, *, default_days: int = 30) -> tuple[date, date]:
    today = datetime.utcnow().date()
    end = to_day or today
    start = from_day or (end - timedelta(days=max(1, min(default_days, 365))))
    if start > end:
        start, end = end, start
    return start, end

