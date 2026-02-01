"""
Score live features with `smc_gate_model_v1`, apply gating threshold and
optional filters, and export signals.

Usage:
    python score_signals.py --mode SEL
    python score_signals.py --mode SELF --thr 0.8

Modes:
    SEL  : apply gating threshold only.
    SELF : apply gating threshold + training filters (F2 no NY->NY, F3 min RR).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn.compose._column_transformer as ct
from sklearn.impute import SimpleImputer

BASE_DIR = Path(__file__).resolve().parent
FEAT_PATH = BASE_DIR / "features_live.parquet"
META_PATH = BASE_DIR / "smc_gate_model_v1_meta.json"
MODEL_PATH = BASE_DIR / "smc_gate_model_v1.joblib"
OUT_CSV = BASE_DIR / "signals.csv"
OUT_PARQUET = BASE_DIR / "signals.parquet"


def load_model(model_path: Path):
    """Load sklearn pipeline with compatibility patches for older pickles."""
    ct._RemainderColsList = type("_RemainderColsList", (list,), {})
    model = joblib.load(model_path)

    def _patch_imputer(imputer: SimpleImputer):
        if not hasattr(imputer, "_fill_dtype"):
            setattr(imputer, "_fill_dtype", getattr(imputer, "_fit_dtype", None))

    for _name, step in model.steps:
        if hasattr(step, "transformers_"):
            for _tname, pipe, _cols in step.transformers_:
                if hasattr(pipe, "steps"):
                    for _pname, sub in pipe.steps:
                        if isinstance(sub, SimpleImputer):
                            _patch_imputer(sub)
    return model


def apply_filters(df: pd.DataFrame, filters: dict, mode: str) -> pd.DataFrame:
    """Apply optional training-time filters when mode == SELF."""
    if mode.upper() != "SELF":
        return df
    out = df.copy()
    if filters.get("F2_no_NY_to_NY", False):
        out = out[~((out["session_sweep"] == "NY") & (out["session_entry"] == "NY"))]
    min_rr = filters.get("F3_min_RR")
    if min_rr is not None:
        out = out[out["RR_clip"] >= min_rr]
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", default="SEL", choices=["SEL", "SELF"], help="Filtering mode.")
    parser.add_argument("--thr", type=float, default=None, help="Override threshold; defaults to meta thr_default.")
    args = parser.parse_args()

    meta = json.loads(META_PATH.read_text())
    feature_cols = meta["feature_cols"]
    thr_default = meta.get("thr_default", 0.8) if args.thr is None else args.thr

    feats = pd.read_parquet(FEAT_PATH)
    X = feats[feature_cols]

    missing = [c for c in feature_cols if c not in feats.columns]
    if missing:
        raise SystemExit(f"Missing required feature columns: {missing}")

    model = load_model(MODEL_PATH)
    proba = model.predict_proba(X)[:, 1]

    signals = feats.copy()
    signals["p_tp"] = proba
    signals["signal"] = (signals["p_tp"] >= thr_default).astype(int)
    signals["mode"] = args.mode.upper()

    # Apply filters if SELF
    signals = apply_filters(signals, meta.get("filters", {}), args.mode)

    signals = signals[
        [
            "ticker",
            "trade_day",
            "entry_time",
            "entry_price",
            "sl",
            "tp",
            "entry_side",
            "RR",
            "RR_clip",
            "mins_to_break",
            "mins_break_to_entry",
            "asia_range",
            "asia_range_atr",
            "sweep_ATR14_M5",
            "entry_ATR14_M5",
            "session_entry",
            "session_sweep",
            "sweep_side",
            "hour_entry",
            "dow",
            "p_tp",
            "signal",
            "mode",
        ]
    ]

    signals.to_csv(OUT_CSV, index=False)
    signals.to_parquet(OUT_PARQUET, index=False)

    print("X_live.shape:", X.shape)
    print("missing_cols:", [])
    print(signals[["ticker", "entry_time", "entry_side", "RR", "p_tp"]].head(10))
    print("signals.shape:", signals.shape)
    print(f"signals saved to {OUT_CSV} and {OUT_PARQUET}")


if __name__ == "__main__":
    main()
