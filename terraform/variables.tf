variable "aws_region" {
  description = "AWS region for the security findings artifact bucket."
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Globally unique name for the private findings artifact bucket."
  type        = string
}

variable "tags" {
  description = "Tags applied to managed resources."
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Purpose   = "DevSecOps security findings"
  }
}
