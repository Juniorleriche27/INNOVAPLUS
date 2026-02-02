from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import pandas as pd


def default_common_files_dir() -> Path:
    env = os.getenv("TRADING_MT5_COMMON_FILES")
    if env:
        return Path(env)
    # Default for this server Wine prefix
    return Path(
        "/opt/innovaplus/trading/wine/prefix/drive_c/users/innova/AppData/Roaming/MetaQuotes/Terminal/Common/Files"
    )


@dataclass(frozen=True)
class BridgeResult:
    ok: bool
    retcode: Optional[int]
    ticket: Optional[int]
    msg: str


def bridge_rates_path(common_dir: Path, symbol: str) -> Path:
    return common_dir / f"bridge_m5_{symbol}.csv"


def bridge_commands_path(common_dir: Path) -> Path:
    return common_dir / "bridge_commands.csv"


def bridge_results_path(common_dir: Path) -> Path:
    return common_dir / "bridge_results.csv"


def submit_order(
    *,
    common_dir: Path,
    action: str,  # BUY/SELL
    symbol: str,
    lot: float,
    sl: float,
    tp: float,
    comment: str = "bridge",
) -> str:
    common_dir.mkdir(parents=True, exist_ok=True)
    cmd_id = uuid.uuid4().hex
    ts = pd.Timestamp.utcnow().isoformat()

    line = f"{cmd_id},{ts},{action},{symbol},{lot},{sl},{tp},{comment}\n"
    path = bridge_commands_path(common_dir)
    header = "cmd_id,ts_utc,action,symbol,lot,sl,tp,comment\n"
    if not path.exists():
        path.write_text(header, encoding="utf-8")
    with path.open("a", encoding="utf-8") as f:
        f.write(line)
    return cmd_id


def wait_result(common_dir: Path, cmd_id: str, timeout_s: int = 5) -> Optional[BridgeResult]:
    path = bridge_results_path(common_dir)
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if path.exists():
            try:
                df = pd.read_csv(
                    path,
                    header=None,
                    names=["cmd_id", "ts", "symbol", "action", "lot", "ok", "retcode", "ticket", "msg"],
                )
                match = df[df["cmd_id"] == cmd_id]
                if not match.empty:
                    r = match.iloc[-1]
                    ok = str(r["ok"]) == "1"
                    retcode = int(r["retcode"]) if pd.notna(r["retcode"]) else None
                    ticket = int(r["ticket"]) if pd.notna(r["ticket"]) else None
                    msg = str(r["msg"]) if pd.notna(r["msg"]) else ""
                    return BridgeResult(ok=ok, retcode=retcode, ticket=ticket, msg=msg)
            except Exception:
                pass
        time.sleep(0.5)
    return None

