#!/usr/bin/env bash
set -euo pipefail

# Installe Wine + Xvfb + outils, puis prépare un prefix Wine dédié à Trading,
# installe Python Windows + dépendances et télécharge l'installateur MT5.
#
# Requis:
# - Ubuntu 24.04+
# - sudo (mot de passe)
#
# Après ce script:
# - MT5 sera prêt à être lancé sous Wine (connexion à faire 1x via VNC)
# - Python Windows sous Wine pourra exécuter ton script (MetaTrader5)

PREFIX_ROOT="/opt/innovaplus/trading/wine"
WINEPREFIX="${PREFIX_ROOT}/prefix"
INSTALLERS_DIR="${PREFIX_ROOT}/installers"

PY_VER="${PY_VER:-3.11.9}"
PY_INSTALLER="python-${PY_VER}-amd64.exe"
PY_URL="https://www.python.org/ftp/python/${PY_VER}/${PY_INSTALLER}"

MT5_INSTALLER="mt5setup.exe"
MT5_URL="${MT5_URL:-https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe}"

echo "[setup] Installing system packages (sudo)..."
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  ca-certificates curl unzip p7zip-full \
  wine wine64 winbind \
  xvfb x11vnc fluxbox \
  cabextract

if ! command -v wineboot >/dev/null 2>&1; then
  echo "[setup] ERROR: wineboot not found after install."
  echo "[setup] On Ubuntu, ensure package 'wine' is installed (not only 'wine64')."
  echo "[setup] Try: sudo apt-get install -y wine"
  exit 1
fi

mkdir -p "${WINEPREFIX}" "${INSTALLERS_DIR}"

export WINEPREFIX
export WINEARCH=win64

echo "[setup] Initializing wine prefix: ${WINEPREFIX}"
wineboot -u

echo "[setup] Downloading Python installer: ${PY_URL}"
curl -fsSL "${PY_URL}" -o "${INSTALLERS_DIR}/${PY_INSTALLER}"

echo "[setup] Installing Python ${PY_VER} under Wine (quiet)..."
wine "${INSTALLERS_DIR}/${PY_INSTALLER}" /quiet InstallAllUsers=0 PrependPath=0 Include_test=0 TargetDir=C:\\trading\\python

echo "[setup] Upgrading pip..."
wine C:\\trading\\python\\python.exe -m pip install --upgrade pip

REQ_FILE="/opt/innovaplus/trading/app/Modele_trading/requirements_mt5_windows.txt"
if [[ -f "${REQ_FILE}" ]]; then
  echo "[setup] Installing Python deps from ${REQ_FILE}"
  # Use Z: drive mapping to access Linux filesystem from Wine
  wine C:\\trading\\python\\python.exe -m pip install -r "Z:\\opt\\innovaplus\\trading\\app\\Modele_trading\\requirements_mt5_windows.txt"
else
  echo "[setup] WARNING: requirements file not found at ${REQ_FILE}"
fi

echo "[setup] Downloading MT5 installer..."
curl -fsSL "${MT5_URL}" -o "${INSTALLERS_DIR}/${MT5_INSTALLER}"

cat <<'EOF'
[setup] OK.

Étapes suivantes:
1) Lancer MT5 sous Wine (avec Xvfb) et se connecter au compte Fusion Markets:
   - bash trading/deploy/wine_mt5/start_mt5_headless.sh
   - (optionnel) bash trading/deploy/wine_mt5/start_vnc.sh + tunnel SSH + client VNC

2) Lancer le modèle via Wine+Python:
   - bash trading/deploy/wine_mt5/run_trading_wine.sh --symbols "EURUSD,GBPUSD,USDJPY" --mode SELF --trade --lot 0.02 --interval 60
EOF
