/**
 * Service Mesh Module Outputs
 */

output "service_auth_email" {
  description = "Email of the service account for service-to-service authentication"
  value       = google_service_account.service_auth.email
}

output "iap_client_id" {
  description = "Client ID for the IAP OAuth client"
  value       = google_iap_client.internal_client.client_id
}

output "iap_client_secret" {
  description = "Client secret for the IAP OAuth client"
  value       = google_iap_client.internal_client.secret
  sensitive   = true
}

output "internal_services_ip" {
  description = "IP address for internal services"
  value       = google_compute_global_address.internal_services_ip.address
}

output "internal_services_url" {
  description = "URL for internal services"
  value       = var.internal_services_domain != "" ? "https://${var.internal_services_domain}" : "http://${google_compute_global_address.internal_services_ip.address}"
}