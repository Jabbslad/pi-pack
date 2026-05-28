#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_DIR="${HOME}/.pi/agent"
SETTINGS_SOURCE="${REPO_DIR}/config/settings.json"
SETTINGS_TARGET="${PI_DIR}/settings.json"
AGENTS_TARGET="${PI_DIR}/AGENTS.md"
APPEND_SYSTEM_TARGET="${PI_DIR}/APPEND_SYSTEM.md"
SYSTEM_TARGET="${PI_DIR}/SYSTEM.md"
KEYBINDINGS_TARGET="${PI_DIR}/keybindings.json"
SKILLS_SOURCE_DIR="${REPO_DIR}/skills"
SKILLS_TARGET_DIR="${PI_DIR}/skills"
EXTENSIONS_SOURCE_DIR="${REPO_DIR}/extensions"
EXTENSIONS_TARGET_DIR="${PI_DIR}/extensions"

mkdir -p "${PI_DIR}"

if [ ! -f "${SETTINGS_SOURCE}" ]; then
  echo "Missing ${SETTINGS_SOURCE}" >&2
  exit 1
fi

if [ -f "${SETTINGS_TARGET}" ] && [ ! -L "${SETTINGS_TARGET}" ]; then
  cp "${SETTINGS_TARGET}" "${SETTINGS_TARGET}.bak.$(date +%Y%m%d%H%M%S)"
fi

ln -sfn "${SETTINGS_SOURCE}" "${SETTINGS_TARGET}"

ln -sfn "${REPO_DIR}/config/AGENTS.md" "${AGENTS_TARGET}"
ln -sfn "${REPO_DIR}/config/SYSTEM.md" "${SYSTEM_TARGET}"
ln -sfn "${REPO_DIR}/config/APPEND_SYSTEM.md" "${APPEND_SYSTEM_TARGET}"
ln -sfn "${REPO_DIR}/config/keybindings.json" "${KEYBINDINGS_TARGET}"

mkdir -p "${SKILLS_TARGET_DIR}"
if [ -d "${SKILLS_SOURCE_DIR}" ]; then
  rsync -a --delete "${SKILLS_SOURCE_DIR}/" "${SKILLS_TARGET_DIR}/"
fi

# Symlink each bundled extension individually so other local extensions are preserved.
mkdir -p "${EXTENSIONS_TARGET_DIR}"
if [ -d "${EXTENSIONS_SOURCE_DIR}" ]; then
  for ext in "${EXTENSIONS_SOURCE_DIR}"/*.ts; do
    [ -e "${ext}" ] || continue
    ln -sfn "${ext}" "${EXTENSIONS_TARGET_DIR}/$(basename "${ext}")"
  done
fi

echo "Synced Pi config to ${PI_DIR}"
echo "- settings:   ${SETTINGS_TARGET}"
echo "- AGENTS:     ${AGENTS_TARGET}"
echo "- SYSTEM:     ${SYSTEM_TARGET}"
echo "- APPEND:     ${APPEND_SYSTEM_TARGET}"
echo "- keys:       ${KEYBINDINGS_TARGET}"
echo "- skills:     ${SKILLS_TARGET_DIR}"
echo "- extensions: ${EXTENSIONS_TARGET_DIR}"
