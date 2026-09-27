resource "aws_s3_bucket" "security_findings" {
  #checkov:skip=CKV_AWS_144:Cross-region recovery needs an account-approved destination region and bucket outside this example.
  #checkov:skip=CKV2_AWS_62:No event-driven consumer is defined for this example report bucket.
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "security_findings" {
  bucket                  = aws_s3_bucket.security_findings.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "security_findings" {
  bucket = aws_s3_bucket.security_findings.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "security_findings" {
  bucket = aws_s3_bucket.security_findings.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_ownership_controls" "security_findings" {
  bucket = aws_s3_bucket.security_findings.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_policy" "security_findings_tls_only" {
  bucket = aws_s3_bucket.security_findings.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.security_findings.arn,
          "${aws_s3_bucket.security_findings.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "security_findings" {
  bucket = aws_s3_bucket.security_findings.id
  rule {
    id     = "expire-old-reports"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
    expiration {
      days = 365
    }
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket" "access_logs" {
  #checkov:skip=CKV_AWS_18:This bucket is the access-log destination and must not log recursively to itself.
  #checkov:skip=CKV_AWS_144:Access logs use a same-region destination; a separate recovery region is outside this example.
  #checkov:skip=CKV_AWS_145:S3 server access log delivery to an S3 destination supports SSE-S3, not SSE-KMS.
  #checkov:skip=CKV2_AWS_62:Log delivery is storage-only; no event-driven consumer is defined.
  bucket = "${var.bucket_name}-access-logs"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket                  = aws_s3_bucket.access_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_ownership_controls" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_policy" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3ServerAccessLogs"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.access_logs.arn}/security-findings/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
          ArnLike = {
            "aws:SourceArn" = aws_s3_bucket.security_findings.arn
          }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.access_logs.arn,
          "${aws_s3_bucket.access_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    id     = "expire-access-logs"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
    expiration {
      days = 365
    }
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_logging" "security_findings" {
  bucket        = aws_s3_bucket.security_findings.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "security-findings/"
  depends_on    = [aws_s3_bucket_policy.access_logs]
}
