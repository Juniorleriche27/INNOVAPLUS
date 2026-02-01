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
import time
from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd
import MetaTrader5 as mt5
import sklearn.compose._column_transformer as ct
from sklearn.impute import SimpleImputer

from features_pipeline import (
    META_PATH,
    build_setups_for_ticker,
    session_label_training,
)
from score_signals import apply_filters
from mt5_execute import send_order, log_trade, record_trade_state, already_traded, init_mt5

BASE_DIR = Path(__file__).resolve().parent
OUT_FEAT = BASE_DIR / "features_live.parquet"
OUT_SIGNALS = BASE_DIR / "signals.parquet"
OUT_SIGNALS_CSV = BASE_DIR / "signals.csv"


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


def fetch_mt5_m5(symbol: str, days_back: int = 30) -> pd.DataFrame:
    utc_to = pd.Timestamp.utcnow()
    utc_from = utc_to - pd.Timedelta(days=days_back)
    rates = mt5.copy_rates_range(symbol, mt5.TIMEFRAME_M5, utc_from.to_pydatetime(), utc_to.to_pydatetime())
    if rates is None or len(rates) == 0:
        return pd.DataFrame()
    df = pd.DataFrame(rates)
    df["Datetime"] = pd.to_datetime(df["time"], unit="s", utc=True)
    df.rename(
        columns={
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "tick_volume": "volume",
        },
        inplace=True,
    )
    df["ticker"] = symbol
    return df[["Datetime", "ticker", "open", "high", "low", "close", "volume"]]


def build_features_from_mt5(symbols: List[str], days_back: int, meta: dict) -> pd.DataFrame:
    rows = []
    for sym in symbols:
        df = fetch_mt5_m5(sym, days_back=days_back)
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
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbols", required=True, help="Comma-separated MT5 symbols (e.g., EURUSD,GBPUSD)")
    parser.add_argument("--mode", default="SEL", choices=["SEL", "SELF"], help="Gating/filter mode")
    parser.add_argument("--thr", type=float, default=None, help="Threshold override; defaults to meta thr_default")
    parser.add_argument("--days", type=int, default=30, help="Days of M5 history to fetch from MT5")
    parser.add_argument("--interval", type=int, default=300, help="Loop interval in seconds")
    parser.add_argument("--lot", type=float, default=0.02, help="Lot size when trading is enabled")
    parser.add_argument("--terminal-path", type=str, default=None, help="Optional path to terminal64.exe if MT5 not auto-detected")
    parser.add_argument("--portable", action="store_true", help="Use MT5 portable mode (configs in terminal folder)")
    parser.add_argument("--timeout", type=int, default=60, help="MT5 IPC timeout (seconds)")
    parser.add_argument("--trade", dest="trade", action="store_true", help="Enable live execution")
    parser.add_argument("--no-trade", dest="trade", action="store_false", help="Disable live execution")
    parser.set_defaults(trade=False)
    args = parser.parse_args()

    symbols = [s.strip() for s in args.symbols.split(",") if s.strip()]
    meta = json.loads(META_PATH.read_text())
    feature_cols = meta["feature_cols"]
    thr_default = meta.get("thr_default", 0.8) if args.thr is None else args.thr
    filters = meta.get("filters", {})

    init_mt5(path=args.terminal_path, portable=args.portable, timeout=args.timeout)
    model = load_model(BASE_DIR / "smc_gate_model_v1.joblib")

    while True:
        feats = build_features_from_mt5(symbols, args.days, meta)
        if feats.empty:
            print("No features built; sleeping...")
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

        print(
            f"[{pd.Timestamp.utcnow()}] built {len(feats)} feats, "
            f"{signals['signal'].sum()} signals (mode={args.mode})"
        )

        if args.trade:
            for _, row in signals[signals["signal"] == 1].iterrows():
                trade_day = row.trade_day
                if not isinstance(trade_day, pd.Timestamp):
                    trade_day = pd.to_datetime(trade_day, utc=True)
                if already_traded(row.ticker, trade_day):
                    continue
                tick = mt5.symbol_info_tick(row.ticker)
                if tick is None:
                    continue
                price = tick.ask if row.entry_side == 1 else tick.bid
                resp = send_order(
                    symbol=row.ticker,
                    side=int(row.entry_side),
                    price=price,
                    sl=float(row.sl),
                    tp=float(row.tp),
                    lot=args.lot,
                )
                log_trade(row, resp, row.mode)
                if resp.get("retcode") == mt5.TRADE_RETCODE_DONE:
                    record_trade_state(row.ticker, trade_day)

        time.sleep(args.interval)


if __name__ == "__main__":
    import json  # placed here to avoid circular import during module load

    main()
