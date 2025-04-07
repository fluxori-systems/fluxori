/**
 * Outputs for the Cloud CDN Module
 */

output "backend_bucket_name" {
  description = "The name of the backend bucket"
  value       = google_compute_backend_bucket.static_assets.name
}

output "cdn_url_map_id" {
  description = "The ID of the URL map"
  value       = google_compute_url_map.static_assets.id
}

output "cdn_ip_address" {
  description = "The IP address of the CDN"
  value       = google_compute_global_address.cdn_ip.address
}

output "cdn_url" {
  description = "The URL of the CDN"
  value       = var.domain != "" ? "https://assets.${var.domain}" : "https://${google_compute_global_address.cdn_ip.address}"
}

output "security_policy_id" {
  description = "The ID of the security policy"
  value       = var.enable_security_policy ? google_compute_security_policy.cdn_security_policy[0].id : null
}