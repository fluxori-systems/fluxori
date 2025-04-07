/**
 * Cloud Storage Module Outputs
 */

output "bucket_urls" {
  description = "The URLs of the storage buckets"
  value = { for bucket_name, bucket in google_storage_bucket.buckets : bucket_name => bucket.url }
}

output "bucket_names" {
  description = "The names of the storage buckets"
  value = { for bucket_name, bucket in google_storage_bucket.buckets : bucket_name => bucket.name }
}

output "large_uploads_topic" {
  description = "The Pub/Sub topic for large file uploads"
  value = google_pubsub_topic.large_uploads.id
}