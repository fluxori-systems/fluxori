/**
 * Cloud Storage Module
 * 
 * This module handles the creation and configuration of GCS buckets.
 */

# Create storage buckets based on the configuration
resource "google_storage_bucket" "buckets" {
  for_each      = { for bucket in var.storage_buckets : bucket.name => bucket }
  
  name          = each.value.name
  project       = var.project_id
  location      = each.value.location
  storage_class = var.storage_class
  force_destroy = each.value.force_destroy
  
  # Enable versioning if specified
  versioning {
    enabled = each.value.versioning
  }
  
  # Lifecycle rules for managing object lifecycle
  lifecycle_rule {
    condition {
      age = 90  # Apply to objects older than 90 days
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"  # Move to Nearline storage after 90 days
    }
  }
  
  # Add lifecycle rule for deleting old versions if versioning is enabled
  dynamic "lifecycle_rule" {
    for_each = each.value.versioning ? [1] : []
    content {
      condition {
        num_newer_versions = 5
        with_state         = "ARCHIVED"
      }
      action {
        type = "Delete"
      }
    }
  }
  
  # Enable uniform bucket-level access for improved security
  uniform_bucket_level_access = true
  
  # Enable CORS for frontend access where needed
  dynamic "cors" {
    for_each = each.value.name == "${var.project_id}-files" ? [1] : []
    content {
      origin          = ["*"]
      method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
      response_header = ["*"]
      max_age_seconds = 3600
    }
  }
}

# Set up IAM permissions for the buckets
resource "google_storage_bucket_iam_binding" "bucket_admin" {
  for_each = { for bucket in var.storage_buckets : bucket.name => bucket }
  
  bucket  = google_storage_bucket.buckets[each.key].name
  role    = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:${var.project_id}@appspot.gserviceaccount.com",
    "serviceAccount:fluxori-backend@${var.project_id}.iam.gserviceaccount.com",
  ]
  
  depends_on = [google_storage_bucket.buckets]
}

# Create a notification policy for large objects uploads
resource "google_storage_notification" "large_object_notification" {
  for_each           = { for bucket in var.storage_buckets : bucket.name => bucket if bucket.name == "${var.project_id}-files" }
  
  bucket             = google_storage_bucket.buckets[each.key].name
  payload_format     = "JSON_API_V1"
  topic              = google_pubsub_topic.large_uploads.id
  event_types        = ["OBJECT_FINALIZE"]
  object_name_prefix = ""
  
  custom_attributes = {
    bucket = each.key
  }
  
  depends_on = [google_storage_bucket.buckets, google_pubsub_topic.large_uploads]
}

# Create a Pub/Sub topic for large file uploads
resource "google_pubsub_topic" "large_uploads" {
  name    = "${var.project_id}-large-uploads"
  project = var.project_id
  
  message_retention_duration = "86600s"  # 24 hours
  
  # Add labels for better organization
  labels = {
    purpose = "storage-notifications"
  }
}