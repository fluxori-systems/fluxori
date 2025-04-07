/**
 * Cloud Run Module Outputs
 */

output "backend_service_url" {
  description = "The URL of the backend service"
  value       = google_cloud_run_service.backend.status[0].url
}

output "frontend_service_url" {
  description = "The URL of the frontend service"
  value       = google_cloud_run_service.frontend.status[0].url
}

output "backend_service_name" {
  description = "The name of the backend service"
  value       = google_cloud_run_service.backend.name
}

output "frontend_service_name" {
  description = "The name of the frontend service"
  value       = google_cloud_run_service.frontend.name
}

output "frontend_domain_mapping" {
  description = "The domain mapping for the frontend service"
  value       = var.frontend_domain != "" ? google_cloud_run_domain_mapping.frontend_domain[0].status[0].resource_records : null
}

output "backend_service_id" {
  description = "The ID of the backend Cloud Run service"
  value       = google_cloud_run_service.backend.id
}

output "frontend_service_id" {
  description = "The ID of the frontend Cloud Run service"
  value       = google_cloud_run_service.frontend.id
}

output "backend_service_neg_id" {
  description = "The Network Endpoint Group ID of the backend service"
  value       = "projects/${var.project_id}/regions/${var.region}/networkEndpointGroups/${google_cloud_run_service.backend.name}"
}

output "frontend_service_neg_id" {
  description = "The Network Endpoint Group ID of the frontend service"
  value       = "projects/${var.project_id}/regions/${var.region}/networkEndpointGroups/${google_cloud_run_service.frontend.name}"
}