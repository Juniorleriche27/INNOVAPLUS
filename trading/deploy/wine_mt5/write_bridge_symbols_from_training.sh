#!/usr/bin/env bash
set -euo pipefail

# Écrit bridge_symbols.txt dans MT5 Common\Files, à partir des tickers
# présents dans le dataset d'entraînement.
#
# Par défaut, on écrit les tickers EXACTS (souvent avec suffix "=X").
# Si ton broker MT5 n'a pas ce suffix, utilise STRIP_X=1.

STRIP_X="${STRIP_X:-0}"

COMMON_DIR="/opt/innovaplus/trading/wine/prefix/drive_c/users/innova/AppData/Roaming/MetaQuotes/Terminal/Common/Files"
SRC="/opt/innovaplus/trading/app/Modele_trading/smc_ml_dataset_v2.csv"
OUT="${COMMON_DIR}/bridge_symbols.txt"

mkdir -p "${COMMON_DIR}"

if [[ ! -f "${SRC}" ]]; then
  echo "Dataset not found: ${SRC}"
  exit 1
fi

# Extract unique tickers from CSV (header: setup_id,ticker,...)
tail -n +2 "${SRC}" | cut -d',' -f2 | sed 's/^ *//;s/ *$//' | sort -u > "${OUT}.tmp"

if [[ "${STRIP_X}" == "1" ]]; then
  sed -i 's/=X$//' "${OUT}.tmp"
fi

mv "${OUT}.tmp" "${OUT}"
echo "Wrote: ${OUT}"
echo "Lines: $(wc -l < "${OUT}")"
