#!/usr/bin/env bash
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-99}"
export DISPLAY=":${DISPLAY_NUM}"

PORT="${VNC_PORT:-5900}"
PASS_FILE="/opt/innovaplus/trading/config/vnc.pass"
LOG="/opt/innovaplus/trading/logs/x11vnc.log"

mkdir -p /opt/innovaplus/trading/config /opt/innovaplus/trading/logs

if [[ ! -f "${PASS_FILE}" ]]; then
  echo "[vnc] Creating VNC password file at ${PASS_FILE}"
  echo "Choisis un mot de passe VNC (il ne sera pas commit)."
  x11vnc -storepasswd "${PASS_FILE}"
fi

echo "[vnc] Starting x11vnc on port ${PORT} for display ${DISPLAY}"
nohup x11vnc -display "${DISPLAY}" -rfbport "${PORT}" -rfbauth "${PASS_FILE}" -forever -shared > "${LOG}" 2>&1 &
echo "[vnc] OK. From your PC: ssh -L ${PORT}:localhost:${PORT} innova@46.224.25.143 then connect VNC to localhost:${PORT}"

