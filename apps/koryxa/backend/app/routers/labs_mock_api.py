from __future__ import annotations

import os
import time
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Response


router = APIRouter(prefix="/labs/mock-api/v1", tags=["labs-mock-api"])


# In-memory rate limit (per process). Good enough for V1 training / demo.
_REQ_TS_BY_KEY: Dict[str, List[float]] = {}


def _now_ts() -> float:
    return time.time()


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _rate_limit_or_429(api_key: str, *, window_s: float = 1.0, max_requests: int = 1) -> None:
    now = _now_ts()
    ts = _REQ_TS_BY_KEY.get(api_key, [])
    ts = [t for t in ts if now - t <= window_s]
    if len(ts) >= max_requests:
        raise HTTPException(status_code=429, detail="Too Many Requests", headers={"Retry-After": "2"})
    ts.append(now)
    _REQ_TS_BY_KEY[api_key] = ts


@router.get("/transactions")
async def mock_transactions(
    response: Response,
    page: int = 1,
    page_size: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    country: Optional[str] = None,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> Dict[str, Any]:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key")

    expected = (os.getenv("KORYXA_LAB_API_KEY") or "").strip()
    if expected and x_api_key != expected:
        raise HTTPException(status_code=403, detail="Invalid API key")

    if page <= 0:
        raise HTTPException(status_code=422, detail="page must be >= 1")
    if page_size <= 0:
        raise HTTPException(status_code=422, detail="page_size must be >= 1")
    if page_size > 200:
        page_size = 200

    _rate_limit_or_429(x_api_key, window_s=1.0, max_requests=1)

    d0 = _parse_date(start_date) or date(2026, 1, 1)
    d1 = _parse_date(end_date) or date(2026, 1, 31)
    if d1 < d0:
        raise HTTPException(status_code=422, detail="end_date must be >= start_date")

    # Generate a deterministic, lightweight dataset (no DB).
    days = (d1 - d0).days + 1
    days = max(1, min(days, 366))

    countries = ["Togo", "Benin", "Ghana", "Senegal", "Nigeria"]
    if country:
        countries = [country]

    channels = ["facebook", "google", "whatsapp", "direct", "partner"]
    currencies = ["XOF", "USD", "EUR"]

    rows: List[Dict[str, Any]] = []
    # 20 tx/day/country => ~620 rows for Jan, enough to force pagination.
    per_day = 20
    for day_idx in range(days):
        day = d0.toordinal() + day_idx
        for c in countries:
            for i in range(per_day):
                tx_num = len(rows) + 1
                user_num = ((tx_num * 37) % 400) + 1
                amount = float(((tx_num * 91) % 9000) + 500) / 10.0
                created = datetime.fromtimestamp((day * 86400) + (i * 60 * 10), tz=timezone.utc)
                rows.append(
                    {
                        "tx_id": f"TX{tx_num:06d}",
                        "user_id": f"U{user_num:04d}",
                        "amount": amount,
                        "currency": currencies[tx_num % len(currencies)],
                        "created_at": _iso(created),
                        "country": c,
                        "channel": channels[tx_num % len(channels)],
                    }
                )

    total = len(rows)
    start = (page - 1) * page_size
    end = start + page_size
    results = rows[start:end] if start < total else []

    next_url = None
    if end < total:
        params = [
            f"page={page + 1}",
            f"page_size={page_size}",
            f"start_date={d0.isoformat()}",
            f"end_date={d1.isoformat()}",
        ]
        if country:
            params.append(f"country={country}")
        next_url = f"/labs/mock-api/v1/transactions?{'&'.join(params)}"

    response.headers["Cache-Control"] = "no-store"
    return {"page": page, "page_size": page_size, "next": next_url, "results": results}

