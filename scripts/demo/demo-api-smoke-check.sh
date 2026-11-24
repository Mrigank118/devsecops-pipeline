#!/usr/bin/env bash
set -e

FILE="scripts/security/smoke-api.sh"
MODE="${1:-}"

case "$MODE" in
  fail)
    FROM='expect_status 200 "$BASE_URL/api/products"'
    TO='expect_status 418 "$BASE_URL/api/products"'
    MESSAGE='DEMO FAIL #1: API smoke check detects unexpected status'
    ;;
  pass)
    FROM='expect_status 418 "$BASE_URL/api/products"'
    TO='expect_status 200 "$BASE_URL/api/products"'
    MESSAGE='DEMO PASS #1: restore expected API response'
    ;;
  *)
    echo "Usage: $0 fail|pass" >&2
    exit 2
    ;;
esac

if ! grep -Fqx "$FROM" "$FILE"; then
  echo "Expected line not found in $FILE. Check whether the code is already in the requested state." >&2
  exit 1
fi

python3 - "$FILE" "$FROM" "$TO" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
old, new = sys.argv[2:]
content = path.read_text()
if content.count(old) != 1:
    raise SystemExit(f"Expected exactly one occurrence of: {old}")
path.write_text(content.replace(old, new, 1))
PY
git add "$FILE"
git commit -m "$MESSAGE"
git push origin HEAD:main

echo "Pushed: $MESSAGE"
