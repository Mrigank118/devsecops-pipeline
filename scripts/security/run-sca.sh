#!/usr/bin/env sh
set -eu
for project in . client server; do
  echo "Auditing ${project} dependencies"
  npm audit --prefix "$project" --audit-level=high
done
