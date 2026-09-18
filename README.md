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
| Secret Scanning     | Gitleaks, GitHub Secret Scanning             |
| SCA                 | Snyk, npm audit, Dependabot                  |
| Pre-Commit Security | pre-commit, Gitleaks, Semgrep                |
| CI/CD Security      | GitHub Actions, StepSecurity, OSSF Scorecard |
| Application Testing | Jest, Supertest, Newman                      |
| Container Security  | Trivy                                        |
| IaC Security        | Terraform, Checkov                           |
| DAST                | OWASP ZAP                                    |
| API Security        | Newman, OWASP ZAP                            |
| Finding Management  | DefectDojo                                   |

## Repository Structure

```text
devsecops-pipeline/
├── client/                    # React frontend
├── server/                    # Express/Node.js backend
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── security.yml
│   │   ├── container.yml
│   │   ├── infrastructure.yml
│   │   ├── dast.yml
│   │   ├── scorecard.yml
│   │   └── dependabot.yml
│   └── dependabot.yml
├── .githooks/
├── security/
│   ├── sast/
│   ├── secret-scanning/
│   ├── sca/
│   ├── container/
│   ├── iac/
│   └── dast/
├── threat-model/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── security/
├── docker/
├── terraform/
├── scripts/
├── docs/
├── reports/
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

Both are executed automatically through GitHub Actions.

### 4. Secret Scanning

**Gitleaks** scans repository contents for accidentally committed secrets.

**GitHub Secret Scanning** provides an additional repository-level detection mechanism.

The objective is to prevent credentials, tokens, API keys, and other sensitive values from entering the source repository.

### 5. Software Composition Analysis

Third-party dependencies are checked using:

* **npm audit**
* **Snyk**
* **Dependabot**

Snyk and npm audit identify known dependency vulnerabilities, while Dependabot provides automated dependency update pull requests.

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

The container security stage checks container images for known vulnerabilities and security issues before deployment.

### 8. Infrastructure-as-Code Security

Infrastructure is represented using **Terraform**.

**Checkov** analyzes Terraform configuration for insecure or non-compliant configuration patterns.

This allows infrastructure security issues to be detected before infrastructure is deployed.

### 9. Dynamic Application Security Testing

**OWASP ZAP** is used to perform DAST against the running application.

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

API endpoints are tested using:

* Newman
* OWASP ZAP

Newman executes automated Postman collections, while ZAP provides dynamic security testing of exposed application endpoints.

### 11. Finding Management

**DefectDojo** is used as a centralized vulnerability and finding management platform.

It can aggregate findings from multiple security tools, including:

```text
Semgrep
CodeQL
Snyk
Trivy
Checkov
OWASP ZAP
       │
       ▼
   DefectDojo
       │
       ▼
Findings → Tracking → Remediation
```

DefectDojo is a **finding-management platform**, not a replacement for the individual scanners.

## Running the Application

### Prerequisites

* Node.js
* npm
* Docker
* Docker Compose

### Local development

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm start
```

The frontend and backend run according to the configured application settings.

### Docker Compose

The complete application stack can be started using:

```bash
docker compose --env-file .env -f docker/docker-compose.yml up --build
```

The application exposes:

```text
Frontend: http://localhost:3001
Backend:  http://localhost:3000
```

## Pre-Commit Security

Install the hooks:

```bash
pre-commit install
```

Run all configured checks:

```bash
pre-commit run --all-files
```

Expected result:

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

container.yml
    → Container Security

infrastructure.yml
    → Terraform / IaC Security

dast.yml
    → Dynamic Application Security Testing

scorecard.yml
    → Software Supply Chain Security
```

This separation keeps each security stage independently understandable and maintainable.

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
* Automated SAST and SCA.
* Automated secret detection.
* CI/CD supply-chain security.
* Container vulnerability scanning.
* Infrastructure configuration analysis.
* Dynamic application and API security testing.
* Centralized vulnerability management.
* Automated security gates through CI/CD.

## License

This project contains an open-source e-commerce application used as the application workload for the DevSecOps implementation.

The original application's licensing and copyright notices are preserved where applicable. The DevSecOps pipeline, configurations, automation, documentation, and security artifacts are provided under the repository's stated license.
