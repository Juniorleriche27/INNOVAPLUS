from __future__ import annotations

import argparse
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import pandas as pd
import sklearn.compose._column_transformer as ct
from sklearn.impute import SimpleImputer

from features_pipeline import META_PATH, build_setups_for_ticker
from ig_client import session_from_env
from ig_prices import fetch_m5_prices
from ig_trade import place_market_order
from score_signals import apply_filters


BASE_DIR = Path(__file__).resolve().parent
LOGGER = logging.getLogger("trading.ig")

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


def load_epic_map(path: Path) -> Dict[str, Optional[str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    tickers = data.get("tickers") or {}
    return {str(k): (str(v) if v is not None else None) for k, v in tickers.items()}


def build_features_from_ig(symbols: List[str], epic_map: Dict[str, Optional[str]], session, meta: dict) -> pd.DataFrame:
    rows = []
    for ticker in symbols:
        epic = epic_map.get(ticker)
        if not epic:
            continue
        df = fetch_m5_prices(session, epic=epic, max_points=9000)
        if df.empty:
            continue
        df["ticker"] = ticker
        rows.extend(build_setups_for_ticker(df[["Datetime", "ticker", "open", "high", "low", "close", "volume"]], meta))
    feats = pd.DataFrame(rows)
    if feats.empty:
        return feats
    feats.to_parquet(OUT_FEAT, index=False)
    return feats


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)sZ %(levelname)s %(name)s - %(message)s")
    p = argparse.ArgumentParser()
    p.add_argument("--symbols", required=True, help="Comma-separated tickers (training format, e.g. EURUSD=X,GBPUSD=X)")
    p.add_argument("--epics", default=str(BASE_DIR / "ig_epics_template.json"), help="Path to IG epics mapping JSON")
    p.add_argument("--mode", default="SELF", choices=["SEL", "SELF"])
    p.add_argument("--thr", type=float, default=None)
    p.add_argument("--interval", type=int, default=60)
    p.add_argument("--size", type=float, default=1.0, help="IG order size (NOT MT5 lots). Test on DEMO first.")
    p.add_argument("--trade", dest="trade", action="store_true")
    p.add_argument("--no-trade", dest="trade", action="store_false")
    p.add_argument("--once", action="store_true")
    p.set_defaults(trade=False)
    args = p.parse_args()

    raw_symbols = [s.strip() for s in args.symbols.split(",") if s.strip()]
    # Accept both "EURUSD" and "EURUSD=X"
    symbols = [s if "=" in s else f"{s}=X" for s in raw_symbols]
    epic_map = load_epic_map(Path(args.epics))

    meta = json.loads(META_PATH.read_text())
    feature_cols = meta["feature_cols"]
    thr_default = meta.get("thr_default", 0.8) if args.thr is None else args.thr
    filters = meta.get("filters", {})

    session = session_from_env()
    session.login()
    LOGGER.info("IG login OK (env=%s, account_id=%s).", session.env, session.account_id or "unknown")

    model = load_model(BASE_DIR / "smc_gate_model_v1.joblib")

    while True:
        feats = build_features_from_ig(symbols, epic_map, session, meta)
        if feats.empty:
            LOGGER.warning("No features built (check epics mapping / market availability).")
            if args.once:
                return
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

        LOGGER.info("Built %s feats, %s signals (mode=%s).", len(feats), int(signals["signal"].sum()), args.mode)

        if args.trade:
            for _, row in signals[signals["signal"] == 1].iterrows():
                ticker = str(row.ticker)
                epic = epic_map.get(ticker)
                if not epic:
                    continue
                direction = "BUY" if int(row.entry_side) == 1 else "SELL"
                # Use model SL/TP levels directly as absolute prices
                resp = place_market_order(
                    session,
                    epic=epic,
                    direction=direction,
                    size=float(args.size),
                    stop_level=float(row.sl),
                    limit_level=float(row.tp),
                    comment=str(row.mode),
                )
                LOGGER.info("Order %s %s -> %s", direction, epic, resp)

        if args.once:
            return
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
