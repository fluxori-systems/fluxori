/**
 * Monitoring Module Variables
 * Optimized for Fluxori's GCP deployment in South Africa
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The primary GCP region for resources"
  type        = string
  default     = "africa-south1"
}

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

variable "alert_email" {
  description = "Email address for receiving alerts"
  type        = string
  default     = "alerts@fluxori.com"
}

variable "slack_channel" {
  description = "Slack channel for receiving alerts"
  type        = string
  default     = "#fluxori-alerts"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for sending alerts"
  type        = string
  sensitive   = true
  default     = ""
}

variable "primary_on_call_contact" {
  description = "Email address of the primary on-call person"
  type        = string
  default     = "oncall@fluxori.com"
}

variable "secondary_on_call_contact" {
  description = "Email address of the secondary on-call person"
  type        = string
  default     = "oncall-backup@fluxori.com"
}

variable "latency_threshold_ms" {
  description = "Threshold for high latency alerts in milliseconds"
  type        = number
  default     = 1000 # 1 second
}

variable "firestore_latency_threshold_ms" {
  description = "Threshold for high Firestore latency alerts in milliseconds"
  type        = number
  default     = 500 # 500 milliseconds
}

variable "error_rate_threshold" {
  description = "Threshold for high error rate alerts (errors per minute)"
  type        = number
  default     = 5
}

variable "credit_usage_threshold_percent" {
  description = "Threshold for AI credit usage alerts (percentage of allocated credits)"
  type        = number
  default     = 80 # 80%
}

variable "enable_uptime_checks" {
  description = "Whether to enable uptime checks"
  type        = bool
  default     = true
}

variable "notification_channel_names" {
  description = "Names of existing notification channels to use for alerts"
  type        = list(string)
  default     = []
}