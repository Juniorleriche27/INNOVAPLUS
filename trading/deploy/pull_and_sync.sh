#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC_DIR="${REPO_ROOT}/trading/app"
RUNTIME_ROOT="/opt/innovaplus/trading"
DEST_DIR="${RUNTIME_ROOT}/app"

mkdir -p "${RUNTIME_ROOT}/app" "${RUNTIME_ROOT}/config" "${RUNTIME_ROOT}/data" "${RUNTIME_ROOT}/logs"

echo "[trading] Repo: ${REPO_ROOT}"
echo "[trading] Pull..."
git -C "${REPO_ROOT}" pull --ff-only

echo "[trading] Sync app -> ${DEST_DIR}"
if command -v rsync >/dev/null 2>&1; then
  rsync -a "${SRC_DIR}/" "${DEST_DIR}/"
else
  rm -rf "${DEST_DIR}"
  mkdir -p "${DEST_DIR}"
  cp -a "${SRC_DIR}/." "${DEST_DIR}/"
fi

ENV_EXAMPLE="${REPO_ROOT}/trading/deploy/.env.example"
ENV_REAL="${RUNTIME_ROOT}/config/.env"
if [[ ! -f "${ENV_REAL}" && -f "${ENV_EXAMPLE}" ]]; then
  cp "${ENV_EXAMPLE}" "${ENV_REAL}"
  echo "[trading] Created ${ENV_REAL} from .env.example (à compléter)."
fi

echo "[trading] OK"

