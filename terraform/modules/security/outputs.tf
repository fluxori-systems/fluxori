/**
 * Outputs for the security module
 */

output "security_policy_id" {
  description = "The ID of the Cloud Armor security policy"
  value       = google_compute_security_policy.backend_security_policy.id
}

output "security_policy_name" {
  description = "The name of the Cloud Armor security policy"
  value       = google_compute_security_policy.backend_security_policy.name
}

output "security_policy_fingerprint" {
  description = "The fingerprint of the Cloud Armor security policy"
  value       = google_compute_security_policy.backend_security_policy.fingerprint
}

output "security_scanner_id" {
  description = "The ID of the security scanner configuration"
  value       = var.enable_security_scanner ? google_security_scanner_scan_config.security_scan[0].id : null
}