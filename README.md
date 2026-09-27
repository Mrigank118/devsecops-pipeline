# Automated DevSecOps Pipeline for Secure Web Application Development

An end-to-end DevSecOps pipeline that integrates security throughout the software development lifecycle of a containerized web application.

The project uses an open-source e-commerce application as the application workload and builds an automated security pipeline around it, covering threat modeling, source-code security, dependency security, CI/CD security, container security, infrastructure security, and dynamic application security testing.

## Project Overview

Modern web applications depend on large amounts of application code, third-party dependencies, CI/CD infrastructure, containers, and cloud infrastructure. Security issues introduced at any stage can propagate into later stages of deployment.

This project implements a **DevSecOps methodology** in which security controls are integrated throughout the software delivery lifecycle rather than being performed only after deployment.

```text
Threat Modeling
       ↓
Pre-Commit Security
       ↓
Source Code Security
       ↓
Dependency Security
       ↓
CI/CD Security
       ↓
Application Testing
       ↓
Container Security
       ↓
Infrastructure Security
       ↓
DAST / API Security
       ↓
Finding Management
```

## Objectives

* Integrate security into the software development lifecycle.
* Detect vulnerabilities as early as possible.
* Automate security checks through GitHub Actions.
* Secure application source code and dependencies.
* Detect hardcoded secrets before they reach the repository.
* Secure Docker containers and infrastructure configuration.
* Perform dynamic security testing against the running application.
* Centralize security findings for analysis and remediation.
* Demonstrate a practical, repeatable DevSecOps methodology.

## Application Architecture

The application consists of:

```text
User
  │
  │ HTTPS
  ▼
React Client
  │
  │ REST API
  ▼
Express / Node.js API
  │
  ├──────────────► PostgreSQL
  │
  ├──────────────► GitHub OAuth
  │
  └──────────────► Stripe
```

The application is containerized using Docker and Docker Compose.

## Security Stack

| Security Area       | Tools                                        |
| ------------------- | -------------------------------------------- |
| Threat Modeling     | OWASP Threat Dragon                          |
| SAST                | Semgrep, CodeQL                              |
| Secret Scanning     | Gitleaks; optional GitHub repository feature  |
| SCA                 | npm audit, Dependabot; optional Snyk          |
| Pre-Commit Security | pre-commit, Gitleaks, Semgrep                |
| CI/CD Security      | GitHub Actions, StepSecurity, OSSF Scorecard |
| Application Build   | npm workspaces                               |
| API Smoke Checks    | curl-based auth, ownership, and CSRF checks   |
| Container Security  | Trivy (HIGH/CRITICAL gate)                    |
| IaC Security        | Terraform, Checkov                           |
| DAST                | OWASP ZAP                                    |
| API Security        | OWASP ZAP baseline against the running API    |
| Finding Management  | GitHub code scanning and workflow results    |

Snyk runs only when repository variable `ENABLE_SNYK=true` and secret `SNYK_TOKEN` are configured. Jest/Supertest/Newman test suites and DefectDojo integration are not included in this checkout.

## Repository Structure

```text
devsecops-pipeline/
├── client/                    # React frontend
├── server/                    # Express/Node.js backend
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── security.yml
│   │   ├── container-security.yml
│   │   ├── infrastructure.yml
│   │   ├── dast.yml
│   │   ├── scorecard.yml
│   │   └── dependabot.yml
│   └── dependabot.yml
├── .githooks/
├── threat-model/
├── scripts/
│   ├── security/
│   └── setup/
├── docker/
├── terraform/
├── docs/
├── package.json
├── package-lock.json
├── .gitleaks.toml
├── .pre-commit-config.yaml
└── README.md
```

## Security Pipeline

### 1. Threat Modeling

**OWASP Threat Dragon** is used to model the application architecture and identify threats using the STRIDE methodology.

The model covers:

* React client
* Express/Node.js API
* PostgreSQL
* GitHub OAuth
* Stripe
* Trust boundaries
* Application assets
* External services

The threat model establishes security requirements before automated security controls are applied.

### 2. Pre-Commit Security

Security checks are performed locally before code is committed.

```text
git commit
    │
    ├── Gitleaks
    │
    └── Semgrep
          │
       PASS / FAIL
```

The `.pre-commit-config.yaml` configures both tools.

This provides **shift-left security**, allowing developers to detect common security problems before code reaches the remote repository.

### 3. SAST

Two complementary static-analysis tools are used:

**Semgrep**

* Pattern-based static analysis
* Fast feedback
* JavaScript/TypeScript security analysis

**CodeQL**

* Semantic code analysis
* Data-flow and control-flow analysis
* Integrated with GitHub code scanning

Both run automatically through GitHub Actions. Semgrep findings fail the workflow.

### 4. Secret Scanning

**Gitleaks** scans repository contents for accidentally committed secrets.

**GitHub Secret Scanning** provides an additional repository-level detection mechanism.

The objective is to prevent credentials, tokens, API keys, and other sensitive values from entering the source repository.

### 5. Software Composition Analysis

Third-party dependencies are checked using:

* **npm audit**
* **Dependabot**

`npm audit` blocks high and critical known dependency advisories. Snyk is optional; Dependabot opens dependency update pull requests.

### 6. CI/CD Security

GitHub Actions provides the CI/CD automation platform.

The pipeline itself is secured using:

**StepSecurity Harden Runner**

Monitors GitHub Actions runners and their activity, including network egress.

**OSSF Scorecard**

Evaluates repository and software supply-chain security practices.

This extends security beyond the application itself to the software delivery infrastructure.

### 7. Container Security

Docker images are scanned using **Trivy**.

The reusable container workflow builds both images and fails on unfixed HIGH or CRITICAL vulnerabilities. Docker publishing depends on this gate, and pull requests run the image scan without publishing.

### 8. Infrastructure-as-Code Security

Infrastructure is represented using **Terraform**.

**Checkov** analyzes the example AWS configuration for insecure settings. Terraform defines a private, encrypted, versioned S3 bucket for scanner report artifacts and a separate SSE-S3 bucket for its access logs. CI validates configuration; it does not deploy cloud resources or upload reports.

This allows infrastructure security issues to be detected before infrastructure is deployed.

### 9. Dynamic Application Security Testing

The DAST workflow starts an ephemeral Docker Compose stack, runs API smoke checks for public/protected route behavior and cross-origin rejection, then runs **OWASP ZAP** baseline scans against the client and API.

Unlike SAST, which examines source code, DAST interacts with the deployed application from an external perspective.

```text
Source Code
    ↓
SAST

Dependencies
    ↓
SCA

Running Application
    ↓
DAST
```

### 10. API Security

The ZAP baseline scan covers routes exposed by the running API. There is no Newman collection or authenticated API test suite in this checkout.

### 11. Finding Management

GitHub Actions retains scan logs and publishes CodeQL findings to code scanning. DefectDojo is not configured. A future integration could aggregate reports from tools such as:

```text
Semgrep
CodeQL
Snyk
Trivy
Checkov
OWASP ZAP
       │
       ▼
GitHub code scanning and workflow results
```

Finding management complements the individual scanners; it does not replace them.

## Running the Application

### Prerequisites

* Node.js
* npm
* Docker
* Docker Compose

### Local development

Run the setup helper to install lockfile-pinned dependencies and, when available, install the pre-commit hooks:

```bash
./scripts/setup/setup-dev.sh
```

For direct Node development, provide `DB_URL` and `SESSION_SECRET`, initialize PostgreSQL with `server/models/tables.sql`, and start the application:

```bash
npm start
```

The frontend and backend run according to the configured application settings.

### Docker Compose

Create a local `.env` with fresh credentials and keep it out of Git:

```bash
{
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  printf 'SESSION_SECRET=%s\n' "$(openssl rand -hex 32)"
} > .env
```

For Stripe checkout, also set `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET`. Configure Stripe to send `checkout.session.completed` to `https://<api-host>/api/stripe/webhook`. For local checkout, use Stripe CLI to forward events to `localhost:3000/api/stripe/webhook`. GitHub OAuth is optional; when enabled, set `GITHUB_CLIENT`, `GITHUB_SECRET`, and backend callback URL in `GITHUB_CALLBACK_URL`.

Start the complete application stack:

```bash
docker compose --env-file .env -f docker/docker-compose.yml up --build
```

The application exposes:

```text
Frontend: http://localhost:3001
Backend:  http://localhost:3000
```

The database volume persists between runs. To reset local data, run `docker compose -f docker/docker-compose.yml down -v`.

If you already have a database volume from the older checkout/order schema, apply the migration once after starting PostgreSQL:

```bash
docker compose -f docker/docker-compose.yml exec -T postgres \
  psql -U ecommerce -d ecommerce < server/models/migrations/001-secure-checkout.sql
```

### Deployment configuration

The production API requires `DB_URL`, `SESSION_SECRET`, and `FRONT_DOMAIN`. Set `NODE_ENV=production` and serve the API over HTTPS. Add `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET` for payments; GitHub OAuth additionally needs `GITHUB_CLIENT`, `GITHUB_SECRET`, and `GITHUB_CALLBACK_URL` (or `SERVER_URL`). The client image embeds `REACT_APP_API_URL` at build time. Docker publishing uses repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`; set repository variable `REACT_APP_API_URL` when the API is not at the documented default.

The Terraform workflow only validates and scans. To provision the example S3 report buckets manually, configure AWS credentials and run `terraform -chdir=terraform init` followed by `terraform -chdir=terraform plan -var='bucket_name=<globally-unique-name>'`. Review the plan before applying. CI does not run `apply` or upload scan reports to those buckets.

## Pre-Commit Security

Install the hooks:

```bash
pre-commit install
```

Run all configured checks:

```bash
pre-commit run --all-files
```

The configured Gitleaks and Semgrep hooks should complete without findings:

```text
Detect hardcoded secrets................................Passed
semgrep..................................................Passed
```

## GitHub Actions

The project contains separate workflows for different security responsibilities:

```text
ci.yml
    → Application CI

security.yml
    → SAST + Secret Scanning + SCA

container-security.yml
    → Container Security

infrastructure.yml
    → Terraform / IaC Security

dast.yml
    → Dynamic Application Security Testing

scorecard.yml
    → Software Supply Chain Security
```

`security.yml` runs Semgrep, CodeQL, Gitleaks, and npm audit. Container scans gate image publication; DAST starts the application stack; Infrastructure Security validates Terraform and runs Checkov. These workflows do not run unit/integration tests, publish to DefectDojo, or deploy Terraform.

## Security Gates

Security tools are integrated into automated workflows so that detected security issues can cause pipeline failures where appropriate.

For example:

```text
Code
 ↓
Security Scan
 ↓
Finding?
 ├── No → Continue
 │
 └── Yes → Security Gate → Pipeline Failure
```

A failed security scan represents a detected security condition that requires review rather than an integration failure of the security tool itself.

## Security Methodology

The overall methodology follows:

```text
Identify
   ↓
Model
   ↓
Prevent
   ↓
Detect
   ↓
Analyze
   ↓
Remediate
   ↓
Verify
```

This connects the individual security tools into a complete DevSecOps lifecycle rather than treating them as independent scanners.

## Project Outcomes

The project demonstrates:

* Security requirements derived from threat modeling.
* Shift-left security through pre-commit checks.
* Automated SAST and SCA with blocking findings.
* Automated secret detection.
* CI/CD supply-chain security.
* Container vulnerability scanning.
* Infrastructure configuration analysis.
* Dynamic application and API security testing.
* GitHub code scanning and workflow-based finding review.
* Automated security gates through CI/CD.

## License

This project contains an open-source e-commerce application used as the application workload for the DevSecOps implementation.

The original application's licensing and copyright notices are preserved where applicable. The DevSecOps pipeline, configurations, automation, documentation, and security artifacts are provided under the repository's stated license.
