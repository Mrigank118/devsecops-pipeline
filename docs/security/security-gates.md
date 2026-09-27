# Security gates

| Stage | Check | Blocking condition |
| --- | --- | --- |
| Pull request / push | Semgrep | Findings or scanner error |
| Pull request / push | CodeQL | Analysis findings are uploaded to GitHub code scanning |
| Pull request / push | Gitleaks | Detected secret |
| Pull request / push | npm audit | High or critical advisory |
| Pull request / push | API smoke checks | Unexpected status from public, protected, or cross-origin requests |
| Pull request / push | Trivy | Unfixed HIGH or CRITICAL image vulnerability |
| Pull request / push | Terraform validate and Checkov | Invalid Terraform or Checkov finding |
| Pull request / push | OWASP ZAP baseline | ZAP high-risk alert or scanner failure |

Docker publishing runs only after the reusable container scan succeeds. Pull requests scan images but do not publish them. Snyk is skipped unless the repository variable `ENABLE_SNYK` is `true`; it then requires `SNYK_TOKEN`.

Tool outages and configuration errors fail the relevant job. Findings should be fixed or reviewed and handled through an explicit, time-bounded exception; do not disable a gate just to make a build green.

The local equivalents are `scripts/security/run-sast.sh`, `scan-secrets.sh`, `run-sca.sh`, `scan-image.sh`, `scan-iac.sh`, and `run-dast.sh <url>`.
