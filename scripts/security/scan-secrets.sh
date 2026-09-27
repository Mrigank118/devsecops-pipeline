#!/usr/bin/env sh
set -eu
command -v gitleaks >/dev/null 2>&1 || { echo "Install Gitleaks first: https://github.com/gitleaks/gitleaks" >&2; exit 127; }
exec gitleaks detect --source . --config .gitleaks.toml --redact --no-banner
