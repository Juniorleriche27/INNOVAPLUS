#!/usr/bin/env bash
set -euo pipefail

PREFIX_ROOT="/opt/innovaplus/trading/wine"
export WINEPREFIX="${PREFIX_ROOT}/prefix"
export WINEARCH=win64

DISPLAY_NUM="${DISPLAY_NUM:-99}"
export DISPLAY=":${DISPLAY_NUM}"

INSTALLERS_DIR="${PREFIX_ROOT}/installers"
MT5_INSTALLER="${INSTALLERS_DIR}/mt5setup.exe"

mkdir -p /opt/innovaplus/trading/logs

if ! pgrep -f "Xvfb :${DISPLAY_NUM}" >/dev/null 2>&1; then
  nohup Xvfb ":${DISPLAY_NUM}" -screen 0 1280x720x24 > /opt/innovaplus/trading/logs/xvfb.log 2>&1 &
  sleep 1
fi

if ! pgrep -f "fluxbox.*:${DISPLAY_NUM}" >/dev/null 2>&1; then
  nohup fluxbox -display ":${DISPLAY_NUM}" > /opt/innovaplus/trading/logs/fluxbox.log 2>&1 &
  sleep 1
fi

TERM_PATH_WIN="C:\\Program Files\\MetaTrader 5\\terminal64.exe"
if wine cmd /c "if exist \"${TERM_PATH_WIN}\" (exit 0) else (exit 1)" >/dev/null 2>&1; then
  echo "[mt5] Terminal already installed."
else
  if [[ ! -f "${MT5_INSTALLER}" ]]; then
    echo "[mt5] Installer not found: ${MT5_INSTALLER}"
    echo "[mt5] Run: bash trading/deploy/wine_mt5/setup_wine_mt5.sh"
    exit 1
  fi
  echo "[mt5] Launching MT5 installer under Wine (GUI). Use VNC to complete installation/login."
  nohup wine "${MT5_INSTALLER}" > /opt/innovaplus/trading/logs/mt5_install.log 2>&1 &
  exit 0
fi

echo "[mt5] Launching terminal (headless display :${DISPLAY_NUM})..."
nohup wine "${TERM_PATH_WIN}" /portable > /opt/innovaplus/trading/logs/mt5_terminal.log 2>&1 &

echo "[mt5] OK. Use start_vnc.sh if you need to view the UI to login."

