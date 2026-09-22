#!/bin/bash

set +e

CONFIG=".githooks/.pre-commit-config.yaml"
DEMO_DIR="security-demo-tmp"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

print_line() {
    echo "============================================================"
}

cleanup() {
    echo
    print_line
    echo " CLEANUP"
    print_line

    git restore --staged "$DEMO_DIR" 2>/dev/null
    rm -rf "$DEMO_DIR"

    echo -e "${GREEN}[PASS]${RESET} Vulnerable demonstration files removed."
    echo -e "${GREEN}[PASS]${RESET} No demonstration commit was created."
    echo
}

trap cleanup EXIT

clear

print_line
echo "              DEVSECOPS SECURITY DEMONSTRATION"
print_line

echo
echo "This demonstration creates intentionally vulnerable code,"
echo "runs security checks against it, shows the security controls"
echo "detecting the vulnerabilities, and then removes the files."
echo
echo "Security controls:"
echo
echo "  1. Gitleaks  - Secret Detection"
echo "  2. Semgrep   - Static Application Security Testing"
echo "  3. Pre-commit - Automated Security Gate"
echo

sleep 3

print_line
echo " CREATING INTENTIONALLY VULNERABLE FILES"
print_line

mkdir -p "$DEMO_DIR"

echo
echo "[1/3] Creating hardcoded credential..."

cat > "$DEMO_DIR/config.js" <<'EOF'
const config = {
    apiKey: "AKIAIOSFODNN7EXAMPLE"
};

module.exports = config;
EOF

echo -e "${GREEN}[PASS]${RESET} Fake credential created."

sleep 2

echo
echo "[2/3] Creating unsafe eval() usage..."

cat > "$DEMO_DIR/app.js" <<'EOF'
const express = require("express");

const app = express();

app.get("/demo", (req, res) => {
    const input = req.query.input;

    eval(input);

    res.send("demo");
});

module.exports = app;
EOF

echo -e "${GREEN}[PASS]${RESET} Dangerous eval() example created."

sleep 2

echo
echo "[3/3] Creating SQL injection example..."

cat > "$DEMO_DIR/database.js" <<'EOF'
function findUser(db, username) {
    const query = "SELECT * FROM users WHERE username = '" + username + "'";

    return db.query(query);
}

module.exports = findUser;
EOF

echo -e "${GREEN}[PASS]${RESET} SQL injection example created."

echo
echo "Files created:"
echo
echo "  $DEMO_DIR/config.js"
echo "      -> Hardcoded credential"
echo
echo "  $DEMO_DIR/app.js"
echo "      -> Dangerous eval()"
echo
echo "  $DEMO_DIR/database.js"
echo "      -> SQL injection"
echo

sleep 3

print_line
echo " STAGING VULNERABLE FILES"
print_line

echo
echo "[INFO] Adding demonstration files to the Git index..."

git add "$DEMO_DIR"

echo -e "${GREEN}[PASS]${RESET} Vulnerable files staged."
echo "[INFO] No commit has been created."

sleep 3

print_line
echo " 1. SECRET DETECTION — GITLEAKS"
print_line

echo
echo "Gitleaks searches source files for credentials,"
echo "API keys, tokens and other potentially sensitive data."
echo

sleep 2

echo "[INFO] Running Gitleaks..."

pre-commit run \
    --config "$CONFIG" \
    gitleaks \
    --files \
    "$DEMO_DIR/config.js"

GITLEAKS_STATUS=$?

echo

if [ "$GITLEAKS_STATUS" -ne 0 ]; then
    echo -e "${RED}[FAIL]${RESET} Gitleaks detected the demonstration secret."
    echo -e "${GREEN}[PASS]${RESET} Secret detection is working correctly."
else
    echo -e "${YELLOW}[WARN]${RESET} Gitleaks did not detect the demonstration secret."
fi

sleep 3

print_line
echo " 2. STATIC APPLICATION SECURITY TESTING — SEMGREP"
print_line

echo
echo "Semgrep performs static analysis without executing"
echo "the application."
echo
echo "The demonstration contains:"
echo
echo "  A. User-controlled input passed to eval()."
echo "  B. User-controlled input concatenated into SQL."
echo

sleep 3

echo "[INFO] Running Semgrep with the demonstration security rules..."
echo

semgrep \
    --config security/semgrep/demo-rules.yml \
    "$DEMO_DIR"

SEMGREP_STATUS=$?

echo

if [ "$SEMGREP_STATUS" -ne 0 ]; then
    echo -e "${RED}[FAIL]${RESET} Semgrep detected insecure code."
    echo -e "${GREEN}[PASS]${RESET} Static analysis is working correctly."
else
    echo -e "${YELLOW}[WARN]${RESET} Semgrep did not report the demonstration vulnerabilities."
fi

sleep 3

print_line
echo " 3. PRE-COMMIT SECURITY GATE"
print_line

echo
echo "The vulnerable files are staged as if a developer"
echo "were attempting to commit them."
echo
echo "The security checks run before the commit is accepted."
echo

sleep 3

echo "[INFO] Running repository pre-commit security gate..."
echo

pre-commit run \
    --config "$CONFIG" \
    --files \
    "$DEMO_DIR/config.js" \
    "$DEMO_DIR/app.js" \
    "$DEMO_DIR/database.js"

PRECOMMIT_STATUS=$?

echo

print_line
echo " SECURITY PIPELINE RESULT"
print_line

echo

if [ "$GITLEAKS_STATUS" -ne 0 ] || [ "$SEMGREP_STATUS" -ne 0 ]; then

    echo "              SECURITY ISSUES DETECTED"
    echo

    echo "The demonstration intentionally introduced vulnerabilities."
    echo
    echo "Gitleaks:"
    echo "  -> Hardcoded credential detection"
    echo
    echo "Semgrep:"
    echo "  -> Dangerous eval() detection"
    echo "  -> SQL injection detection"
    echo
    echo "This demonstrates how automated security analysis"
    echo "can identify vulnerable code before it is committed."

else

    echo "              SECURITY CHECKS PASSED"
    echo
    echo "The demonstration vulnerabilities were not detected."
    echo "Review the security configuration."
fi

sleep 4

print_line
echo " WHAT THIS DEMONSTRATION SHOWS"
print_line

echo
echo "1. SECRET DETECTION"
echo
echo "Gitleaks searches the source tree for credentials and"
echo "other patterns that may represent sensitive information."
echo

sleep 2

echo "2. STATIC APPLICATION SECURITY TESTING"
echo
echo "Semgrep analyzes source code without executing it."
echo "The demonstration rules identify dangerous programming"
echo "patterns such as eval() and SQL query construction."
echo

sleep 2

echo "3. PRE-COMMIT SECURITY"
echo
echo "Pre-commit connects security checks directly to the"
echo "developer's Git workflow."
echo

sleep 2

echo "4. EARLY SECURITY FEEDBACK"
echo
echo "Security problems can be identified during development,"
echo "before vulnerable code reaches the repository history."
echo

sleep 2

echo "5. SAFE DEMONSTRATION"
echo
echo "All vulnerable files contain fake demonstration data."
echo "No real credentials are used."
echo "No demonstration commit is created."
echo

sleep 3

print_line
echo " DEMONSTRATION COMPLETE"
print_line

echo
echo "The vulnerable demonstration files will now be removed."
echo