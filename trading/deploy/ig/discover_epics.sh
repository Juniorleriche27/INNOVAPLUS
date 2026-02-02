#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/opt/innovaplus/trading/config/ig.env"
VENV_DIR="/opt/innovaplus/trading/venv_ig"
APP="/opt/innovaplus/trading/app/Modele_trading/ig_discover_epics.py"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Create it from: /opt/innovaplus/KORYXA/trading/deploy/ig/.env.example"
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

source "${VENV_DIR}/bin/activate"

exec python "${APP}" "$@"

