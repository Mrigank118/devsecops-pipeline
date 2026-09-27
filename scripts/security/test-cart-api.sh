#!/usr/bin/env sh
set -eu

BASE_URL=${1:-${API_BASE_URL:-http://localhost:3000}}
TEST_TMP_DIR=$(mktemp -d)
RESPONSE_FILE="$TEST_TMP_DIR/response.json"
COOKIE_JAR="$TEST_TMP_DIR/cookies.txt"
trap 'rm -rf "$TEST_TMP_DIR"' EXIT HUP INT TERM

assert_status() {
  expected=$1
  actual=$2
  action=$3
  if [ "$actual" != "$expected" ]; then
    echo "$action: expected HTTP $expected, received $actual" >&2
    cat "$RESPONSE_FILE" >&2
    exit 1
  fi
}

request_status() {
  curl --silent --show-error --output "$RESPONSE_FILE" --write-out '%{http_code}' "$@"
}

TEST_ID="$(date +%s)-$$"
EMAIL="ci-cart-${TEST_ID}@example.test"
PASSWORD="CiCart-${TEST_ID}!"
ORIGIN=${FRONT_ORIGIN:-http://localhost:3001}
REGISTER_PAYLOAD=$(python3 -c 'import json,sys; print(json.dumps({"full_name":"CI Cart Test","email":sys.argv[1],"password":sys.argv[2],"confirm_password":sys.argv[2]}))' "$EMAIL" "$PASSWORD")
LOGIN_PAYLOAD=$(python3 -c 'import json,sys; print(json.dumps({"email":sys.argv[1],"password":sys.argv[2]}))' "$EMAIL" "$PASSWORD")

status=$(request_status --request POST --header "Origin: $ORIGIN" \
  --header 'Content-Type: application/json' --cookie-jar "$COOKIE_JAR" \
  --data "$REGISTER_PAYLOAD" \
  "$BASE_URL/api/auth/register")
assert_status 201 "$status" 'Register test user'

status=$(request_status --request POST --header "Origin: $ORIGIN" \
  --header 'Content-Type: application/json' --cookie "$COOKIE_JAR" --cookie-jar "$COOKIE_JAR" \
  --data "$LOGIN_PAYLOAD" \
  "$BASE_URL/api/auth/login")
assert_status 200 "$status" 'Log in test user'

status=$(request_status "$BASE_URL/api/products")
assert_status 200 "$status" 'Load product catalog'
PRODUCT_ID=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["data"][0]["id"])' "$RESPONSE_FILE")

status=$(request_status --request POST --header "Origin: $ORIGIN" \
  --header 'Content-Type: application/json' --cookie "$COOKIE_JAR" \
  --data '{"quantity":1}' "$BASE_URL/api/cart/add/$PRODUCT_ID")
assert_status 201 "$status" 'Add product to cart'

status=$(request_status --request POST --header "Origin: $ORIGIN" \
  --header 'Content-Type: application/json' --cookie "$COOKIE_JAR" \
  --data '{"quantity":2}' "$BASE_URL/api/cart/add/$PRODUCT_ID")
assert_status 201 "$status" 'Add the same product again'

status=$(request_status --cookie "$COOKIE_JAR" "$BASE_URL/api/cart/your-cart")
assert_status 200 "$status" 'Read authenticated cart'
python3 - "$RESPONSE_FILE" "$PRODUCT_ID" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as response_file:
    cart = json.load(response_file)
product_id = int(sys.argv[2])
items = cart.get("data", [])
assert cart.get("itemCount") == 1, f"Expected one cart row, found {cart.get('itemCount')}"
item = next((entry for entry in items if int(entry["id"]) == product_id), None)
assert item is not None, f"Product {product_id} is missing from the cart"
assert int(item["quantity"]) == 3, f"Expected quantity 3, found {item['quantity']}"
PY

echo 'Authenticated cart integration checks passed'
