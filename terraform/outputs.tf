output "security_findings_bucket" {
  description = "Private, encrypted S3 bucket for scanner report artifacts."
  value       = aws_s3_bucket.security_findings.bucket
}
