/**
 * Monitoring Module Outputs
 */

output "notification_channel_ids" {
  description = "The IDs of the created notification channels"
  value       = { for k, v in google_monitoring_notification_channel.notification_channels : k => v.id }
}

output "alert_policy_ids" {
  description = "The IDs of the created alert policies"
  value       = { for k, v in google_monitoring_alert_policy.alert_policies : k => v.id }
}

output "dashboard_id" {
  description = "The ID of the Fluxori dashboard"
  value       = google_monitoring_dashboard.fluxori_dashboard.dashboard_id
}

output "ai_credits_metric_id" {
  description = "The ID of the AI credits metric"
  value       = google_monitoring_metric_descriptor.ai_credits_metric.id
}