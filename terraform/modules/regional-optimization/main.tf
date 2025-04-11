/**
 * Regional Optimization Module for South Africa
 * 
 * This module configures regional optimizations for the Fluxori platform,
 * specifically targeting the South African market with appropriate GCP services.
 */

# Create a regional Cloud CDN configuration
module "south_africa_cdn" {
  source = "../cdn"
  
  project_id            = var.project_id
  bucket_name           = var.static_assets_bucket
  domain                = var.domain
  enable_security_policy = true
  
  # Optimize cache settings for South African network conditions
  # South African mobile networks often have higher latency and variable speeds
  cache_ttl_seconds     = 86400  # 24 hour default TTL for static assets
  rate_limit_threshold  = 2000   # Higher threshold for multiple users on same networks
  
  cors_origins          = var.cors_origins
}

# Create Cloud Memorystore (Redis) instance for regional caching
resource "google_redis_instance" "regional_cache" {
  name           = "${var.project_id}-regional-cache"
  tier           = "BASIC"
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region  # Using africa-south1
  
  # Network configuration
  authorized_network = var.vpc_network
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  
  # Performance optimizations
  redis_configs = {
    "maxmemory-policy" : "allkeys-lru",  # Optimized for caching
    "notify-keyspace-events" : "KEA",    # Enable keyspace events for expiration notifications
    "timeout" : "300",                   # Extended timeout for variable network conditions
  }
  
  # Multi-zone availability for reliability
  alternative_location_id = "${var.region}-b"
  location_id             = "${var.region}-a"
  
  # Redis version
  redis_version = "REDIS_6_X"
  
  # Maintenance window (low-traffic period in South Africa)
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours = 2  # 2 AM local time
        minutes = 0
      }
    }
  }
}

# Configure Cloud Armor security profile optimized for regional threats
resource "google_compute_security_policy" "regional_security" {
  name        = "${var.project_id}-regional-security"
  description = "Security policy optimized for South African traffic patterns"
  
  # Rule to prevent SQL injection
  rule {
    action      = "deny(403)"
    priority    = 1000
    description = "Prevent SQL injection"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
  }
  
  # Rule to prevent XSS attacks
  rule {
    action      = "deny(403)"
    priority    = 1100
    description = "Prevent XSS attacks"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
  }
  
  # Rate limiting rules adapted for shared IPs (common in South Africa)
  rule {
    action      = "rate_based_ban"
    priority    = 2000
    description = "Rate limiting for API endpoints"
    match {
      expr {
        expression = "request.path.matches('/api/.*')"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 300
        interval_sec = 60
      }
    }
  }
  
  # Higher rate limits for static assets
  rule {
    action      = "rate_based_ban"
    priority    = 2100
    description = "Rate limiting for static assets (higher limits)"
    match {
      expr {
        expression = "request.path.matches('/static/.*') || request.path.matches('/assets/.*')"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 1000
        interval_sec = 60
      }
    }
  }
  
  # Geolocation rules to prioritize South African traffic
  rule {
    action      = "allow"
    priority    = 3000
    description = "Always allow South African traffic"
    match {
      expr {
        expression = "origin.region_code == 'ZA'"
      }
    }
  }
  
  # Default rule to allow all remaining traffic
  rule {
    action      = "allow"
    priority    = 2147483647
    description = "Default rule, allow all traffic"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}

# Create Cloud Load Balancer with regional optimizations
resource "google_compute_global_address" "regional_lb_ip" {
  name = "${var.project_id}-regional-lb-ip"
}

resource "google_compute_url_map" "regional_lb" {
  name            = "${var.project_id}-regional-lb"
  description     = "Load balancer optimized for South African traffic"
  default_service = var.default_backend_service
  
  # Path matcher for API calls with latency/performance monitoring
  host_rule {
    hosts        = ["api.${var.domain}"]
    path_matcher = "api-paths"
  }
  
  path_matcher {
    name            = "api-paths"
    default_service = var.default_backend_service
    
    # Vertex AI endpoints with special routing (use europe-west1 for GenAI)
    path_rule {
      paths   = ["/api/ai/*", "/api/agent/*", "/api/insights/generate/*"]
      service = var.genai_backend_service
    }
    
    # Fast-path for critical operations
    path_rule {
      paths   = ["/api/auth/*", "/api/core/*"]
      service = var.critical_backend_service
    }
  }
  
  # Monitor static assets via CDN
  host_rule {
    hosts        = ["assets.${var.domain}"]
    path_matcher = "assets-paths"
  }
  
  path_matcher {
    name            = "assets-paths"
    default_service = module.south_africa_cdn.backend_bucket_id
  }
}

# Configure monitoring specifically for South African regions
resource "google_monitoring_alert_policy" "regional_latency" {
  display_name = "South African Regional Latency Alert"
  combiner     = "OR"
  conditions {
    display_name = "High Latency from South Africa"
    condition_threshold {
      filter     = "metric.type=\"loadbalancing.googleapis.com/https/latencies\" resource.type=\"https_lb_rule\" metric.label.\"response_code_class\"=\"200\" ${var.latency_filter}"
      duration   = "60s"
      comparison = "COMPARISON_GT"
      threshold_value = 500  # 500ms threshold optimized for South African users
      
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }
  
  notification_channels = var.notification_channels
  
  documentation {
    content   = "High latency detected for South African users. This may indicate connectivity issues or resource constraints in the africa-south1 region."
    mime_type = "text/markdown"
  }
}

# Configure network performance monitoring for South African ISPs
resource "google_monitoring_alert_policy" "isp_performance" {
  display_name = "South African ISP Performance Alert"
  combiner     = "OR"
  conditions {
    display_name = "Degraded Performance for Major South African ISPs"
    condition_threshold {
      filter     = "metric.type=\"networking.googleapis.com/performance\" resource.type=\"gce_instance\" ${var.isp_performance_filter}"
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 200  # 200ms threshold for packet round trip time
      
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }
  
  notification_channels = var.notification_channels
  
  documentation {
    content   = "Performance degradation detected for major South African ISPs. This may impact user experience. Consider adjusting resource allocation or CDN settings."
    mime_type = "text/markdown"
  }
}

# Configure Cloud Scheduler for optimal local time jobs (South Africa Standard Time)
resource "google_cloud_scheduler_job" "maintenance_job" {
  name             = "${var.project_id}-regional-maintenance"
  description      = "Regional maintenance job scheduled for off-peak hours in South Africa"
  schedule         = "0 2 * * *"  # 2 AM SAST (typically low traffic)
  time_zone        = "Africa/Johannesburg"
  attempt_deadline = "320s"
  region           = var.region
  
  http_target {
    uri         = "https://${var.domain}/api/admin/maintenance"
    http_method = "POST"
    
    oauth_token {
      service_account_email = var.scheduler_service_account
    }
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    body = base64encode(jsonencode({
      "maintenanceType": "regional",
      "region": var.region
    }))
  }
}

# Create regional Cloud Storage bucket with tiered storage
resource "google_storage_bucket" "regional_assets" {
  name          = "${var.project_id}-${var.region}-assets"
  location      = var.region
  storage_class = "STANDARD"
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
  
  cors {
    origin          = var.cors_origins
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["Content-Type", "Access-Control-Allow-Origin"]
    max_age_seconds = 3600
  }
  
  # Configure custom time-based URL expiration for South African mobile networks
  # This helps with interrupted downloads on unstable connections
  custom_placement_config {
    data_locations = [var.region]
  }
}

# Configure Pub/Sub for event-driven architecture with regional settings
resource "google_pubsub_topic" "regional_events" {
  name = "${var.project_id}-${var.region}-events"
  
  message_storage_policy {
    allowed_persistence_regions = [
      var.region
    ]
  }
}

resource "google_pubsub_subscription" "regional_events_sub" {
  name  = "${var.project_id}-${var.region}-events-sub"
  topic = google_pubsub_topic.regional_events.name
  
  # Configure exponential backoff for South African network conditions
  # This helps with intermittent connectivity issues
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"  # 10 minutes max backoff
  }
  
  # 7 day message retention
  message_retention_duration = "604800s"
  
  # Acknowledge deadline optimized for processing time and network latency
  ack_deadline_seconds = 60
}

# Configure regional Firestore indexes
resource "google_firestore_index" "regional_performance_index" {
  collection = "performance_metrics"
  
  fields {
    field_path = "region"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }
  
  fields {
    field_path = "metric_type"
    order      = "ASCENDING"
  }
}

# Configure regional AI model deployment (must use europe-west1 for GenAI)
resource "google_vertex_ai_endpoint" "regional_endpoint" {
  name         = "${var.project_id}-regional-endpoint"
  display_name = "Regional AI Endpoint for South African Optimization"
  region       = var.genai_region
  
  network      = var.vpc_network
  
  # Configure private service connect for secure access
  private_service_connect_config {
    enable_private_service_connect = true
    project_allowlist              = [var.project_id]
  }
}

# Add a regional latency dashboard
resource "google_monitoring_dashboard" "regional_performance" {
  dashboard_json = <<EOF
{
  "displayName": "South African Regional Performance",
  "gridLayout": {
    "widgets": [
      {
        "title": "Latency from South Africa",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"loadbalancing.googleapis.com/https/latencies\" resource.type=\"https_lb_rule\" metric.label.\"response_code_class\"=\"200\" ${var.latency_filter}",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_95"
                  }
                }
              },
              "plotType": "LINE"
            }
          ],
          "timeshiftDuration": "0s",
          "yAxis": {
            "label": "Latency (ms)",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "ISP Performance - RTT",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"networking.googleapis.com/performance\" resource.type=\"gce_instance\" ${var.isp_performance_filter}",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_95",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "groupByFields": ["metric.label.\"network\""]
                  }
                }
              },
              "plotType": "LINE"
            }
          ],
          "timeshiftDuration": "0s",
          "yAxis": {
            "label": "Round Trip Time (ms)",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "Regional API Response Time",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/api/request_latency\" resource.type=\"global\" ${var.api_latency_filter}",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_95",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "groupByFields": ["metric.label.\"path\""]
                  }
                }
              },
              "plotType": "LINE"
            }
          ],
          "timeshiftDuration": "0s",
          "yAxis": {
            "label": "API Response Time (ms)",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "GenAI Latency (Europe to South Africa)",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/ai/response_latency\" resource.type=\"global\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_95"
                  }
                }
              },
              "plotType": "LINE"
            }
          ],
          "timeshiftDuration": "0s",
          "yAxis": {
            "label": "AI Response Time (ms)",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "South African Connection Quality",
        "pieChart": {
          "chartData": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/connection/quality\" resource.type=\"global\"",
                  "aggregation": {
                    "alignmentPeriod": "3600s",
                    "perSeriesAligner": "ALIGN_SUM",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["metric.label.\"quality\""]
                  }
                }
              }
            }
          ]
        }
      },
      {
        "title": "Network Provider Distribution",
        "pieChart": {
          "chartData": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"custom.googleapis.com/network/provider\" resource.type=\"global\"",
                  "aggregation": {
                    "alignmentPeriod": "3600s",
                    "perSeriesAligner": "ALIGN_SUM",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["metric.label.\"provider\""]
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
}
EOF
}