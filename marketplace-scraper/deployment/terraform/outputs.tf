output "service_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.marketplace_scraper.status[0].url
}

output "service_account_email" {
  description = "The email of the service account used by the Cloud Run service"
  value       = google_service_account.scraper_service_account.email
}

output "pubsub_topic" {
  description = "The Pub/Sub topic for task distribution"
  value       = google_pubsub_topic.tasks_topic.id
}

output "scheduler_jobs" {
  description = "The Cloud Scheduler jobs for the marketplace scraper"
  value = {
    daily_product_refresh = google_cloud_scheduler_job.daily_product_refresh.name
    daily_deals           = google_cloud_scheduler_job.daily_deals.name
    category_discovery    = google_cloud_scheduler_job.category_discovery.name
    search_monitoring     = google_cloud_scheduler_job.search_monitoring.name
    load_shedding_check   = google_cloud_scheduler_job.load_shedding_check.name
  }
}

output "dashboard_url" {
  description = "The URL to the Cloud Monitoring dashboard"
  value       = "https://console.cloud.google.com/monitoring/dashboards/custom/${split("/", google_monitoring_dashboard.scraper_dashboard.id)[3]}?project=${var.project_id}"
}

output "alert_policies" {
  description = "The Cloud Monitoring alert policies"
  value = {
    quota_alert     = google_monitoring_alert_policy.quota_alert.name
    error_alert     = google_monitoring_alert_policy.error_rate_alert.name
    loadshedding    = google_monitoring_alert_policy.load_shedding_alert.name
    inactivity      = google_monitoring_alert_policy.inactivity_alert.name
  }
}

output "notification_channel" {
  description = "The notification channel for alerts"
  value       = google_monitoring_notification_channel.email.name
}