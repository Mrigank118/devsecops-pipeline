#!/usr/bin/env bash

set -u

# ============================================================
# DEVSECOPS SECURITY DEMONSTRATION
# ============================================================
#
# Purpose:
#   Demonstrate the security controls implemented in this
#   DevSecOps project without modifying the real application.
#
# Security controls demonstrated:
#
#   1. Gitleaks
#      Detects hardcoded secrets and credentials.
#
#   2. Semgrep
#      Performs Static Application Security Testing (SAST).
#
#   3. Pre-commit
#      Automatically executes the configured security checks
#      before a Git commit is allowed.
#
# The vulnerable files created by this script are temporary.
# They are never committed to the repository.
#
# ============================================================

set -o pipefail

DEMO_DIR="security-demo-tmp"
GITLEAKS_CONFIG="/tmp/devsecops-demo-gitleaks.toml"

# ------------------------------------------------------------
# TERMINAL COLORS
# ------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
RESET='\033[0m'

# ------------------------------------------------------------
# TERMINAL HELPERS
# ------------------------------------------------------------

clear_line() {
    printf "\r\033[K"
}

pause_demo() {
    echo
    sleep 2
}

slow_print() {
    local text="$1"
    local delay="${2:-0.015}"

    while IFS= read -r -n1 char; do
        printf "%s" "$char"
        sleep "$delay"
    done <<< "$text"

    echo
}

section() {
    echo
    echo -e "${BLUE}============================================================${RESET}"
    echo -e "${WHITE} $1${RESET}"
    echo -e "${BLUE}============================================================${RESET}"
    echo
}

subsection() {
    echo
    echo -e "${CYAN}------------------------------------------------------------${RESET}"
    echo -e "${WHITE}$1${RESET}"
    echo -e "${CYAN}------------------------------------------------------------${RESET}"
    echo
}

success() {
    echo -e "${GREEN}[PASS]${RESET} $1"
}

warning() {
    echo -e "${YELLOW}[INFO]${RESET} $1"
}

failure() {
    echo -e "${RED}[FAIL]${RESET} $1"
}

command_info() {
    echo -e "${GRAY}[COMMAND]${RESET} $1"
}

# ------------------------------------------------------------
# CLEANUP
# ------------------------------------------------------------

cleanup() {

    echo
    echo -e "${BLUE}============================================================${RESET}"
    echo -e "${WHITE} CLEANUP${RESET}"
    echo -e "${BLUE}============================================================${RESET}"
    echo

    echo -e "${CYAN}Removing temporary vulnerable application...${RESET}"
    sleep 1

    rm -rf "$DEMO_DIR"
    rm -f "$GITLEAKS_CONFIG"

    echo
    success "Temporary demonstration files removed."
    success "Repository source files were not modified."
    success "No demonstration files were committed."
    echo
}

trap cleanup EXIT

# ============================================================
# INTRODUCTION
# ============================================================

clear

echo
echo -e "${BLUE}============================================================${RESET}"
echo -e "${WHITE}              DEVSECOPS SECURITY DEMONSTRATION${RESET}"
echo -e "${BLUE}============================================================${RESET}"
echo
echo -e "${CYAN}This demonstration shows how security controls are integrated${RESET}"
echo -e "${CYAN}directly into the developer workflow before code is committed.${RESET}"
echo
echo -e "${WHITE}Security controls:${RESET}"
echo
echo -e "  ${MAGENTA}1.${RESET} Gitleaks  - Secret Detection"
echo -e "  ${MAGENTA}2.${RESET} Semgrep   - Static Application Security Testing"
echo -e "  ${MAGENTA}3.${RESET} Pre-commit - Automated Security Gate"
echo
echo -e "${GRAY}The demonstration uses intentionally vulnerable temporary files.${RESET}"
echo -e "${GRAY}These files are deleted automatically when the demonstration ends.${RESET}"
echo

sleep 3

# ============================================================
# ENVIRONMENT CHECK
# ============================================================

section "ENVIRONMENT CHECK"

echo -e "${WHITE}Checking required security tooling...${RESET}"
echo

sleep 1

if command -v gitleaks >/dev/null 2>&1; then
    success "Gitleaks is installed."
    command_info "$(gitleaks version 2>/dev/null || echo 'version available')"
else
    failure "Gitleaks is not installed."
    echo "Install Gitleaks before running the demonstration."
    exit 1
fi

sleep 1

if command -v pre-commit >/dev/null 2>&1; then
    success "Pre-commit is installed."
else
    failure "Pre-commit is not installed."
    exit 1
fi

sleep 1

if command -v semgrep >/dev/null 2>&1; then
    success "Semgrep is installed globally."
else
    warning "Semgrep is not installed globally."
    warning "The configured pre-commit environment will be used instead."
fi

echo
echo -e "${GREEN}Environment check complete.${RESET}"

sleep 3

# ============================================================
# CREATE DEMO DIRECTORY
# ============================================================

section "CREATING TEMPORARY SECURITY TEST APPLICATION"

echo -e "${CYAN}Creating isolated demonstration directory...${RESET}"
echo

rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR"

sleep 1

echo -e "${CYAN}[1/3] Creating intentionally exposed credential...${RESET}"

cat > "$DEMO_DIR/config.js" <<'EOF'
// ============================================================
// INTENTIONAL SECURITY TEST
// ============================================================
//
// This file contains a FAKE credential.
// It does not belong to any real service.
//
// It exists only to demonstrate secret detection.
//
// ============================================================

const config = {
    apiKey: "DEMO_SECRET_SUPER_SECRET_VALUE",
    password: "DEMO_ONLY_FAKE_PASSWORD"
};

module.exports = config;
EOF

sleep 2

echo -e "${CYAN}[2/3] Creating intentionally unsafe application code...${RESET}"

cat > "$DEMO_DIR/app.js" <<'EOF'
// ============================================================
// INTENTIONAL SAST SECURITY TEST
// ============================================================
//
// Demonstrates execution of user-controlled input.
//
// This code is intentionally insecure and exists only for
// security-tool demonstration purposes.
//
// ============================================================

const express = require("express");

const app = express();

app.get("/demo", (req, res) => {

    const userInput = req.query.input;

    // INTENTIONAL VULNERABILITY:
    // User-controlled data is passed directly to eval().
    eval(userInput);

    res.send("Security demonstration");
});

module.exports = app;
EOF

sleep 2

echo -e "${CYAN}[3/3] Creating intentionally unsafe database query...${RESET}"

cat > "$DEMO_DIR/database.js" <<'EOF'
// ============================================================
// INTENTIONAL SQL INJECTION TEST
// ============================================================
//
// Demonstrates unsafe construction of a SQL query using
// untrusted user input.
//
// ============================================================

function findUser(db, username) {

    // INTENTIONAL VULNERABILITY:
    // User input is concatenated directly into SQL.
    const query =
        "SELECT * FROM users WHERE name = '" + username + "'";

    return db.query(query);
}

module.exports = { findUser };
EOF

sleep 2

echo
success "Temporary vulnerable application created."

echo
echo -e "${WHITE}Temporary files:${RESET}"
echo
echo "  $DEMO_DIR/config.js"
echo "  $DEMO_DIR/app.js"
echo "  $DEMO_DIR/database.js"
echo

sleep 3

# ============================================================
# GITLEAKS
# ============================================================

section "1. SECRET DETECTION — GITLEAKS"

echo -e "${WHITE}Objective:${RESET}"
echo "Detect hardcoded credentials, API keys, tokens and other"
echo "potential secrets before they enter source control."
echo

sleep 3

subsection "Preparing demonstration-specific Gitleaks rule"

cat > "$GITLEAKS_CONFIG" <<'EOF'
title = "DevSecOps Security Demonstration"

[[rules]]
id = "demo-secret"
description = "Intentional demonstration secret"
regex = '''DEMO_SECRET_[A-Za-z0-9_-]+'''
secretGroup = 0
keywords = ["DEMO_SECRET_"]
EOF

success "Temporary Gitleaks demonstration rule created."

echo
echo -e "${GRAY}The rule specifically detects the fake secret embedded in${RESET}"
echo -e "${GRAY}the temporary demonstration application.${RESET}"

sleep 3

subsection "Running Gitleaks against temporary files"

echo -e "${CYAN}Scanning temporary application...${RESET}"
echo

command_info "gitleaks detect --no-git --source \"$DEMO_DIR\" --config \"$GITLEAKS_CONFIG\" --redact"

sleep 2

GITLEAKS_OUTPUT=$(
    gitleaks detect \
        --no-git \
        --source "$DEMO_DIR" \
        --config "$GITLEAKS_CONFIG" \
        --redact \
        --no-banner \
        2>&1
)

GITLEAKS_STATUS=$?

echo "$GITLEAKS_OUTPUT"

sleep 3

if [ "$GITLEAKS_STATUS" -ne 0 ]; then

    echo
    failure "Gitleaks detected a potential secret."
    echo
    echo -e "${YELLOW}Security control result:${RESET}"
    echo "The hardcoded credential was identified before it could"
    echo "be accepted into the normal development workflow."

else

    echo
    warning "Gitleaks did not report a finding."
    echo
    echo "Check the demonstration rule if this occurs."

fi

sleep 4

# ============================================================
# SEMGREP
# ============================================================

section "2. STATIC APPLICATION SECURITY TESTING — SEMGREP"

echo -e "${WHITE}Objective:${RESET}"
echo "Identify insecure programming patterns and potential"
echo "application vulnerabilities through static analysis."
echo

sleep 3

subsection "Security issues intentionally introduced"

echo -e "${RED}Issue A:${RESET}"
echo "User-controlled input passed to eval()."
echo

sleep 2

echo -e "${RED}Issue B:${RESET}"
echo "User-controlled data concatenated into an SQL query."
echo

sleep 3

subsection "Running Semgrep"

if command -v semgrep >/dev/null 2>&1; then

    echo -e "${CYAN}Semgrep executable detected on the system.${RESET}"
    echo

    command_info "semgrep --config auto \"$DEMO_DIR\""

    sleep 2

    semgrep \
        --config auto \
        "$DEMO_DIR" || true

else

    echo -e "${YELLOW}Semgrep is not installed globally.${RESET}"
    echo
    echo "The repository configuration manages Semgrep through"
    echo "the pre-commit environment."
    echo
    echo -e "${CYAN}The Semgrep analysis will therefore be demonstrated${RESET}"
    echo -e "${CYAN}through the configured pre-commit pipeline below.${RESET}"

fi

sleep 4

# ============================================================
# PRE-COMMIT
# ============================================================

section "3. PRE-COMMIT SECURITY GATE"

echo -e "${WHITE}Objective:${RESET}"
echo "Automatically execute security checks before a Git commit"
echo "is accepted."
echo

sleep 3

echo -e "${WHITE}Configured security workflow:${RESET}"
echo
echo "  START"
echo "    |"
echo "    v"
echo "  Gitleaks"
echo "    |"
echo "    v"
echo "  Semgrep"
echo "    |"
echo "    v"
echo "  COMMIT ALLOWED / BLOCKED"
echo

sleep 4

subsection "Temporarily staging demonstration files"

echo -e "${CYAN}The vulnerable files must be staged because pre-commit${RESET}"
echo -e "${CYAN}normally operates on files participating in a Git commit.${RESET}"
echo

sleep 3

git add "$DEMO_DIR"

STAGED_BY_DEMO=1

success "Demonstration files temporarily staged."

echo
echo -e "${GRAY}No commit will be created.${RESET}"
echo -e "${GRAY}The files will be removed automatically after the test.${RESET}"

sleep 4

subsection "Running configured pre-commit pipeline"

echo -e "${CYAN}Executing the actual repository pre-commit configuration...${RESET}"
echo

sleep 3

pre-commit run

PRECOMMIT_STATUS=$?

echo

sleep 3

# ============================================================
# RESULT
# ============================================================

section "SECURITY PIPELINE RESULT"

if [ "$PRECOMMIT_STATUS" -eq 0 ]; then

    echo -e "${GREEN}============================================================${RESET}"
    echo -e "${GREEN}              PRE-COMMIT PIPELINE PASSED${RESET}"
    echo -e "${GREEN}============================================================${RESET}"
    echo
    echo -e "${GREEN}All configured security hooks completed successfully.${RESET}"
    echo
    echo "No security violation blocked the commit."
    echo
    echo -e "${YELLOW}Note:${RESET}"
    echo "The standalone Gitleaks demonstration above uses a dedicated"
    echo "demo-only rule so that the intentionally fake credential can"
    echo "be shown safely."
    echo
    echo "The repository's normal pre-commit configuration remains"
    echo "the authoritative security gate for actual commits."

else

    echo -e "${RED}============================================================${RESET}"
    echo -e "${RED}              PRE-COMMIT PIPELINE BLOCKED${RESET}"
    echo -e "${RED}============================================================${RESET}"
    echo
    echo -e "${RED}One or more configured security hooks reported a problem.${RESET}"
    echo
    echo "This demonstrates the purpose of the security gate:"
    echo
    echo "    Developer"
    echo "       |"
    echo "       v"
    echo "    git commit"
    echo "       |"
    echo "       v"
    echo "    Pre-commit"
    echo "       |"
    echo "       +---- Gitleaks"
    echo "       |"
    echo "       +---- Semgrep"
    echo "       |"
    echo "       v"
    echo "    Commit decision"
    echo
fi

sleep 5

# ============================================================
# EXPLANATION
# ============================================================

section "WHAT THIS DEMONSTRATION SHOWS"

echo -e "${WHITE}1. SECRET DETECTION${RESET}"
echo
echo "Gitleaks scans source files for patterns associated with"
echo "credentials and other sensitive information."
echo
sleep 2

echo -e "${WHITE}2. STATIC APPLICATION SECURITY TESTING${RESET}"
echo
echo "Semgrep analyzes source code without executing the application."
echo "It can identify dangerous coding patterns and common security"
echo "vulnerabilities."
echo
sleep 2

echo -e "${WHITE}3. DEVELOPER WORKFLOW INTEGRATION${RESET}"
echo
echo "Pre-commit connects these security controls directly to Git."
echo "Security checks therefore run automatically during the"
echo "developer commit workflow."
echo
sleep 2

echo -e "${WHITE}4. TEMPORARY SECURITY TESTING${RESET}"
echo
echo "The vulnerable files used in this demonstration are temporary."
echo "They are not part of the actual application."
echo
sleep 2

echo -e "${WHITE}5. NO REAL CREDENTIALS${RESET}"
echo
echo "All credentials shown by the demonstration are deliberately"
echo "fake values created solely for testing."
echo

sleep 4

# ============================================================
# FINAL
# ============================================================

section "DEMONSTRATION COMPLETE"

echo -e "${GREEN}The DevSecOps security demonstration has finished.${RESET}"
echo
echo "Security controls demonstrated:"
echo
echo "  [1] Gitleaks  - Secret Detection"
echo "  [2] Semgrep   - SAST"
echo "  [3] Pre-commit - Automated Security Gate"
echo
echo "Temporary vulnerable files will now be removed."
echo
echo -e "${GRAY}No Git commit is created by this demonstration.${RESET}"
echo -e "${GRAY}No real credentials are used.${RESET}"
echo

sleep 5