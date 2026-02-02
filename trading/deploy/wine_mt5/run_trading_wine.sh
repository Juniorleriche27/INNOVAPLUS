#!/usr/bin/env bash
set -euo pipefail

# Wrapper: exécute ton modèle via Python Windows sous Wine,
# en pointant vers le code situé sur le filesystem Linux (drive Z:).

PREFIX_ROOT="/opt/innovaplus/trading/wine"
export WINEPREFIX="${PREFIX_ROOT}/prefix"
export WINEARCH=win64

# Ensure a display exists (headless servers need Xvfb).
DISPLAY_NUM="${DISPLAY_NUM:-99}"
export DISPLAY="${DISPLAY:-:${DISPLAY_NUM}}"
LOG_DIR="/opt/innovaplus/trading/logs"
mkdir -p "${LOG_DIR}" >/dev/null 2>&1 || true
if ! pgrep -f "Xvfb :${DISPLAY_NUM}" >/dev/null 2>&1; then
  nohup Xvfb ":${DISPLAY_NUM}" -screen 0 1280x720x24 > "${LOG_DIR}/xvfb.log" 2>&1 &
  sleep 1
fi
if ! pgrep -f "fluxbox.*:${DISPLAY_NUM}" >/dev/null 2>&1; then
  nohup fluxbox -display ":${DISPLAY_NUM}" > "${LOG_DIR}/fluxbox.log" 2>&1 &
  sleep 1
fi

# Some hosts have /tmp locked down. Use a dedicated tmp dir.
TMPDIR_DEFAULT="/opt/innovaplus/trading/tmp"
mkdir -p "${TMPDIR_DEFAULT}" >/dev/null 2>&1 || true
export TMPDIR="${TMPDIR:-${TMPDIR_DEFAULT}}"

APP_WIN="Z:\\opt\\innovaplus\\trading\\app\\Modele_trading\\live_loop_mt5.py"
PY_WIN="C:\\trading\\python\\python.exe"

SYMBOLS=""
MODE="SELF"
LOT="0.02"
INTERVAL="60"
TRADE="--no-trade"
ONCE=""
CONFIRM_TIMEOUT="5"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --symbols) SYMBOLS="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --lot) LOT="$2"; shift 2 ;;
    --interval) INTERVAL="$2"; shift 2 ;;
    --trade) TRADE="--trade"; shift 1 ;;
    --no-trade) TRADE="--no-trade"; shift 1 ;;
    --once) ONCE="--once"; shift 1 ;;
    --confirm-timeout) CONFIRM_TIMEOUT="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

if [[ -z "${SYMBOLS}" ]]; then
  echo "Usage: $0 --symbols \"EURUSD,GBPUSD\" [--mode SELF|SEL] [--trade|--no-trade] [--once] [--lot 0.02] [--interval 60]"
  exit 2
fi

exec wine "${PY_WIN}" "${APP_WIN}" \
  --symbols "${SYMBOLS}" \
  --mode "${MODE}" \
  ${TRADE} \
  --lot "${LOT}" \
  --interval "${INTERVAL}" \
  --confirm-timeout "${CONFIRM_TIMEOUT}" \
  ${ONCE}
