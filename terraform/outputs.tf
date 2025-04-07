/**
 * Fluxori SaaS - Outputs
 * 
 * This file defines the outputs from the Terraform configuration.
 */

# Project outputs
output "project_id" {
  description = "The ID of the GCP project"
  value       = module.project.project_id
}

# Firestore outputs
output "firestore_database_id" {
  description = "The ID of the Firestore database"
  value       = module.firestore.database_id
}

# Cloud Storage outputs
output "storage_bucket_urls" {
  description = "The URLs of the storage buckets"
  value       = module.cloud_storage.bucket_urls
}

# Cloud Run outputs
output "backend_service_url" {
  description = "The URL of the backend service"
  value       = module.cloud_run.backend_service_url
}

output "frontend_service_url" {
  description = "The URL of the frontend service"
  value       = module.cloud_run.frontend_service_url
}

# Vertex AI outputs
output "vector_search_index_id" {
  description = "The ID of the Vertex AI Vector Search index"
  value       = module.vertex_ai.vector_search_index_id
}

# VPC outputs
output "network_id" {
  description = "The ID of the VPC network"
  value       = module.vpc.network_id
}

output "subnet_id" {
  description = "The ID of the subnet"
  value       = module.vpc.subnet_id
}

output "vpc_connector_id" {
  description = "The ID of the VPC connector"
  value       = module.vpc.connector_id
}

# Service Account outputs
output "service_account_emails" {
  description = "The email addresses of the service accounts"
  value       = module.iam.service_account_emails
}