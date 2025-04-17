/**
 * Terraform configuration for Marketplace Scraper infrastructure
 */

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required services
resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "cloudscheduler.googleapis.com",
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "pubsub.googleapis.com",
    "monitoring.googleapis.com",
    "cloudtrace.googleapis.com",
    "cloudbuild.googleapis.com",
  ])
  
  project = var.project_id
  service = each.key
  
  disable_dependent_services = false
  disable_on_destroy         = false
}

# Create service account for the scraper
resource "google_service_account" "scraper_service_account" {
  account_id   = "marketplace-scraper-sa"
  display_name = "Marketplace Scraper Service Account"
  description  = "Service account for the marketplace scraper application"
  
  depends_on = [google_project_service.services]
}

# Grant IAM roles to the service account
resource "google_project_iam_member" "service_account_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/secretmanager.secretAccessor",
    "roles/monitoring.metricWriter",
    "roles/pubsub.publisher",
    "roles/cloudtrace.agent",
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.scraper_service_account.email}"
}

# Create SmartProxy auth token secret
resource "google_secret_manager_secret" "smartproxy_token" {
  secret_id = "smartproxy-auth-token"
  
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
  
  depends_on = [google_project_service.services]
}

# Initial version of the secret (you'll need to update this manually via the console or CLI)
resource "google_secret_manager_secret_version" "smartproxy_token_version" {
  secret      = google_secret_manager_secret.smartproxy_token.id
  secret_data = var.smartproxy_auth_token
}

# Grant the service account access to the secret
resource "google_secret_manager_secret_iam_member" "secret_access" {
  secret_id = google_secret_manager_secret.smartproxy_token.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.scraper_service_account.email}"
}

# Create Pub/Sub topic for task distribution
resource "google_pubsub_topic" "tasks_topic" {
  name = "marketplace-scraper-tasks"
  
  depends_on = [google_project_service.services]
}

# Create Firestore indexes
resource "google_firestore_index" "product_index" {
  project     = var.project_id
  collection  = "products"
  queryScope  = "COLLECTION"
  
  fields {
    field_path = "marketplace"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "category"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "updatedAt"
    order      = "DESCENDING"
  }
  
  depends_on = [google_project_service.services]
}

resource "google_firestore_index" "category_index" {
  project     = var.project_id
  collection  = "categories"
  queryScope  = "COLLECTION"
  
  fields {
    field_path = "marketplace"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "parent"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "name"
    order      = "ASCENDING"
  }
  
  depends_on = [google_project_service.services]
}

resource "google_firestore_index" "search_index" {
  project     = var.project_id
  collection  = "search_results"
  queryScope  = "COLLECTION"
  
  fields {
    field_path = "marketplace"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "keyword"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }
  
  depends_on = [google_project_service.services]
}

# Cloud Run service
resource "google_cloud_run_service" "marketplace_scraper" {
  name     = var.service_name
  location = var.region
  
  template {
    spec {
      containers {
        image = var.container_image
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "GCP_REGION"
          value = var.region
        }
        
        env {
          name  = "CONFIG_PATH"
          value = "/app/deployment/config.json"
        }
        
        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }
      }
      
      service_account_name = google_service_account.scraper_service_account.email
      timeout_seconds      = var.timeout_seconds
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = var.max_instances
        "autoscaling.knative.dev/minScale"      = var.min_instances
        "run.googleapis.com/client-name"        = "terraform"
        "run.googleapis.com/cloudsql-instances" = ""
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.services,
    google_project_iam_member.service_account_roles
  ]
}

# Make the Cloud Run service public
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_service.marketplace_scraper.location
  project  = google_cloud_run_service.marketplace_scraper.project
  service  = google_cloud_run_service.marketplace_scraper.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Create Cloud Scheduler jobs
resource "google_cloud_scheduler_job" "daily_product_refresh" {
  name        = "marketplace-scraper-daily-product-refresh"
  description = "Refresh product data from Takealot every 4 hours"
  schedule    = "0 */4 * * *"
  time_zone   = "Africa/Johannesburg"
  
  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.marketplace_scraper.status[0].url}/tasks/execute"
    
    body = base64encode(jsonencode({
      task_type   = "refresh_products",
      marketplace = "takealot",
      params = {
        max_count = 500
      },
      priority = "HIGH"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = google_service_account.scraper_service_account.email
      audience              = google_cloud_run_service.marketplace_scraper.status[0].url
    }
  }
  
  depends_on = [google_project_service.services]
}

resource "google_cloud_scheduler_job" "daily_deals" {
  name        = "marketplace-scraper-daily-deals"
  description = "Extract daily deals from Takealot three times per day"
  schedule    = "0 9,13,17 * * *"
  time_zone   = "Africa/Johannesburg"
  
  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.marketplace_scraper.status[0].url}/tasks/execute"
    
    body = base64encode(jsonencode({
      task_type   = "extract_daily_deals",
      marketplace = "takealot",
      params      = {},
      priority    = "HIGH"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = google_service_account.scraper_service_account.email
      audience              = google_cloud_run_service.marketplace_scraper.status[0].url
    }
  }
  
  depends_on = [google_project_service.services]
}

resource "google_cloud_scheduler_job" "category_discovery" {
  name        = "marketplace-scraper-category-discovery"
  description = "Discover products from categories once per day"
  schedule    = "0 1 * * *"
  time_zone   = "Africa/Johannesburg"
  
  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.marketplace_scraper.status[0].url}/tasks/execute"
    
    body = base64encode(jsonencode({
      task_type   = "discover_products",
      marketplace = "takealot",
      params = {
        categories = [
          "electronics",
          "computers",
          "phones",
          "home-kitchen",
          "beauty",
          "appliances",
          "tv-video"
        ],
        max_per_category = 100
      },
      priority = "MEDIUM"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = google_service_account.scraper_service_account.email
      audience              = google_cloud_run_service.marketplace_scraper.status[0].url
    }
  }
  
  depends_on = [google_project_service.services]
}

resource "google_cloud_scheduler_job" "search_monitoring" {
  name        = "marketplace-scraper-search-monitoring"
  description = "Monitor search results for popular keywords twice per day"
  schedule    = "0 10,15 * * 1-5"
  time_zone   = "Africa/Johannesburg"
  
  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.marketplace_scraper.status[0].url}/tasks/execute"
    
    body = base64encode(jsonencode({
      task_type   = "search",
      marketplace = "takealot",
      params = {
        keywords = [
          "iphone",
          "samsung",
          "laptop",
          "headphones",
          "smart tv"
        ],
        max_per_keyword = 50
      },
      priority = "MEDIUM"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = google_service_account.scraper_service_account.email
      audience              = google_cloud_run_service.marketplace_scraper.status[0].url
    }
  }
  
  depends_on = [google_project_service.services]
}

resource "google_cloud_scheduler_job" "load_shedding_check" {
  name        = "marketplace-scraper-load-shedding-check"
  description = "Check for load shedding every 30 minutes"
  schedule    = "*/30 * * * *"
  time_zone   = "Africa/Johannesburg"
  
  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.marketplace_scraper.status[0].url}/tasks/execute"
    
    body = base64encode(jsonencode({
      task_type   = "check_load_shedding",
      marketplace = "takealot",
      params      = {},
      priority    = "CRITICAL"
    }))
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    oidc_token {
      service_account_email = google_service_account.scraper_service_account.email
      audience              = google_cloud_run_service.marketplace_scraper.status[0].url
    }
  }
  
  depends_on = [google_project_service.services]
}

# Create Cloud Monitoring dashboard
resource "google_monitoring_dashboard" "scraper_dashboard" {
  dashboard_json = jsonencode({
    "displayName" = "Marketplace Scraper Dashboard",
    "gridLayout" = {
      "widgets" = [
        {
          "title" = "API Quota Usage",
          "xyChart" = {
            "dataSets" = [
              {
                "timeSeriesQuery" = {
                  "timeSeriesFilter" = {
                    "filter" = "metric.type=\"custom.googleapis.com/marketplace_scraper/quota_usage\" resource.type=\"global\"",
                    "aggregation" = {
                      "alignmentPeriod" = "60s",
                      "perSeriesAligner" = "ALIGN_MEAN"
                    }
                  }
                },
                "plotType" = "LINE"
              }
            ]
          }
        },
        {
          "title" = "Request Success Rate",
          "xyChart" = {
            "dataSets" = [
              {
                "timeSeriesQuery" = {
                  "timeSeriesFilter" = {
                    "filter" = "metric.type=\"custom.googleapis.com/marketplace_scraper/success_rate\" resource.type=\"global\"",
                    "aggregation" = {
                      "alignmentPeriod" = "60s",
                      "perSeriesAligner" = "ALIGN_MEAN"
                    }
                  }
                },
                "plotType" = "LINE"
              }
            ]
          }
        },
        {
          "title" = "Task Execution Count",
          "xyChart" = {
            "dataSets" = [
              {
                "timeSeriesQuery" = {
                  "timeSeriesFilter" = {
                    "filter" = "metric.type=\"custom.googleapis.com/marketplace_scraper/tasks_completed\" resource.type=\"global\"",
                    "aggregation" = {
                      "alignmentPeriod" = "60s",
                      "perSeriesAligner" = "ALIGN_SUM"
                    }
                  }
                },
                "plotType" = "LINE"
              }
            ]
          }
        },
        {
          "title" = "Load Shedding Status",
          "xyChart" = {
            "dataSets" = [
              {
                "timeSeriesQuery" = {
                  "timeSeriesFilter" = {
                    "filter" = "metric.type=\"custom.googleapis.com/marketplace_scraper/loadshedding_detected\" resource.type=\"global\"",
                    "aggregation" = {
                      "alignmentPeriod" = "60s",
                      "perSeriesAligner" = "ALIGN_MAX"
                    }
                  }
                },
                "plotType" = "LINE"
              }
            ]
          }
        },
        {
          "title" = "Products Scraped",
          "xyChart" = {
            "dataSets" = [
              {
                "timeSeriesQuery" = {
                  "timeSeriesFilter" = {
                    "filter" = "metric.type=\"custom.googleapis.com/marketplace_scraper/products_scraped\" resource.type=\"global\"",
                    "aggregation" = {
                      "alignmentPeriod" = "60s",
                      "perSeriesAligner" = "ALIGN_SUM"
                    }
                  }
                },
                "plotType" = "LINE"
              }
            ]
          }
        },
        {
          "title" = "Response Time",
          "xyChart" = {
            "dataSets" = [
              {
                "timeSeriesQuery" = {
                  "timeSeriesFilter" = {
                    "filter" = "metric.type=\"custom.googleapis.com/marketplace_scraper/response_time\" resource.type=\"global\"",
                    "aggregation" = {
                      "alignmentPeriod" = "60s",
                      "perSeriesAligner" = "ALIGN_MEAN"
                    }
                  }
                },
                "plotType" = "LINE"
              }
            ]
          }
        }
      ]
    }
  })
  
  depends_on = [google_project_service.services]
}

# Create alert policies
resource "google_monitoring_alert_policy" "quota_alert" {
  display_name = "Marketplace Scraper - High Quota Usage"
  combiner     = "OR"
  
  conditions {
    display_name = "Quota Usage > 80%"
    
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/marketplace_scraper/quota_usage\" resource.type=\"global\""
      duration        = "0s"
      comparison      = "COMPARISON_GT"
      threshold_value = 80
      
      trigger {
        count = 1
      }
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.name]
  
  documentation {
    content = "SmartProxy API quota usage exceeded 80% of monthly allocation."
    mime_type = "text/markdown"
  }
  
  alert_strategy {
    notification_rate_limit {
      period = "3600s"  # One notification per hour max
    }
  }
  
  depends_on = [google_project_service.services]
}

resource "google_monitoring_alert_policy" "error_rate_alert" {
  display_name = "Marketplace Scraper - High Error Rate"
  combiner     = "OR"
  
  conditions {
    display_name = "Error Rate > 20%"
    
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/marketplace_scraper/error_rate\" resource.type=\"global\""
      duration        = "600s"  # 10 minutes
      comparison      = "COMPARISON_GT"
      threshold_value = 20
      
      trigger {
        count = 1
      }
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.name]
  
  documentation {
    content = "Marketplace scraper error rate exceeded 20% over 10-minute window."
    mime_type = "text/markdown"
  }
  
  alert_strategy {
    notification_rate_limit {
      period = "1800s"  # Notification every 30 minutes max
    }
  }
  
  depends_on = [google_project_service.services]
}

resource "google_monitoring_alert_policy" "load_shedding_alert" {
  display_name = "Marketplace Scraper - Load Shedding Detected"
  combiner     = "OR"
  
  conditions {
    display_name = "Load Shedding Detected"
    
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/marketplace_scraper/loadshedding_detected\" resource.type=\"global\""
      duration        = "0s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      
      trigger {
        count = 1
      }
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.name]
  
  documentation {
    content = "Load shedding detected, scraper operating in reduced functionality mode."
    mime_type = "text/markdown"
  }
  
  alert_strategy {
    notification_rate_limit {
      period = "7200s"  # Notification every 2 hours max
    }
  }
  
  depends_on = [google_project_service.services]
}

resource "google_monitoring_alert_policy" "inactivity_alert" {
  display_name = "Marketplace Scraper - Service Inactivity"
  combiner     = "OR"
  
  conditions {
    display_name = "No Tasks for 6 Hours"
    
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/marketplace_scraper/tasks_completed\" resource.type=\"global\""
      duration        = "21600s"  # 6 hours
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      
      trigger {
        count = 1
      }
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.name]
  
  documentation {
    content = "Marketplace scraper has not performed any tasks for an extended period."
    mime_type = "text/markdown"
  }
  
  alert_strategy {
    notification_rate_limit {
      period = "21600s"  # Notification every 6 hours max
    }
  }
  
  depends_on = [google_project_service.services]
}

# Create notification channel
resource "google_monitoring_notification_channel" "email" {
  display_name = "Marketplace Scraper Alerts"
  type         = "email"
  
  labels = {
    email_address = var.notification_email
  }
  
  depends_on = [google_project_service.services]
}