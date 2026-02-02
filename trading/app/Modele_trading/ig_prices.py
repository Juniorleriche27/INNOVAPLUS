from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from ig_client import IGSession, IGError


@dataclass(frozen=True)
class OHLCV:
    df: pd.DataFrame


def _mid(bid: Any, ask: Any) -> float:
    if bid is None and ask is None:
        return float("nan")
    if bid is None:
        return float(ask)
    if ask is None:
        return float(bid)
    return (float(bid) + float(ask)) / 2.0


def fetch_m5_prices(session: IGSession, epic: str, max_points: int = 9000) -> pd.DataFrame:
    """
    Fetch historical M5 prices from IG and return a DataFrame in the model format:
    Datetime (UTC), ticker, open, high, low, close, volume
    """
    # IG uses resolution like MINUTE_5
    params = {"resolution": "MINUTE_5", "max": str(int(max_points))}
    r = session.request("GET", f"/prices/{epic}", params=params, version="3")
    if r.status_code != 200:
        raise IGError(f"IG prices failed ({epic}): {r.status_code} {r.text[:300]}")
    data = r.json()
    prices = data.get("prices") or []
    rows = []
    for p in prices:
        t = p.get("snapshotTimeUTC") or p.get("snapshotTime")
        if not t:
            continue
        open_p = p.get("openPrice", {})
        high_p = p.get("highPrice", {})
        low_p = p.get("lowPrice", {})
        close_p = p.get("closePrice", {})
        vol = p.get("lastTradedVolume")
        rows.append(
            {
                "Datetime": pd.to_datetime(t, utc=True),
                "open": _mid(open_p.get("bid"), open_p.get("ask")),
                "high": _mid(high_p.get("bid"), high_p.get("ask")),
                "low": _mid(low_p.get("bid"), low_p.get("ask")),
                "close": _mid(close_p.get("bid"), close_p.get("ask")),
                "volume": float(vol) if vol is not None else 0.0,
            }
        )
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df = df.sort_values("Datetime").reset_index(drop=True)
    return df

