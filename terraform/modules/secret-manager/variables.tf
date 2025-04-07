/**
 * Secret Manager Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "environment" {
  description = "The environment name (e.g. dev, prod)"
  type        = string
  default     = "dev"
}

variable "secrets" {
  description = "List of secrets to create"
  type = list(object({
    name        = string
    secret_data = string
  }))
  default = []
  sensitive = true
}