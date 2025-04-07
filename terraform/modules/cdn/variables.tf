/**
 * Variables for the Cloud CDN Module
 */

variable "project_id" {
  description = "The ID of the project in which resources will be provisioned"
  type        = string
}

variable "bucket_name" {
  description = "The name of the GCS bucket to serve as the backend"
  type        = string
}

variable "domain" {
  description = "The domain name to use for the CDN (optional)"
  type        = string
  default     = ""
}

variable "enable_security_policy" {
  description = "Whether to enable Cloud Armor security policy"
  type        = bool
  default     = true
}

variable "rate_limit_threshold" {
  description = "The rate limit threshold for the security policy (requests per minute)"
  type        = number
  default     = 1000
}

variable "cache_ttl_seconds" {
  description = "Default TTL for cached content (in seconds)"
  type        = number
  default     = 3600 # 1 hour
}

variable "cors_origins" {
  description = "List of origins to allow for CORS"
  type        = list(string)
  default     = ["*"]
}