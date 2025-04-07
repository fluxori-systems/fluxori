/**
 * Variables for the load balancer module
 */

variable "project_id" {
  description = "The Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "The region where resources will be created"
  type        = string
  default     = "africa-south1"
}

variable "domain" {
  description = "The primary domain for the application"
  type        = string
}

variable "cloud_run_service_name" {
  description = "The name of the Cloud Run service to route traffic to"
  type        = string
}

variable "security_policy_id" {
  description = "The ID of the Cloud Armor security policy to attach to the backend service"
  type        = string
  default     = null
}

variable "enable_iap" {
  description = "Whether to enable Identity-Aware Proxy (IAP) for the backend service"
  type        = bool
  default     = false
}

variable "oauth2_client_id" {
  description = "OAuth2 client ID for IAP"
  type        = string
  default     = ""
  sensitive   = true
}

variable "oauth2_client_secret" {
  description = "OAuth2 client secret for IAP"
  type        = string
  default     = ""
  sensitive   = true
}

variable "environment" {
  description = "The environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}