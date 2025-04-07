/**
 * IAM Module Outputs
 */

output "service_account_emails" {
  description = "The email addresses of the service accounts"
  value       = { for k, v in google_service_account.service_accounts : k => v.email }
}

output "default_service_account_emails" {
  description = "The email addresses of the default service accounts"
  value       = { for k, v in google_service_account.default_service_accounts : k => v.email }
}

output "credit_manager_role_id" {
  description = "The ID of the credit manager custom role"
  value       = google_project_iam_custom_role.credit_manager.id
}