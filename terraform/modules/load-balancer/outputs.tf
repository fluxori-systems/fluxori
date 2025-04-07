/**
 * Outputs for the load balancer module
 */

output "load_balancer_ip" {
  description = "The IP address of the load balancer"
  value       = google_compute_global_address.static_ip.address
}

output "backend_service_id" {
  description = "The ID of the backend service"
  value       = google_compute_backend_service.backend_service.id
}

output "backend_service_name" {
  description = "The name of the backend service"
  value       = google_compute_backend_service.backend_service.name
}

output "ssl_certificate_id" {
  description = "The ID of the SSL certificate"
  value       = google_compute_managed_ssl_certificate.ssl_cert.id
}

output "health_check_id" {
  description = "The ID of the health check"
  value       = google_compute_health_check.backend_health_check.id
}

output "https_forwarding_rule_id" {
  description = "The ID of the HTTPS forwarding rule"
  value       = google_compute_global_forwarding_rule.https_forwarding_rule.id
}

output "url_map_id" {
  description = "The ID of the URL map"
  value       = google_compute_url_map.url_map.id
}