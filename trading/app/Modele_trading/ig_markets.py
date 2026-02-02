from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from ig_client import IGSession, IGError


@dataclass(frozen=True)
class IGMarket:
    epic: str
    instrument_name: str
    instrument_type: Optional[str] = None
    expiry: Optional[str] = None
    currency_code: Optional[str] = None


def search_markets(session: IGSession, search_term: str) -> list[IGMarket]:
    # IG "markets" search endpoint
    r = session.request("GET", "/markets", params={"searchTerm": search_term}, version="1")
    if r.status_code != 200:
        raise IGError(f"IG markets search failed ({search_term}): {r.status_code} {r.text[:300]}")
    data: dict[str, Any] = r.json()
    markets = data.get("markets") or []
    out: list[IGMarket] = []
    for m in markets:
        instrument = m.get("instrument") or {}
        out.append(
            IGMarket(
                epic=str(m.get("epic") or ""),
                instrument_name=str(instrument.get("name") or ""),
                instrument_type=(instrument.get("type") or None),
                expiry=(m.get("expiry") or None),
                currency_code=(m.get("currency") or None),
            )
        )
    return [m for m in out if m.epic]


def pick_best_epic(pair: str, markets: list[IGMarket]) -> Optional[str]:
    """
    Heuristics for FX majors/minors:
    - Prefer CFD IP pattern if present (common on IG): CS.D.<PAIR>.CFD.IP
    - Else prefer anything containing the pair and '.CFD.'
    - Else first match.
    """
    pair_u = pair.replace("=X", "").upper()
    preferred = f"CS.D.{pair_u}.CFD.IP"
    for m in markets:
        if m.epic.upper() == preferred:
            return m.epic
    for m in markets:
        epic_u = m.epic.upper()
        if pair_u in epic_u and ".CFD." in epic_u:
            return m.epic
    for m in markets:
        if pair_u in (m.instrument_name or "").upper():
            return m.epic
    return markets[0].epic if markets else None

