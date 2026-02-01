"""
Thin wrapper: load M5 parquet, run the shared feature pipeline, and export
features_live.parquet plus diagnostics.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "nouvel_donnee_test" / "fx_m5_oldwindow_long.parquet"
META_PATH = BASE_DIR / "smc_gate_model_v1_meta.json"
OUT_PARQUET = BASE_DIR / "features_live.parquet"

from features_pipeline import build_setups_for_ticker, session_label_training


def main():
    meta = json.loads(META_PATH.read_text())
    feature_cols = meta["feature_cols"]

    raw = pd.read_parquet(DATA_PATH)
    raw["Datetime"] = pd.to_datetime(raw["Datetime"], utc=True)
    raw = raw.sort_values(["ticker", "Datetime"])

    rows: List[Dict] = []
    asia_counts = []
    for ticker, g in raw.groupby("ticker"):
        g = g.reset_index(drop=True)
        # Diagnostic: Asia bars count per day
        dates = pd.to_datetime(g["Datetime"]).dt.date.unique()
        for day in dates:
            day_ts = pd.Timestamp(day).tz_localize("UTC")
            asia_start = (day_ts - pd.Timedelta(days=1)) + pd.Timedelta(hours=21)
            asia_end = day_ts + pd.Timedelta(hours=7)
            n_asia = g[(g["Datetime"] >= asia_start) & (g["Datetime"] < asia_end)].shape[0]
            asia_counts.append(n_asia)
        rows.extend(build_setups_for_ticker(g, meta))

    feats = pd.DataFrame(rows)
    if feats.empty:
        raise SystemExit("No setups generated from the provided data.")

    # Ensure column order and presence
    missing = [c for c in feature_cols if c not in feats.columns]
    extra = [c for c in feats.columns if c not in feature_cols + ["ticker", "trade_day", "entry_time", "entry_price", "sl", "tp"]]

    feats.to_parquet(OUT_PARQUET, index=False)

    print("features_live.parquet saved:", OUT_PARQUET)
    print("X_live.shape:", feats[feature_cols].shape)
    print("missing_cols:", missing)
    if extra:
        print("extra_cols (kept for reference):", extra)
    print(feats[["ticker", "entry_time", "entry_side", "RR"]].head(10))

    # Diagnostics requested
    if asia_counts:
        asia_series = pd.Series(asia_counts)
        print("Asia bar count (should be 120): min/med/max", asia_series.min(), asia_series.median(), asia_series.max())
    else:
        print("No Asia count diagnostics available.")

    # trade_end constant for info
    print("Trading window end (expected 15:45 UTC).")

    # mins_to_break stats
    if "mins_to_break" in feats:
        mtb = feats["mins_to_break"].dropna()
        if not mtb.empty:
            print("mins_to_break stats (min/med/max):", mtb.min(), mtb.median(), mtb.max())

    # RR audit: recompute from entry_price/sl/tp
    if {"entry_price", "sl", "tp", "RR"}.issubset(feats.columns):
        rr_recalc = (feats["tp"] - feats["entry_price"]).abs() / (feats["entry_price"] - feats["sl"]).abs().replace(0, np.nan)
        diff = (rr_recalc - feats["RR"]).abs().dropna()
        if not diff.empty:
            print("RR audit |diff|: min/med/max", diff.min(), diff.median(), diff.max())


if __name__ == "__main__":
    main()
