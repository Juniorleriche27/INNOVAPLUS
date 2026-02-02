#!/usr/bin/env bash
set -euo pipefail

PREFIX="/opt/innovaplus/trading/wine/prefix"
EA_SRC="/opt/innovaplus/KORYXA/trading/deploy/wine_mt5/BridgeEA.mq5"

if [[ ! -f "${EA_SRC}" ]]; then
  echo "EA source not found: ${EA_SRC}"
  exit 1
fi

# Two common locations (depends on MT5 data path)
DEST1="${PREFIX}/drive_c/Program Files/MetaTrader 5/MQL5/Experts"
DEST2="${PREFIX}/drive_c/users/innova/AppData/Roaming/MetaQuotes/Terminal/MQL5/Experts"

mkdir -p "${DEST1}" "${DEST2}"
cp -f "${EA_SRC}" "${DEST1}/BridgeEA.mq5"
cp -f "${EA_SRC}" "${DEST2}/BridgeEA.mq5"

echo "BridgeEA.mq5 copied to:"
echo " - ${DEST1}/BridgeEA.mq5"
echo " - ${DEST2}/BridgeEA.mq5"
echo
echo "Next (in MT5 via VNC): open MetaEditor, compile BridgeEA, attach to a chart, enable Algo Trading."

