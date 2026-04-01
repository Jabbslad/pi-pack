#!/usr/bin/env bash
set -euo pipefail

REPO_SLUG="Jabbslad/pi-pack"
BRANCH="main"
RAW_BASE="https://raw.githubusercontent.com/${REPO_SLUG}/${BRANCH}"
PI_DIR="${HOME}/.pi/agent"
SETTINGS_TARGET="${PI_DIR}/settings.json"
AGENTS_TARGET="${PI_DIR}/AGENTS.md"
KEYBINDINGS_TARGET="${PI_DIR}/keybindings.json"

fetch() {
  local url="$1"
  local out="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$out"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$out" "$url"
  else
    echo "Need curl or wget to download ${url}" >&2
    exit 1
  fi
}

mkdir -p "${PI_DIR}"

if ! command -v pi >/dev/null 2>&1; then
  echo "Installing pi..."
  npm install -g @mariozechner/pi-coding-agent
fi

if [ -f "${SETTINGS_TARGET}" ] && [ ! -L "${SETTINGS_TARGET}" ]; then
  cp "${SETTINGS_TARGET}" "${SETTINGS_TARGET}.bak.$(date +%Y%m%d%H%M%S)"
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

fetch "${RAW_BASE}/config/settings.template.json" "${TMP_DIR}/settings.json"
fetch "${RAW_BASE}/config/AGENTS.md" "${AGENTS_TARGET}"
fetch "${RAW_BASE}/config/keybindings.json" "${KEYBINDINGS_TARGET}"
cp "${TMP_DIR}/settings.json" "${SETTINGS_TARGET}"

pi install "git:github.com/${REPO_SLUG}" || true

echo "Installed pi-pack configuration to ${PI_DIR}"
echo "- settings: ${SETTINGS_TARGET}"
echo "- AGENTS:   ${AGENTS_TARGET}"
echo "- keys:     ${KEYBINDINGS_TARGET}"
echo
echo "Package installed from: git:github.com/${REPO_SLUG}"
echo "Start pi with: pi"
