#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-$HOME/src/pi-pack}"
REPO_URL="${2:-}"

if [ -z "${REPO_URL}" ]; then
  echo "Usage: $0 [target-dir] <repo-url>" >&2
  echo "Example: $0 ~/src/pi-pack git@github.com:YOURNAME/pi-pack.git" >&2
  exit 1
fi

mkdir -p "$(dirname "${TARGET_DIR}")"

if [ ! -d "${TARGET_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${TARGET_DIR}"
else
  git -C "${TARGET_DIR}" pull --ff-only
fi

"${TARGET_DIR}/scripts/install.sh"
