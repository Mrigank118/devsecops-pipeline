# Security pipeline flow

```text
Commit / pull request
  ├─ Build client
  ├─ Semgrep + CodeQL
  ├─ Gitleaks
  ├─ npm audit (high and critical gate)
  ├─ Build both container images → Trivy gate
  ├─ Terraform fmt / validate → Checkov gate
  └─ Start Docker Compose → API smoke checks → OWASP ZAP baseline (client and API)

Main branch container publication
  └─ Wait for container scan → build and push images
```

Dependabot proposes dependency updates. OSSF Scorecard runs separately on its configured schedule and main-branch updates. GitHub Actions is the workflow result store; CodeQL alerts are sent to GitHub code scanning. The repository does not currently run an application test suite, deploy Terraform, or integrate DefectDojo.
