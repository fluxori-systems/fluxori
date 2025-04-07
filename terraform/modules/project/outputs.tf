/**
 * Project Module Outputs
 */

output "project_id" {
  description = "The ID of the GCP project"
  value       = google_project.fluxori_project.project_id
}

output "project_number" {
  description = "The numeric identifier of the GCP project"
  value       = google_project.fluxori_project.number
}