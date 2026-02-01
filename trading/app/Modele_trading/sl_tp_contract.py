"""
Single source of truth for SL/TP/RR used across the pipeline.

Training rule (validated):
- SL = sweep_extreme (high if sweep high, low if sweep low)
- TP = opposite Asia bound (asia_high for long, asia_low for short)
- RR = reward / risk = abs(tp - entry_price) / abs(entry_price - sl)
- RR_clip = clip(RR, 0, 1)
"""

from __future__ import annotations

from typing import Tuple

import numpy as np


def compute_sl_tp(
    entry_side: int,
    entry_price: float,
    asia_high: float,
    asia_low: float,
    sweep_extreme: float,
) -> Tuple[float, float, float, float]:
    """
    Must match training definition:
    - SL = sweep_extreme
    - TP = opposite Asia bound (asia_high for long, asia_low for short)
    - RR = reward / risk (reward toward TP, risk toward SL)
    Returns: (sl, tp, rr, rr_clip)
    """
    sl = sweep_extreme
    if entry_side == 1:  # long
        tp = asia_high
    else:  # short
        tp = asia_low

    risk = abs(entry_price - sl)
    reward = abs(tp - entry_price)
    risk = max(risk, 1e-12)
    rr = reward / risk
    rr_clip = float(np.clip(rr, 0.0, 1.0))
    return sl, tp, rr, rr_clip


__all__ = ["compute_sl_tp"]
