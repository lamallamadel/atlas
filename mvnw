#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v mvn >/dev/null 2>&1; then
  echo "Error: mvn is not installed or not on PATH." >&2
  echo "Please install Maven or configure your environment to provide mvn." >&2
  exit 1
fi

exec mvn -f "${ROOT_DIR}/pom.xml" "$@"
