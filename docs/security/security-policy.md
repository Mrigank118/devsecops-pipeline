# Security policy

This repository treats the e-commerce service as a workload for demonstrating security controls across development and delivery.

## Required practices

- Never commit credentials. Use deployment secrets or a local ignored `.env` file.
- Keep production `SESSION_SECRET`, Stripe credentials, and OAuth credentials out of source and image layers.
- Use the authenticated server-side cart as the payment source. Only a signature-verified Stripe webhook may create a paid order.
- Return only user profile fields required by the client; credential hashes and salts stay server-side.
- Enforce owner checks for user-specific records.
- Build and scan both application images before publishing.
- Run source, dependency, IaC, and DAST checks in CI; treat scanner errors as failures.

## Scope

The CI workflows build, analyze, and scan. Terraform is validated but not applied. The example Terraform defines private encrypted report storage; it does not create the application runtime. Unit/integration tests, authenticated DAST, Newman, and DefectDojo are not implemented in this checkout.

Report suspected vulnerabilities privately to the repository maintainers. Do not include working credentials or customer data in an issue.
