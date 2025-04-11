/**
 * Variables for the Regional Optimization Module
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The primary region for regional services (africa-south1)"
  type        = string
  default     = "africa-south1"
}

variable "genai_region" {
  description = "The region for GenAI services (europe-west1 or europe-west4)"
  type        = string
  default     = "europe-west1" # Belgium, closest to South Africa with GenAI support
}

variable "domain" {
  description = "The primary domain for the application"
  type        = string
}

variable "static_assets_bucket" {
  description = "The name of the GCS bucket for static assets"
  type        = string
}

variable "cors_origins" {
  description = "List of origins to allow for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "redis_memory_size_gb" {
  description = "The size of the Redis instance in GB"
  type        = number
  default     = 1
}

variable "vpc_network" {
  description = "The VPC network to use for private connections"
  type        = string
}

variable "default_backend_service" {
  description = "The default backend service for the load balancer"
  type        = string
}

variable "genai_backend_service" {
  description = "The backend service for GenAI operations (should be in europe-west1)"
  type        = string
}

variable "critical_backend_service" {
  description = "The backend service for critical operations"
  type        = string
}

variable "latency_filter" {
  description = "Additional filter for the latency alert policy"
  type        = string
  default     = ""
}

variable "isp_performance_filter" {
  description = "Additional filter for the ISP performance alert policy"
  type        = string
  default     = "metadata.user_labels.\"region\"=\"africa-south1\""
}

variable "api_latency_filter" {
  description = "Additional filter for the API latency monitoring"
  type        = string
  default     = ""
}

variable "notification_channels" {
  description = "List of notification channel IDs for alerting"
  type        = list(string)
  default     = []
}

variable "scheduler_service_account" {
  description = "Service account email for the Cloud Scheduler job"
  type        = string
}

variable "cdn_edge_locations" {
  description = "List of CDN edge locations to optimize for (defaults to Africa & Middle East)"
  type        = list(string)
  default     = [
    "johannesburg",
    "capetown",
    "durban",
    "lagos",
    "nairobi",
    "casablanca",
    "dubai"
  ]
}