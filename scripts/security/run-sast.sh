#!/usr/bin/env sh
set -eu
command -v semgrep >/dev/null 2>&1 || { echo "Install Semgrep first: https://semgrep.dev/docs/getting-started/" >&2; exit 127; }
exec semgrep scan --config auto --config .semgrep/security.yml --error .
