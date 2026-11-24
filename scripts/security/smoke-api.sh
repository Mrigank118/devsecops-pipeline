#!/usr/bin/env sh
set -eu

BASE_URL=${1:-${API_BASE_URL:-http://localhost:3000}}

expect_status() {
  expected=$1
  shift
  actual=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$@")
  if [ "$actual" != "$expected" ]; then
    echo "Expected HTTP $expected, received $actual: $*" >&2
    exit 1
  fi
}

expect_status 200 "$BASE_URL/api/products"
expect_status 401 "$BASE_URL/api/users/user"
expect_status 401 "$BASE_URL/api/orders/1"
expect_status 401 --request POST "$BASE_URL/api/cart/checkout"
expect_status 403 --request POST --header 'Origin: https://attacker.example' "$BASE_URL/api/auth/logout"
expect_status 400 --request POST --header 'Content-Type: application/json' \
  --data '{"full_name":"Test User","email":"invalid","password":"weak","confirm_password":"weak"}' \
  "$BASE_URL/api/auth/register"

echo "API security smoke checks passed"
