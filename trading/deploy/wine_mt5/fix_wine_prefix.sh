#!/usr/bin/env bash
set -euo pipefail

# Fix common Wine runtime issues for running scientific Python wheels:
# - install winetricks
# - install Visual C++ runtime (vcrun) to provide missing ucrtbase exports
#
# This is needed on some Wine versions where ucrtbase.dll functions are missing
# (e.g. "ucrtbase.dll.crealf").

PREFIX_ROOT="/opt/innovaplus/trading/wine"
export WINEPREFIX="${PREFIX_ROOT}/prefix"
export WINEARCH=win64
export DISPLAY="${DISPLAY:-:99}"

TMPDIR_DEFAULT="/opt/innovaplus/trading/tmp"
mkdir -p "${TMPDIR_DEFAULT}"
chmod 777 "${TMPDIR_DEFAULT}" || true
export TMPDIR="${TMPDIR:-${TMPDIR_DEFAULT}}"

echo "[fix] Installing winetricks (sudo)..."
sudo apt-get update
sudo apt-get install -y winetricks

echo "[fix] Installing VC runtime (vcrun2019) into prefix: ${WINEPREFIX}"
echo "[fix] (This can take a few minutes...)"
winetricks -q vcrun2019

echo "[fix] Done."
echo "[fix] Retry your run:"
echo "  bash trading/deploy/wine_mt5/run_trading_wine.sh --symbols \"EURUSD,GBPUSD,USDJPY\" --mode SELF --no-trade --once"

