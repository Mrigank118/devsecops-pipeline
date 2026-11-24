#!/usr/bin/env sh
set -eu
for project in . client server; do
  echo "Auditing ${project} dependencies"
  npm audit --prefix "$project" --omit=dev --audit-level=high
done
