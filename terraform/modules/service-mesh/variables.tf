/**
 * Service Mesh Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "backend_service_id" {
  description = "The ID of the backend service to protect with IAP"
  type        = string
}

variable "backend_service_neg_id" {
  description = "The ID of the Network Endpoint Group for the backend service"
  type        = string
}

variable "support_email" {
  description = "Support email for OAuth brand"
  type        = string
}

variable "internal_services_domain" {
  description = "Domain for internal services (optional)"
  type        = string
  default     = ""
}

variable "allowed_service_accounts" {
  description = "List of service accounts allowed to access protected services"
  type        = list(string)
  default     = []
}