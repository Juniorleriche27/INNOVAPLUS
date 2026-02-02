#!/usr/bin/env bash
set -euo pipefail

VENV_DIR="/opt/innovaplus/trading/venv_ig"
REQ="/opt/innovaplus/trading/app/Modele_trading/requirements_ig.txt"

python3 -m venv "${VENV_DIR}"
source "${VENV_DIR}/bin/activate"
python -m pip install --upgrade pip
python -m pip install -r "${REQ}"

echo "OK: venv created at ${VENV_DIR}"
echo "Next: copy trading/app/Modele_trading/ig_epics_template.json -> your mapping, fill /opt/innovaplus/trading/config/ig.env, then run run_ig.sh"

