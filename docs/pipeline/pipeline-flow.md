# Security pipeline flow

```text
Commit / pull request
  ├─ CI build
  ├─ Security scans: Semgrep + CodeQL + Gitleaks + npm audit (+ optional Snyk)
  ├─ Docker Compose → API smoke checks → OWASP ZAP baseline
  ├─ Terraform fmt / validate → Checkov
  ├─ OSSF Scorecard
  └─ Build both images → Trivy scan
       └─ All gates pass + main push/manual run → build and push Docker images
```

The Docker Build and Publish workflow is the orchestrator: each check is a reusable workflow job, and image publishing waits for every gate. Pull requests run the full DAG but skip publishing. Dependabot proposes dependency updates, and OSSF Scorecard also runs on its configured weekly schedule. GitHub Actions is the workflow result store; CodeQL and Scorecard findings are sent to GitHub code scanning. Terraform is validated, not deployed; the repository does not integrate DefectDojo.
