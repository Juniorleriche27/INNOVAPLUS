"""
Reusable feature pipeline matching training logic for smc_gate_model_v1.
Contains the only implementations for:
- Asia window detection
- sweep / break / retest setup building
- session labeling (training-accurate)
- SL/TP/RR computation
- feature matrix construction (14 cols in meta order)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd

from sl_tp_contract import compute_sl_tp

BASE_DIR = Path(__file__).resolve().parent
META_PATH = BASE_DIR / "smc_gate_model_v1_meta.json"


def session_label_training(ts: pd.Timestamp) -> str:
    """
    Session mapping EXACT match to training labels (validated):
    London: 08:30 -> 11:58 (11.9666667h)
    Other : 11:58 -> 12:55 (12.9166667h)
    NY    : 12:55 -> end
    Else  : Other
    """
    h = ts.hour + ts.minute / 60.0
    if 8.5 <= h < 11.966666666666667:
        return "London"
    if 11.966666666666667 <= h < 12.916666666666668:
        return "Other"
    if h >= 12.916666666666668:
        return "NY"
    return "Other"


def compute_atr_wilder(df: pd.DataFrame, window: int = 14) -> pd.Series:
    high = df["high"]
    low = df["low"]
    close = df["close"]
    prev_close = close.shift(1)
    tr = pd.concat(
        [
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return tr.ewm(alpha=1 / window, adjust=False, min_periods=window).mean()


def build_asia_tbl_from_m5(df: pd.DataFrame) -> List[Dict]:
    """
    Build Asia ranges per trade day.
    Asia window: 21:00 (prev day) -> 07:00 (day).
    Assumes df sorted and tz-aware UTC.
    """
    asia_rows = []
    all_days = pd.to_datetime(df["Datetime"]).dt.date.unique()
    for day in all_days:
        day_ts = pd.Timestamp(day).tz_localize("UTC")
        asia_start = (day_ts - pd.Timedelta(days=1)) + pd.Timedelta(hours=21)
        asia_end = day_ts + pd.Timedelta(hours=7)
        asia_df = df[(df["Datetime"] >= asia_start) & (df["Datetime"] < asia_end)]
        if asia_df.empty:
            continue
        asia_rows.append(
            dict(
                trade_day=day_ts,
                asia_start=asia_start,
                asia_end=asia_end,
                asia_high=asia_df["high"].max(),
                asia_low=asia_df["low"].min(),
                asia_atr=asia_df["ATR14"].iloc[-1],
            )
        )
    return asia_rows


def first_sweep(after_df: pd.DataFrame, asia_high: float, asia_low: float):
    breaks_high = after_df["high"] >= asia_high
    breaks_low = after_df["low"] <= asia_low
    both = pd.concat([breaks_high, breaks_low], axis=1)
    if not both.any().any():
        return None
    idx = both.any(axis=1).idxmax()
    row = after_df.loc[idx]
    if row["high"] >= asia_high and (row["low"] <= asia_low):
        side = 1 if (row["high"] - row["open"]) >= (row["open"] - row["low"]) else -1
    elif row["high"] >= asia_high:
        side = 1
    else:
        side = -1
    sweep_price = row["high"] if side == 1 else row["low"]
    return idx, row, side, sweep_price


def find_break(after_sweep_df: pd.DataFrame, asia_high: float, asia_low: float, side: int):
    if side == 1:
        mask = after_sweep_df["close"] <= asia_high
    else:
        mask = after_sweep_df["close"] >= asia_low
    if not mask.any():
        return None
    idx = mask.idxmax()
    row = after_sweep_df.loc[idx]
    return idx, row


def find_retest(after_break_df: pd.DataFrame, sweep_price: float, side: int, max_bars: int = 12):
    window = after_break_df.iloc[:max_bars]
    if side == 1:
        mask = window["high"] >= sweep_price
    else:
        mask = window["low"] <= sweep_price
    if not mask.any():
        return None
    idx = mask.idxmax()
    return idx, window.loc[idx]


def build_setups_for_ticker(df: pd.DataFrame, meta: Dict) -> List[Dict]:
    """
    From M5 OHLC for a single ticker, build setup rows with full info.
    Returns list of dicts including the 14 feature fields + metadata.
    """
    out: List[Dict] = []
    df = df.copy()
    df["ATR14"] = compute_atr_wilder(df)
    df = df.dropna(subset=["ATR14"])

    asia_tbl = build_asia_tbl_from_m5(df)
    trade_end_offset = pd.Timedelta(hours=15, minutes=45)
    for asia_row in asia_tbl:
        trade_day = asia_row["trade_day"]
        asia_high = asia_row["asia_high"]
        asia_low = asia_row["asia_low"]
        asia_atr = asia_row["asia_atr"]
        trade_start = asia_row["asia_end"]  # 07:00
        trade_end = trade_day + trade_end_offset

        after_asia = df[(df["Datetime"] >= trade_start) & (df["Datetime"] <= trade_end)]
        if after_asia.empty:
            continue

        sweep_info = first_sweep(after_asia, asia_high, asia_low)
        if sweep_info is None:
            continue
        sweep_idx, sweep_row, sweep_side, sweep_price = sweep_info
        sweep_ts = sweep_row["Datetime"]
        sweep_session = session_label_training(sweep_ts)

        after_sweep = after_asia.loc[sweep_idx:]
        break_info = find_break(after_sweep.iloc[1:], asia_high, asia_low, sweep_side)
        if break_info is None:
            continue
        break_idx, break_row = break_info
        break_ts = break_row["Datetime"]

        after_break = after_sweep.loc[break_idx:]
        retest_info = find_retest(after_break.iloc[1:], sweep_price, sweep_side, max_bars=12)
        if retest_info is None:
            entry_idx, entry_row = break_idx, break_row
        else:
            entry_idx, entry_row = retest_info

        entry_ts = entry_row["Datetime"]
        entry_session = session_label_training(entry_ts)
        mins_to_break = (break_ts - sweep_ts).total_seconds() / 60
        mins_break_to_entry = (entry_ts - break_ts).total_seconds() / 60

        entry_side = -1 if sweep_side == 1 else 1
        entry_price = break_row["close"]  # limit-at-reclaim

        sl, tp, rr, rr_clip = compute_sl_tp(entry_side, entry_price, asia_high, asia_low, sweep_price)

        out.append(
            dict(
                ticker=df["ticker"].iloc[0],
                trade_day=trade_day,
                entry_time=entry_ts,
                entry_price=entry_price,
                sl=sl,
                tp=tp,
                RR=rr,
                RR_clip=rr_clip,
                entry_side=entry_side,
                mins_to_break=mins_to_break,
                mins_break_to_entry=mins_break_to_entry,
                asia_range=asia_high - asia_low,
                asia_range_atr=(asia_high - asia_low) / asia_atr if asia_atr else np.nan,
                sweep_ATR14_M5=sweep_row["ATR14"],
                entry_ATR14_M5=entry_row["ATR14"],
                session_entry=entry_session,
                session_sweep=sweep_session,
                sweep_side=sweep_side,
                hour_entry=entry_ts.hour + entry_ts.minute / 60,
                dow=entry_ts.weekday(),
            )
        )
    return out


def make_feature_matrix(setups: pd.DataFrame) -> pd.DataFrame:
    meta = json.loads(META_PATH.read_text())
    cols = meta["feature_cols"]
    return setups[cols].copy()


__all__ = [
    "session_label_training",
    "compute_atr_wilder",
    "build_asia_tbl_from_m5",
    "build_setups_for_ticker",
    "make_feature_matrix",
    "META_PATH",
]
