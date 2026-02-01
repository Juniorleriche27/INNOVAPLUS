"""
Minimal MT5 execution harness for signals produced by `score_signals.py`.

Features:
- Connects to a running MetaTrader5 terminal (must be installed & logged in).
- Fetches M5 candles from the broker (no yfinance dependency) for validation.
- Places market orders with fixed lot (default 0.02), SL/TP from signals.
- Guards to avoid duplicate trades: 1 trade per (ticker, trade_day).
- Logs all attempts and responses to `trades_log.csv`.

Usage:
    python mt5_execute.py --signals Modele_trading/signals.csv --lot 0.02 --mode SELF

Prereqs:
- `pip install MetaTrader5` on the machine where MT5 terminal is running.
- MT5 terminal must be open and connected to the desired account.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
from __future__ import annotations

import argparse
import logging
import time
from pathlib import Path
from typing import Optional

import pandas as pd

try:
    import MetaTrader5 as mt5
except ImportError as exc:  # pragma: no cover - informative failure
    raise SystemExit(
        "MetaTrader5 package not installed. Install with `pip install MetaTrader5` "
        "on the machine where the MT5 terminal runs."
    ) from exc

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_SIGNALS = BASE_DIR / "signals.csv"
LOG_PATH = BASE_DIR / "trades_log.csv"
STATE_PATH = BASE_DIR / "state" / "trade_state.csv"
MAGIC = 880042  # arbitrary magic number for strategy tagging


LOGGER = logging.getLogger("trading.mt5")


def _timeout_to_ms(timeout_seconds: int) -> int:
    # MetaTrader5.initialize(timeout=...) expects milliseconds.
    # We keep CLI as seconds for user-friendliness.
    return max(1000, int(timeout_seconds) * 1000)


def _mt5_ready(require_login: bool = True) -> tuple[bool, str]:
    term = mt5.terminal_info()
    if term is None:
        return False, "terminal_info unavailable"

    if require_login:
        acc = mt5.account_info()
        if acc is None:
            return False, "account_info unavailable (terminal not logged-in/connected?)"

    return True, "ok"


def init_mt5(
    *,
    path: Optional[str] = None,
    portable: bool = False,
    timeout: int = 60,
    max_retries: int = 10,
    retry_sleep: float = 2.0,
    require_login: bool = True,
) -> None:
    """
    Initialize MT5 terminal connection with retry/backoff.

    - If `path` is provided, MT5 is started/attached via that terminal executable.
    - If `path` is not provided, we try to attach to an already running terminal.

    If the terminal is not ready/logged-in yet, we retry with backoff and provide
    a clear error message at the end.
    """
    init_kw = {"portable": portable, "timeout": _timeout_to_ms(timeout)}
    if path:
        init_kw["path"] = path

    if not path:
        # We can only work without a path if the terminal is already running.
        # We still retry a few times because the terminal can be starting.
        LOGGER.info(
            "MT5 terminal path not provided; trying to attach to an already running terminal..."
        )

    last_err = None
    for attempt in range(1, max_retries + 1):
        ok = mt5.initialize(**init_kw)
        if ok:
            ready, reason = _mt5_ready(require_login=require_login)
            if ready:
                LOGGER.info("MT5 initialized and ready.")
                return
            last_err = ("READY_CHECK_FAILED", reason)
        else:
            last_err = mt5.last_error()

        # try to cleanup between attempts
        try:
            mt5.shutdown()
        except Exception:
            pass

        sleep_s = retry_sleep * (2 ** (attempt - 1))
        LOGGER.warning(
            "MT5 not ready (attempt %s/%s): %s. Retrying in %.1fs",
            attempt,
            max_retries,
            last_err,
            sleep_s,
        )
        time.sleep(sleep_s)

    if not path:
        raise SystemExit(
            "Impossible d'initialiser MT5 sans chemin du terminal. "
            "Ouvre MT5 (terminal) et connecte-toi, ou relance avec "
            "--terminal-path \".../terminal64.exe\"."
        )

    raise SystemExit(f"MT5 initialization failed after retries: {last_err}")


def ensure_symbol(symbol: str) -> bool:
    info = mt5.symbol_info(symbol)
    if info is None:
        return False
    if info.visible:
        return True
    return bool(mt5.symbol_select(symbol, True))


def already_traded(symbol: str, trade_day: pd.Timestamp) -> bool:
    """
    Check persistent state to avoid duplicate trades per symbol/day
    across restarts. Falls back to open positions if state missing.
    """
    state_exists = STATE_PATH.exists()
    if state_exists:
        state = pd.read_csv(STATE_PATH, parse_dates=["trade_day"])
        mask = (state["ticker"] == symbol) & (
            state["trade_day"].dt.normalize() == trade_day.normalize()
        )
        if mask.any():
            return True

    positions = mt5.positions_get(symbol=symbol)
    if positions is None:
        return False
    for p in positions:
        ts = pd.to_datetime(p.time_msc, unit="ms", utc=True).normalize()
        if ts == trade_day.normalize():
            return True
    return False


def record_trade_state(symbol: str, trade_day: pd.Timestamp) -> None:
    """Persist executed trade markers for idempotency across runs."""
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    row = pd.DataFrame(
        [{"ticker": symbol, "trade_day": trade_day.normalize()}]
    )
    if STATE_PATH.exists():
        row.to_csv(STATE_PATH, mode="a", header=False, index=False)
    else:
        row.to_csv(STATE_PATH, index=False)


def send_order(
    symbol: str,
    side: int,
    price: float,
    sl: float,
    tp: float,
    lot: float,
) -> dict:
    """Send a market order with SL/TP."""
    type_map = {1: mt5.ORDER_TYPE_BUY, -1: mt5.ORDER_TYPE_SELL}
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lot,
        "type": type_map[side],
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": MAGIC,
        "comment": "smc_gate_v1",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_FOK,
    }
    result = mt5.order_send(request)
    return {
        "retcode": result.retcode,
        "comment": result.comment,
        "order": result.order,
        "deal": result.deal,
        "request": request,
    }


def log_trade(row: pd.Series, response: dict, mode: str) -> None:
    """Append trade attempt to CSV log."""
    log_row = {
        "timestamp_utc": pd.Timestamp.utcnow(),
        "ticker": row.ticker,
        "entry_time": row.entry_time,
        "entry_side": row.entry_side,
        "entry_price": row.entry_price,
        "sl": row.sl,
        "tp": row.tp,
        "RR": row.RR,
        "p_tp": row.p_tp,
        "mode": mode,
        "retcode": response.get("retcode"),
        "comment": response.get("comment"),
        "order": response.get("order"),
        "deal": response.get("deal"),
    }
    df = pd.DataFrame([log_row])
    if LOG_PATH.exists():
        df.to_csv(LOG_PATH, mode="a", header=False, index=False)
    else:
        df.to_csv(LOG_PATH, index=False)


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)sZ %(levelname)s %(name)s - %(message)s",
    )
    parser = argparse.ArgumentParser()
    parser.add_argument("--signals", default=str(DEFAULT_SIGNALS), help="Path to signals.csv")
    parser.add_argument("--symbols", default=None, help="Optional comma-separated symbol allowlist")
    parser.add_argument("--lot", type=float, default=0.02, help="Fixed order volume")
    parser.add_argument("--mode", default=None, help="Filter to a specific mode (SEL/SELF), optional")
    parser.add_argument("--trade", dest="trade", action="store_true", help="Execute orders (default)")
    parser.add_argument("--no-trade", dest="trade", action="store_false", help="Dry-run (logs only, no orders)")
    parser.set_defaults(trade=True)
    parser.add_argument("--terminal-path", type=str, default=None, help="Path to terminal64.exe (required if MT5 not already running)")
    parser.add_argument("--portable", action="store_true", help="Use MT5 portable mode (configs in terminal folder)")
    parser.add_argument("--timeout", type=int, default=60, help="MT5 IPC timeout (seconds)")
    parser.add_argument("--max-retries", type=int, default=10, help="Max init retries")
    parser.add_argument("--retry-sleep", type=float, default=2.0, help="Base sleep seconds between retries (exponential backoff)")
    args = parser.parse_args()

    signals = pd.read_csv(args.signals, parse_dates=["trade_day", "entry_time"])
    if args.mode:
        signals = signals[signals["mode"].str.upper() == args.mode.upper()]
    if args.symbols:
        allow = {s.strip() for s in args.symbols.split(",") if s.strip()}
        signals = signals[signals["ticker"].isin(allow)]

    # keep only signaled trades
    signals = signals[signals["signal"] == 1]
    if signals.empty:
        raise SystemExit("No signals to execute.")

    init_mt5(
        path=args.terminal_path,
        portable=args.portable,
        timeout=args.timeout,
        max_retries=args.max_retries,
        retry_sleep=args.retry_sleep,
        require_login=True,
    )

    for _, row in signals.iterrows():
        trade_day = row.trade_day.tz_convert("UTC") if row.trade_day.tzinfo else row.trade_day.tz_localize("UTC")
        if already_traded(row.ticker, trade_day):
            continue

        if not ensure_symbol(row.ticker):
            LOGGER.warning("Symbol not available/visible in MT5: %s. Skipping.", row.ticker)
            continue

        tick = mt5.symbol_info_tick(row.ticker)
        if tick is None:
            print(f"Symbol info unavailable for {row.ticker}, skipping.")
            continue

        price = tick.ask if row.entry_side == 1 else tick.bid
        if args.trade:
            resp = send_order(
                symbol=row.ticker,
                side=int(row.entry_side),
                price=price,
                sl=float(row.sl),
                tp=float(row.tp),
                lot=args.lot,
            )
        else:
            resp = {"retcode": None, "comment": "dry-run", "order": None, "deal": None, "request": None}

        log_trade(row, resp, row.mode)
        if resp.get("retcode") == mt5.TRADE_RETCODE_DONE:
            record_trade_state(row.ticker, trade_day)
        print(row.ticker, row.entry_time, "retcode", resp["retcode"], "comment", resp["comment"])

    mt5.shutdown()


if __name__ == "__main__":
    main()
