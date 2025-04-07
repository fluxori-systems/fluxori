/**
 * Secret Manager Module Outputs
 */

output "secret_ids" {
  description = "The IDs of the created secrets"
  value       = { for k, v in google_secret_manager_secret.secrets : k => v.id }
  sensitive   = true
}

output "common_secret_ids" {
  description = "The IDs of the common secrets"
  value       = { for k, v in google_secret_manager_secret.common_secrets : k => v.id }
  sensitive   = true
}