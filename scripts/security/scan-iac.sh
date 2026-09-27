#!/usr/bin/env sh
set -eu
command -v checkov >/dev/null 2>&1 || { echo "Install Checkov first: pip install checkov" >&2; exit 127; }
exec checkov --directory terraform --framework terraform --quiet
