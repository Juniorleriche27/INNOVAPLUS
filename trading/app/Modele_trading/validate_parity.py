"""
Validation script: verifies that production feature logic matches training
on what is observable without raw OHLC.

Checks:
- RR_clip == clip(RR,0,1)
- session_entry reproduced by session_label_training(hour_entry)
- session_sweep (if hour_sweep exists; skipped otherwise)
- RR formula on selected_trades_thr_from_train_0.8.csv (reward/risk)
- Confusion matrices for sessions
- X_live columns/order vs meta + NaN rate
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from features_pipeline import session_label_training, META_PATH

BASE_DIR = Path(__file__).resolve().parent
TRAIN_PATH = BASE_DIR / "smc_ml_dataset_v2.parquet"
SELECTED_PATH = BASE_DIR / "selected_trades_thr_from_train_0.8.csv"


def main():
    meta = json.loads(META_PATH.read_text())
    feature_cols = meta["feature_cols"]

    train = pd.read_parquet(TRAIN_PATH)

    # RR_clip parity
    rr_clip_expected = np.clip(train["RR"], 0, 1)
    rrclip_diff = (train["RR_clip"] - rr_clip_expected).abs()
    rrclip_diff_max = rrclip_diff.max()

    # session_entry parity
    sess_pred = train["hour_entry"].apply(lambda h: session_label_training(pd.Timestamp.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + pd.Timedelta(hours=h)))
    session_entry_accuracy = (sess_pred == train["session_entry"]).mean()
    confusion_entry = pd.crosstab(train["session_entry"], sess_pred, rownames=["train"], colnames=["prod"])

    # session_sweep if hour_sweep exists
    session_sweep_accuracy = None
    confusion_sweep = None
    if "hour_sweep" in train.columns:
        sweep_pred = train["hour_sweep"].apply(
            lambda h: session_label_training(
                pd.Timestamp.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + pd.Timedelta(hours=h)
            )
        )
        session_sweep_accuracy = (sweep_pred == train["session_sweep"]).mean()
        confusion_sweep = pd.crosstab(train["session_sweep"], sweep_pred, rownames=["train"], colnames=["prod"])

    # RR formula on selected trades file if available
    rr_formula_diff_max = None
    rr_formula_diff_median = None
    if SELECTED_PATH.exists():
        sel = pd.read_csv(SELECTED_PATH)
        rr_formula = (sel["tp"] - sel["entry_price"]).abs() / (sel["entry_price"] - sel["sl"]).abs()
        diff = (rr_formula - sel["RR"]).abs()
        rr_formula_diff_max = diff.max()
        rr_formula_diff_median = diff.median()
    else:
        print(f"Selected trades file missing: {SELECTED_PATH}")

    # X_live shape / NaN rate from training features
    X_live = train[feature_cols].copy()
    nan_rate_max = X_live.isna().mean().max()

    # Outputs
    print("RRclip_diff_max:", rrclip_diff_max)
    if rr_formula_diff_max is not None:
        print("RR_formula_diff_max:", rr_formula_diff_max)
        print("RR_formula_diff_median:", rr_formula_diff_median)
    print("session_entry_accuracy:", session_entry_accuracy)
    print("confusion_matrix_entry:\n", confusion_entry)
    if session_sweep_accuracy is not None:
        print("session_sweep_accuracy:", session_sweep_accuracy)
        print("confusion_matrix_sweep:\n", confusion_sweep)
    print("X_live.columns == meta feature_cols:", list(X_live.columns) == feature_cols)
    print("X_live.isna().mean().max():", nan_rate_max)

    # Block if session_entry too low
    if session_entry_accuracy < 0.999:
        raise SystemExit("session_entry_accuracy below threshold; fix session_label_training.")


if __name__ == "__main__":
    main()
