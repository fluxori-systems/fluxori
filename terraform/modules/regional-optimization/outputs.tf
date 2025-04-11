/**
 * Outputs for the Regional Optimization Module
 */

output "cdn_backend_bucket_id" {
  description = "The ID of the CDN backend bucket"
  value       = module.south_africa_cdn.backend_bucket_id
}

output "cdn_url_map_id" {
  description = "The ID of the CDN URL map"
  value       = module.south_africa_cdn.url_map_id
}

output "regional_cache_endpoint" {
  description = "The endpoint of the regional Redis cache"
  value       = google_redis_instance.regional_cache.host
}

output "regional_storage_bucket" {
  description = "The name of the regional storage bucket"
  value       = google_storage_bucket.regional_assets.name
}

output "regional_pubsub_topic" {
  description = "The ID of the regional Pub/Sub topic"
  value       = google_pubsub_topic.regional_events.id
}

output "regional_pubsub_subscription" {
  description = "The ID of the regional Pub/Sub subscription"
  value       = google_pubsub_subscription.regional_events_sub.id
}

output "regional_lb_ip" {
  description = "The IP address of the regional load balancer"
  value       = google_compute_global_address.regional_lb_ip.address
}

output "regional_url_map_id" {
  description = "The ID of the regional URL map"
  value       = google_compute_url_map.regional_lb.id
}

output "genai_endpoint_id" {
  description = "The ID of the GenAI endpoint in Europe optimized for South African access"
  value       = google_vertex_ai_endpoint.regional_endpoint.id
}

output "security_policy_id" {
  description = "The ID of the regional security policy"
  value       = google_compute_security_policy.regional_security.id
}

output "monitoring_dashboard_name" {
  description = "The name of the regional performance monitoring dashboard"
  value       = google_monitoring_dashboard.regional_performance.dashboard_json
}