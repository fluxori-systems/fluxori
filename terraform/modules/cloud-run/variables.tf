/**
 * Cloud Run Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The region to deploy resources to"
  type        = string
}

variable "backend_service_name" {
  description = "The name of the backend Cloud Run service"
  type        = string
  default     = "fluxori-backend"
}

variable "frontend_service_name" {
  description = "The name of the frontend Cloud Run service"
  type        = string
  default     = "fluxori-frontend"
}

variable "backend_image" {
  description = "The container image for the backend service"
  type        = string
}

variable "frontend_image" {
  description = "The container image for the frontend service"
  type        = string
}

variable "vpc_connector_id" {
  description = "The ID of the VPC connector"
  type        = string
}

variable "backend_env_vars" {
  description = "Environment variables for the backend service"
  type        = map(string)
  default = {
    "NODE_ENV" = "production"
    "PORT"     = "3001"
  }
}

variable "frontend_env_vars" {
  description = "Environment variables for the frontend service"
  type        = map(string)
  default = {
    "NODE_ENV" = "production"
    "PORT"     = "3000"
  }
}

variable "backend_secret_env_vars" {
  description = "Secret environment variables for the backend service"
  type        = map(object({
    secret_name = string
    secret_key  = string
  }))
  default = {}
}

variable "frontend_domain" {
  description = "The domain to map to the frontend service"
  type        = string
  default     = ""
}