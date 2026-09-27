#!/usr/bin/env sh
set -eu
TARGET=${1:-${DAST_TARGET_URL:-}}
if [ -z "$TARGET" ]; then echo "Usage: $0 <target-url> (or set DAST_TARGET_URL)" >&2; exit 2; fi
command -v docker >/dev/null 2>&1 || { echo "Docker is required to run the OWASP ZAP container" >&2; exit 127; }
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec docker run --rm --network host \
  --volume "$SCRIPT_DIR/zap-baseline.conf:/zap/wrk/zap-baseline.conf:ro" \
  -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t "$TARGET" -c /zap/wrk/zap-baseline.conf
