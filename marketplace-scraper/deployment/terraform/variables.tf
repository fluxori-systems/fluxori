variable "project_id" {
  description = "The Google Cloud project ID"
  type        = string
  default     = "fluxori-marketplace-data"
}

variable "region" {
  description = "The Google Cloud region for deployment"
  type        = string
  default     = "africa-south1"
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "marketplace-scraper"
}

variable "container_image" {
  description = "The Docker image for the marketplace scraper"
  type        = string
  default     = "gcr.io/fluxori-marketplace-data/marketplace-scraper:latest"
}

variable "cpu" {
  description = "CPU allocation for the Cloud Run service"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory allocation for the Cloud Run service"
  type        = string
  default     = "2Gi"
}

variable "min_instances" {
  description = "Minimum number of instances for the Cloud Run service"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances for the Cloud Run service"
  type        = number
  default     = 10
}

variable "timeout_seconds" {
  description = "Request timeout in seconds for the Cloud Run service"
  type        = number
  default     = 300
}

variable "smartproxy_auth_token" {
  description = "Auth token for SmartProxy API (sensitive)"
  type        = string
  sensitive   = true
  default     = "VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi"
}

variable "notification_email" {
  description = "Email address for alert notifications"
  type        = string
  default     = "alerts@fluxori.com"
}