"""
Live loop to fetch M5 candles from MT5, rebuild features with the
training-accurate pipeline, score signals, and (optionally) execute trades.

Key points:
- Uses the same feature builder as live_features.py (imported functions).
- Sessions/ATR/RR definitions match training.
- Persistent state prevents duplicate trades per ticker/day (shared with mt5_execute).

Usage examples:
  python live_loop_mt5.py --symbols EURUSD,GBPUSD --mode SELF --lot 0.02 --interval 300
  python live_loop_mt5.py --symbols AUDCAD=X --no-trade   (only produces signals)
"""

from __future__ import annotations

import argparse
import logging
import time
from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd
import sklearn.compose._column_transformer as ct
from sklearn.impute import SimpleImputer

from features_pipeline import (
    META_PATH,
    build_setups_for_ticker,
    session_label_training,
)
from score_signals import apply_filters

from bridge_io import default_common_files_dir, bridge_rates_path, submit_order, wait_result

BASE_DIR = Path(__file__).resolve().parent
OUT_FEAT = BASE_DIR / "features_live.parquet"
OUT_SIGNALS = BASE_DIR / "signals.parquet"
OUT_SIGNALS_CSV = BASE_DIR / "signals.csv"
LOGGER = logging.getLogger("trading.live_loop")


def load_model(path: Path):
    ct._RemainderColsList = type("_RemainderColsList", (list,), {})
    model = joblib.load(path)

    def _patch(imputer: SimpleImputer):
        if not hasattr(imputer, "_fill_dtype"):
            setattr(imputer, "_fill_dtype", getattr(imputer, "_fit_dtype", None))

    for _n, step in model.steps:
        if hasattr(step, "transformers_"):
            for _t, pipe, _c in step.transformers_:
                if hasattr(pipe, "steps"):
                    for _pn, sub in pipe.steps:
                        if isinstance(sub, SimpleImputer):
                            _patch(sub)
    return model


def fetch_m5_from_bridge(common_dir: Path, symbol: str) -> pd.DataFrame:
    """
    Reads M5 candles exported by BridgeEA in MT5 Common\\Files:
    bridge_m5_<SYMBOL>.csv with columns: time,open,high,low,close,tick_volume
    """
    path = bridge_rates_path(common_dir, symbol)
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path)
    if df.empty:
        return df
    df["Datetime"] = pd.to_datetime(df["time"], unit="s", utc=True)
    df.rename(columns={"tick_volume": "volume"}, inplace=True)
    df["ticker"] = symbol
    return df[["Datetime", "ticker", "open", "high", "low", "close", "volume"]]


def build_features_from_bridge(symbols: List[str], common_dir: Path, meta: dict) -> pd.DataFrame:
    rows = []
    for sym in symbols:
        df = fetch_m5_from_bridge(common_dir, sym)
        if df.empty:
            continue
        df = df.sort_values("Datetime").reset_index(drop=True)
        rows.extend(build_setups_for_ticker(df, meta))
    feats = pd.DataFrame(rows)
    if feats.empty:
        return feats
    feats.to_parquet(OUT_FEAT, index=False)
    return feats


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)sZ %(levelname)s %(name)s - %(message)s",
    )
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbols", required=True, help="Comma-separated MT5 symbols (e.g., EURUSD,GBPUSD)")
    parser.add_argument("--mode", default="SEL", choices=["SEL", "SELF"], help="Gating/filter mode")
    parser.add_argument("--thr", type=float, default=None, help="Threshold override; defaults to meta thr_default")
    parser.add_argument("--interval", type=int, default=300, help="Loop interval in seconds")
    parser.add_argument("--lot", type=float, default=0.02, help="Lot size when trading is enabled")
    parser.add_argument("--common-files-dir", type=str, default=None, help="MT5 Common\\\\Files directory (bridge)")
    parser.add_argument("--confirm-timeout", type=int, default=5, help="Seconds to wait for EA confirmation")
    parser.add_argument("--trade", dest="trade", action="store_true", help="Enable live execution")
    parser.add_argument("--no-trade", dest="trade", action="store_false", help="Disable live execution")
    parser.add_argument("--once", action="store_true", help="Run a single cycle then exit (useful for cron)")
    parser.set_defaults(trade=False)
    args = parser.parse_args()

    symbols = [s.strip() for s in args.symbols.split(",") if s.strip()]
    meta = json.loads(META_PATH.read_text())
    feature_cols = meta["feature_cols"]
    thr_default = meta.get("thr_default", 0.8) if args.thr is None else args.thr
    filters = meta.get("filters", {})

    common_dir = Path(args.common_files_dir) if args.common_files_dir else default_common_files_dir()
    LOGGER.info("Bridge Common\\Files: %s", common_dir)
    model = load_model(BASE_DIR / "smc_gate_model_v1.joblib")

    while True:
        feats = build_features_from_bridge(symbols, common_dir, meta)
        if feats.empty:
            LOGGER.info("No features built.")
            if args.once:
                return
            LOGGER.info("Sleeping %ss...", args.interval)
            time.sleep(args.interval)
            continue

        X = feats[feature_cols]
        proba = model.predict_proba(X)[:, 1]
        signals = feats.copy()
        signals["p_tp"] = proba
        signals["signal"] = (signals["p_tp"] >= thr_default).astype(int)
        signals["mode"] = args.mode

        signals = apply_filters(signals, filters, args.mode)

        signals.to_parquet(OUT_SIGNALS, index=False)
        signals.to_csv(OUT_SIGNALS_CSV, index=False)

        LOGGER.info(
            "Built %s feats, %s signals (mode=%s)",
            len(feats),
            int(signals["signal"].sum()),
            args.mode,
        )

        if args.trade:
            for _, row in signals[signals["signal"] == 1].iterrows():
                action = "BUY" if int(row.entry_side) == 1 else "SELL"
                cmd_id = submit_order(
                    common_dir=common_dir,
                    action=action,
                    symbol=str(row.ticker),
                    lot=float(args.lot),
                    sl=float(row.sl),
                    tp=float(row.tp),
                    comment=str(row.mode),
                )
                res = wait_result(common_dir, cmd_id, timeout_s=args.confirm_timeout)
                if res is None:
                    LOGGER.warning("No EA confirmation for %s (%s %s).", cmd_id, action, row.ticker)
                else:
                    LOGGER.info("EA result %s ok=%s ret=%s ticket=%s msg=%s", cmd_id, res.ok, res.retcode, res.ticket, res.msg)

        if args.once:
            return

        time.sleep(args.interval)


if __name__ == "__main__":
    import json  # placed here to avoid circular import during module load

    main()
