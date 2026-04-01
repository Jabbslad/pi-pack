#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_DIR="${HOME}/.pi/agent"
SETTINGS_SOURCE="${REPO_DIR}/config/settings.json"
SETTINGS_TARGET="${PI_DIR}/settings.json"
AGENTS_TARGET="${PI_DIR}/AGENTS.md"
KEYBINDINGS_TARGET="${PI_DIR}/keybindings.json"

mkdir -p "${PI_DIR}"

if [ ! -f "${SETTINGS_SOURCE}" ]; then
  echo "Missing ${SETTINGS_SOURCE}" >&2
  exit 1
fi

if [ -f "${SETTINGS_TARGET}" ] && [ ! -L "${SETTINGS_TARGET}" ]; then
  cp "${SETTINGS_TARGET}" "${SETTINGS_TARGET}.bak.$(date +%Y%m%d%H%M%S)"
fi

cp "${SETTINGS_SOURCE}" "${SETTINGS_TARGET}"

ln -sfn "${REPO_DIR}/config/AGENTS.md" "${AGENTS_TARGET}"
ln -sfn "${REPO_DIR}/config/keybindings.json" "${KEYBINDINGS_TARGET}"

echo "Synced Pi config to ${PI_DIR}"
echo "- settings: ${SETTINGS_TARGET}"
echo "- AGENTS:   ${AGENTS_TARGET}"
echo "- keys:     ${KEYBINDINGS_TARGET}"
