#!/usr/bin/env sh
set -eu
TARGET=${1:-${DAST_TARGET_URL:-}}
if [ -z "$TARGET" ]; then echo "Usage: $0 <target-url> (or set DAST_TARGET_URL)" >&2; exit 2; fi
command -v docker >/dev/null 2>&1 || { echo "Docker is required to run the OWASP ZAP container" >&2; exit 127; }
exec docker run --rm --network host -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t "$TARGET"
