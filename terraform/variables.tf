/**
 * Fluxori SaaS - Variables
 * 
 * This file defines the variables used in the Terraform configuration.
 */

# Project variables
variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "project_name" {
  description = "The name of the GCP project"
  type        = string
  default     = "fluxori"
}

variable "billing_account" {
  description = "The ID of the billing account to associate with the project"
  type        = string
}

variable "org_id" {
  description = "The ID of the organization"
  type        = string
}

# Region and zone variables
variable "region" {
  description = "The region to deploy resources to"
  type        = string
  default     = "africa-south1" # Johannesburg region
}

variable "genai_region" {
  description = "The region to use for GenAI services (using European region as it's closer to South Africa than other GenAI-ready regions)"
  type        = string
  default     = "europe-west4" # Netherlands region
}

variable "zone" {
  description = "The zone to deploy resources to"
  type        = string
  default     = "africa-south1-a"
}

# Network variables
variable "subnet_ip_cidr_range" {
  description = "The IP CIDR range for the subnet"
  type        = string
  default     = "10.0.0.0/20"
}

variable "secondary_ranges" {
  description = "Secondary IP ranges for the subnet"
  type = map(list(object({
    range_name    = string
    ip_cidr_range = string
  })))
  default = {}
}

# Storage variables
variable "storage_class" {
  description = "The storage class for GCS buckets"
  type        = string
  default     = "STANDARD"
}

variable "storage_buckets" {
  description = "List of storage buckets to create"
  type = list(object({
    name          = string
    location      = string
    force_destroy = bool
    versioning    = bool
  }))
  default = []
}

# Cloud Run variables
variable "backend_image" {
  description = "The container image for the backend service"
  type        = string
}

variable "frontend_image" {
  description = "The container image for the frontend service"
  type        = string
}

# Secret Manager variables
variable "secrets" {
  description = "List of secrets to create"
  type = list(object({
    name        = string
    secret_data = string
  }))
  default = []
  sensitive = true
}

# IAM variables
variable "service_accounts" {
  description = "List of service accounts to create"
  type = list(object({
    account_id   = string
    display_name = string
    description  = string
    roles        = list(string)
  }))
  default = []
}

# Monitoring variables
variable "notification_channels" {
  description = "List of notification channels to create"
  type = list(object({
    display_name = string
    type         = string
    email        = string
  }))
  default = []
}

variable "alert_policies" {
  description = "List of alert policies to create"
  type = list(object({
    display_name = string
    documentation = object({
      content   = string
      mime_type = string
    })
    conditions = list(object({
      display_name = string
      condition_threshold = object({
        filter          = string
        duration        = string
        comparison      = string
        threshold_value = number
      })
    }))
  }))
  default = []
}

# Service Mesh variables
variable "support_email" {
  description = "Support email for OAuth brand"
  type        = string
  default     = "support@fluxori.com"
}

variable "internal_services_domain" {
  description = "Domain for internal services (optional)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "dev"
}