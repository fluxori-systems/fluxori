/**
 * Variables for the security module
 */

variable "project_id" {
  description = "The Google Cloud project ID"
  type        = string
}

variable "domain" {
  description = "The primary domain for the application"
  type        = string
}

variable "rate_limit_threshold" {
  description = "The rate limit threshold for requests per minute per IP address"
  type        = number
  default     = 100
}

variable "enable_geo_restriction" {
  description = "Whether to enable geographic restriction (default: false)"
  type        = bool
  default     = false
}

variable "allowed_countries" {
  description = "List of allowed countries in addition to South Africa (ISO 3166-1 alpha-2 codes)"
  type        = list(string)
  default     = ["US", "GB", "DE", "AU"]
}

variable "enable_security_scanner" {
  description = "Whether to enable the Web Security Scanner"
  type        = bool
  default     = false
}

variable "scanner_email" {
  description = "Email address for scanner authentication"
  type        = string
  default     = ""
  sensitive   = true
}

variable "scanner_password" {
  description = "Password for scanner authentication"
  type        = string
  default     = ""
  sensitive   = true
}