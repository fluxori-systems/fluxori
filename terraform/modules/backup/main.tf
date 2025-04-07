# Fluxori Backup Infrastructure Module
# 
# This module provisions all necessary GCP resources for the Fluxori backup system:
# - Backup storage buckets
# - IAM roles and permissions
# - Cloud Scheduler for automated backups
# - Cloud Functions for backup operations
# - Log storage and monitoring

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "africa-south1"
}

variable "fallback_region" {
  description = "Fallback region for services not available in primary region"
  type        = string
  default     = "europe-west4"
}

variable "backup_bucket_name" {
  description = "Name of the GCS bucket to store backups"
  type        = string
  default     = "fluxori-backups"
}

variable "backup_logs_bucket_name" {
  description = "Name of the GCS bucket to store backup logs"
  type        = string
  default     = "fluxori-backup-logs"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email address for backup alerts"
  type        = string
}

variable "firestore_collections" {
  description = "List of Firestore collections to back up"
  type        = list(string)
  default     = ["users", "organizations", "products", "orders", "insights", "documents"]
}

variable "storage_buckets" {
  description = "List of Cloud Storage buckets to back up"
  type        = list(string)
  default     = ["fluxori-user-uploads", "fluxori-public-assets", "fluxori-documents"]
}

variable "backup_schedule" {
  description = "Cron schedule for backups (default: daily at 2AM SAST)"
  type        = string
  default     = "0 2 * * *"
}

# Local variables
locals {
  backup_service_account_name = "fluxori-backup-sa"
  backup_service_account_id   = "${local.backup_service_account_name}@${var.project_id}.iam.gserviceaccount.com"
  function_name               = "fluxori-backup-function"
  scheduler_job_name          = "fluxori-daily-backup"
}

# Create backup storage bucket
resource "google_storage_bucket" "backup_bucket" {
  name          = var.backup_bucket_name
  location      = var.region
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  lifecycle_rule {
    condition {
      age = var.backup_retention_days
    }
    action {
      type = "Delete"
    }
  }
  
  versioning {
    enabled = true
  }
}

# Create backup logs bucket
resource "google_storage_bucket" "backup_logs_bucket" {
  name          = var.backup_logs_bucket_name
  location      = var.region
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  lifecycle_rule {
    condition {
      age = 90 # Keep logs for 90 days
    }
    action {
      type = "Delete"
    }
  }
}

# Create a service account for backup operations
resource "google_service_account" "backup_service_account" {
  account_id   = local.backup_service_account_name
  display_name = "Fluxori Backup Service Account"
  description  = "Service account for Fluxori backup and recovery operations"
}

# Grant necessary permissions to the backup service account
resource "google_project_iam_binding" "firestore_admin" {
  project = var.project_id
  role    = "roles/datastore.importExportAdmin"
  
  members = [
    "serviceAccount:${local.backup_service_account_id}",
  ]
}

resource "google_project_iam_binding" "storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  
  members = [
    "serviceAccount:${local.backup_service_account_id}",
  ]
}

resource "google_project_iam_binding" "logs_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  
  members = [
    "serviceAccount:${local.backup_service_account_id}",
  ]
}

# Grant service account access to the backup buckets
resource "google_storage_bucket_iam_binding" "backup_bucket_admin" {
  bucket = google_storage_bucket.backup_bucket.name
  role   = "roles/storage.admin"
  
  members = [
    "serviceAccount:${local.backup_service_account_id}",
  ]
}

resource "google_storage_bucket_iam_binding" "logs_bucket_admin" {
  bucket = google_storage_bucket.backup_logs_bucket.name
  role   = "roles/storage.admin"
  
  members = [
    "serviceAccount:${local.backup_service_account_id}",
  ]
}

# Create backup Cloud Function source code bucket
resource "google_storage_bucket" "function_source" {
  name          = "${var.project_id}-function-source"
  location      = var.region
  force_destroy = true
}

# Upload backup function source code
data "archive_file" "function_source" {
  type        = "zip"
  source_dir  = "${path.module}/function-source"
  output_path = "${path.module}/function_source.zip"
}

resource "google_storage_bucket_object" "function_source" {
  name   = "backup-function-${data.archive_file.function_source.output_md5}.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.function_source.output_path
}

# Deploy the backup Cloud Function
resource "google_cloudfunctions_function" "backup_function" {
  name        = local.function_name
  description = "Fluxori backup and recovery function"
  runtime     = "nodejs14"
  
  source_archive_bucket = google_storage_bucket.function_source.name
  source_archive_object = google_storage_bucket_object.function_source.name
  
  entry_point = "backupHandler"
  
  available_memory_mb   = 1024
  timeout               = 540
  
  region                = var.region
  
  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.backup_topic.name
  }
  
  service_account_email = local.backup_service_account_id
  
  environment_variables = {
    PROJECT_ID          = var.project_id
    BACKUP_BUCKET       = var.backup_bucket_name
    LOGS_BUCKET         = var.backup_logs_bucket_name
    RETENTION_DAYS      = var.backup_retention_days
    REGION              = var.region
    FALLBACK_REGION     = var.fallback_region
    FIRESTORE_COLLECTIONS = jsonencode(var.firestore_collections)
    STORAGE_BUCKETS     = jsonencode(var.storage_buckets)
  }
}

# Create a Pub/Sub topic for the backup trigger
resource "google_pubsub_topic" "backup_topic" {
  name = "fluxori-backup-trigger"
}

# Create a Cloud Scheduler job to trigger backups
resource "google_cloud_scheduler_job" "backup_scheduler" {
  name             = local.scheduler_job_name
  description      = "Triggers daily backup of Fluxori data"
  schedule         = var.backup_schedule
  time_zone        = "Africa/Johannesburg"
  
  pubsub_target {
    topic_name = google_pubsub_topic.backup_topic.id
    data       = base64encode(jsonencode({
      action  = "backup",
      target  = "all",
      project = var.project_id
    }))
  }
}

# Create a Cloud Scheduler job for backup cleanup
resource "google_cloud_scheduler_job" "cleanup_scheduler" {
  name             = "fluxori-backup-cleanup"
  description      = "Cleans up old backups based on retention policy"
  schedule         = "0 4 * * 0"  # Run weekly on Sunday at 4AM SAST
  time_zone        = "Africa/Johannesburg"
  
  pubsub_target {
    topic_name = google_pubsub_topic.backup_topic.id
    data       = base64encode(jsonencode({
      action  = "cleanup",
      target  = "all",
      project = var.project_id
    }))
  }
}

# Set up logging for the backup system
resource "google_logging_metric" "backup_error_metric" {
  name        = "backup_errors"
  filter      = "resource.type=\"cloud_function\" resource.labels.function_name=\"${local.function_name}\" severity>=ERROR"
  description = "Count of errors in the backup function"
  
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "error_type"
      value_type  = "STRING"
      description = "The type of error"
    }
  }
  
  label_extractors = {
    "error_type" = "REGEXP_EXTRACT(textPayload, \"ERROR.*: (.*)\")"
  }
}

# Create alert for backup failures
resource "google_monitoring_alert_policy" "backup_failure_alert" {
  display_name = "Backup Failure Alert"
  combiner     = "OR"
  
  conditions {
    display_name = "Backup system errors"
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/backup_errors\" resource.type=\"cloud_function\""
      duration        = "0s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      
      aggregations {
        alignment_period   = "600s"
        per_series_aligner = "ALIGN_COUNT"
      }
    }
  }
  
  notification_channels = [
    google_monitoring_notification_channel.backup_email.name
  ]
  
  documentation {
    content   = "The backup system has encountered errors. Please check the logs and resolve the issue to ensure data protection."
    mime_type = "text/markdown"
  }
}

# Create notification channel for backup alerts
resource "google_monitoring_notification_channel" "backup_email" {
  display_name = "Backup Alerts Email"
  type         = "email"
  
  labels = {
    email_address = var.alert_email
  }
}

# Output important resource names
output "backup_bucket_name" {
  description = "Backup storage bucket name"
  value       = google_storage_bucket.backup_bucket.name
}

output "backup_logs_bucket_name" {
  description = "Backup logs bucket name"
  value       = google_storage_bucket.backup_logs_bucket.name
}

output "backup_service_account" {
  description = "Service account used for backup operations"
  value       = local.backup_service_account_id
}

output "backup_function_name" {
  description = "Name of the backup Cloud Function"
  value       = google_cloudfunctions_function.backup_function.name
}

output "backup_schedule" {
  description = "Schedule for automated backups"
  value       = var.backup_schedule
}

output "next_backup_time" {
  description = "Approximate time of the next scheduled backup"
  value       = "See Cloud Scheduler job '${local.scheduler_job_name}' for details"
}