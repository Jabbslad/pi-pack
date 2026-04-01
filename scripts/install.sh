#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v pi >/dev/null 2>&1; then
  echo "Installing pi..."
  npm install -g @mariozechner/pi-coding-agent
fi

"${REPO_DIR}/scripts/sync.sh"

echo "Done. Start pi with: pi"
