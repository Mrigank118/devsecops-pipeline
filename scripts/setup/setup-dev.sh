#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 20+ and npm are required." >&2
  exit 1
fi
NODE_MAJOR=$(node -p 'Number(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20+ is required (found $(node --version))." >&2
  exit 1
fi

npm ci

if command -v pre-commit >/dev/null 2>&1; then
  pre-commit install
else
  echo "Dependencies installed. Install pre-commit separately to enable local Gitleaks and Semgrep hooks."
fi
