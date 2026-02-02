#!/usr/bin/env bash
set -euo pipefail

echo "[cleanup] This removes MT5/Wine/VNC artifacts from /opt/innovaplus/trading."
echo "[cleanup] It does NOT touch your KORYXA app."

ROOT="/opt/innovaplus/trading"

rm -rf "${ROOT}/wine" "${ROOT}/tmp" 2>/dev/null || true
rm -f "${ROOT}/config/vnc.pass" 2>/dev/null || true

echo "[cleanup] Removed directories: ${ROOT}/wine, ${ROOT}/tmp (if present)"
echo "[cleanup] Removed file: ${ROOT}/config/vnc.pass (if present)"

echo
echo "[cleanup] Optional (requires sudo): remove packages installed for MT5/Wine/VNC"
echo "  sudo apt-get purge -y wine wine32 wine64 winetricks x11vnc xvfb fluxbox cabextract || true"
echo "  sudo apt-get autoremove -y && sudo apt-get autoclean -y"

