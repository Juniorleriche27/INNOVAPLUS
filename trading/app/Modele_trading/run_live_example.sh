#!/usr/bin/env bash
set -euo pipefail

# Exemple de lancement (Linux) — adapte le chemin du venv et du terminal MT5.
# NB: MT5 tourne en général sur Windows. Sur Linux serveur, ça ne marchera que
# si tu as un MT5 fonctionnel (ex: Wine / machine dédiée). Sinon exécute ce
# script sur la machine Windows où MT5 est installé.

VENV_DIR="${VENV_DIR:-/opt/innovaplus/trading/venv}"
APP_DIR="/opt/innovaplus/trading/app/Modele_trading"

SYMBOLS="${SYMBOLS:-EURUSD,GBPUSD,USDJPY}"
MODE="${MODE:-SELF}"
LOT="${LOT:-0.02}"
INTERVAL="${INTERVAL:-60}"

# Exemple Windows (à adapter) :
# TERMINAL_PATH="C:\\Program Files\\MetaTrader 5\\terminal64.exe"
TERMINAL_PATH="${TERMINAL_PATH:-/chemin/vers/terminal64.exe}"

source "${VENV_DIR}/bin/activate"
python3 "${APP_DIR}/live_loop_mt5.py" \
  --symbols "${SYMBOLS}" \
  --mode "${MODE}" \
  --trade \
  --lot "${LOT}" \
  --interval "${INTERVAL}" \
  --terminal-path "${TERMINAL_PATH}" \
  --timeout 60

