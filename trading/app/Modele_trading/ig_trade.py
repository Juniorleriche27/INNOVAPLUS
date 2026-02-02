from __future__ import annotations

import uuid
from typing import Any, Optional

from ig_client import IGSession, IGError


def place_market_order(
    session: IGSession,
    *,
    epic: str,
    direction: str,  # BUY / SELL
    size: float,
    stop_level: Optional[float] = None,
    limit_level: Optional[float] = None,
    force_open: bool = True,
    currency_code: Optional[str] = None,
    comment: str = "algo",
) -> dict[str, Any]:
    """
    Places a simple OTC market order.
    NOTE: IG instrument sizing differs from MT5 "lots". Validate size on DEMO first.
    """
    payload: dict[str, Any] = {
        "epic": epic,
        "expiry": "-",
        "direction": direction.upper(),
        "size": float(size),
        "orderType": "MARKET",
        "forceOpen": bool(force_open),
        "guaranteedStop": False,
        "timeInForce": "FILL_OR_KILL",
        "dealReference": uuid.uuid4().hex[:30],
    }
    if currency_code:
        payload["currencyCode"] = currency_code
    if stop_level is not None:
        payload["stopLevel"] = float(stop_level)
    if limit_level is not None:
        payload["limitLevel"] = float(limit_level)

    r = session.request("POST", "/positions/otc", json_body=payload, version="2")
    if r.status_code not in (200, 201, 202):
        raise IGError(f"IG order failed ({epic}): {r.status_code} {r.text[:300]}")
    return r.json()

