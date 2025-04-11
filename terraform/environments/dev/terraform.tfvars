# Development Environment Configuration
# Optimized for South African regional deployment (africa-south1, Johannesburg)

# Project settings
project_id       = "fluxori-dev"
project_name     = "fluxori-dev"
billing_account  = "REPLACE_WITH_BILLING_ACCOUNT_ID"
org_id           = "REPLACE_WITH_ORGANIZATION_ID"

# Domain settings
domain           = "dev.fluxori.com"

# Region settings - using Johannesburg (South Africa) where available
region           = "africa-south1"  # Johannesburg region for most services
genai_region     = "europe-west1"   # Belgium for GenAI services (lowest latency to South Africa)
zone             = "africa-south1-a"

# Network settings
subnet_ip_cidr_range = "10.0.0.0/20"
secondary_ranges = {
  "subnet-01" = [
    {
      range_name    = "pods"
      ip_cidr_range = "10.1.0.0/16"
    },
    {
      range_name    = "services"
      ip_cidr_range = "10.2.0.0/20"
    }
  ]
}

# Storage settings - all in africa-south1 (Johannesburg)
storage_class = "STANDARD"
storage_buckets = [
  {
    name          = "fluxori-dev-files"
    location      = "africa-south1"
    force_destroy = true
    versioning    = true
  },
  {
    name          = "fluxori-dev-documents"
    location      = "africa-south1"
    force_destroy = true
    versioning    = true
  },
  {
    name          = "fluxori-dev-backups"
    location      = "africa-south1"
    force_destroy = true
    versioning    = true
  },
  {
    name          = "fluxori-dev-cdn-assets"
    location      = "africa-south1"  # Regional bucket optimized for South African access
    force_destroy = true
    versioning    = true
  }
]

# Cloud Run settings
backend_image  = "gcr.io/fluxori-dev/fluxori-backend:latest"
frontend_image = "gcr.io/fluxori-dev/fluxori-frontend:latest"

# South African optimization settings
sa_bandwidth_optimization = true
sa_connection_resilience = true
sa_cdn_compression = true
sa_mobile_network_optimization = true
sa_offline_capabilities = true
sa_network_simulation = true

# Service Accounts
service_accounts = [
  {
    account_id   = "fluxori-backend"
    display_name = "Fluxori Backend Service Account"
    description  = "Service account for the Fluxori backend application"
    roles        = [
      "roles/datastore.user",
      "roles/storage.objectAdmin",
      "roles/secretmanager.secretAccessor",
      "roles/aiplatform.user",
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
      "roles/redis.admin",
      "roles/pubsub.publisher",
      "roles/pubsub.subscriber"
    ]
  },
  {
    account_id   = "fluxori-ai"
    display_name = "Fluxori AI Service Account"
    description  = "Service account for AI operations in Fluxori"
    roles        = [
      "roles/aiplatform.user",
      "roles/storage.objectAdmin",
      "roles/datastore.user",
      "roles/logging.logWriter"
    ]
  },
  {
    account_id   = "fluxori-scheduler"
    display_name = "Fluxori Scheduler Service Account"
    description  = "Service account for scheduled jobs and maintenance"
    roles        = [
      "roles/cloudscheduler.admin",
      "roles/cloudfunctions.invoker",
      "roles/run.invoker"
    ]
  }
]

# Monitoring settings - with South African specific alerts
notification_channels = [
  {
    display_name = "Fluxori Dev Team Email"
    type         = "email"
    email        = "dev-team@fluxori.com"
  },
  {
    display_name = "Fluxori SA Operations Email"
    type         = "email"
    email        = "sa-ops@fluxori.com"
  }
]

alert_policies = [
  {
    display_name = "High CPU Usage"
    documentation = {
      content   = "The CPU usage is too high. Please check the service."
      mime_type = "text/markdown"
    }
    conditions = [
      {
        display_name = "CPU Usage over 80%"
        condition_threshold = {
          filter          = "metric.type=\"compute.googleapis.com/instance/cpu/utilization\" resource.type=\"gce_instance\""
          duration        = "60s"
          comparison      = "COMPARISON_GT"
          threshold_value = 0.8
        }
      }
    ]
  },
  {
    display_name = "AI Credits Low"
    documentation = {
      content   = "AI usage credits are running low. Please check the usage."
      mime_type = "text/markdown"
    }
    conditions = [
      {
        display_name = "AI Credits Below Threshold"
        condition_threshold = {
          filter          = "metric.type=\"custom.googleapis.com/fluxori/ai_credits_remaining\" resource.type=\"global\""
          duration        = "300s"
          comparison      = "COMPARISON_LT"
          threshold_value = 100
        }
      }
    ]
  },
  {
    display_name = "South African Network Latency"
    documentation = {
      content   = "High latency detected for South African users. This may impact user experience."
      mime_type = "text/markdown"
    }
    conditions = [
      {
        display_name = "Latency above 500ms"
        condition_threshold = {
          filter          = "metric.type=\"loadbalancing.googleapis.com/https/latencies\" resource.type=\"https_lb_rule\" metric.label.\"response_code_class\"=\"200\""
          duration        = "300s"
          comparison      = "COMPARISON_GT"
          threshold_value = 500  # 500ms threshold
        }
      }
    ]
  },
  {
    display_name = "GenAI Cross-Region Latency"
    documentation = {
      content   = "High latency detected for GenAI services from Europe to South Africa."
      mime_type = "text/markdown"
    }
    conditions = [
      {
        display_name = "GenAI Latency above 800ms"
        condition_threshold = {
          filter          = "metric.type=\"custom.googleapis.com/ai/response_latency\" resource.type=\"global\""
          duration        = "300s"
          comparison      = "COMPARISON_GT"
          threshold_value = 800  # 800ms threshold for cross-region AI requests
        }
      }
    ]
  },
  {
    display_name = "Connectivity Issues - South African Mobile Networks"
    documentation = {
      content   = "Detected connectivity issues for South African mobile network users."
      mime_type = "text/markdown"
    }
    conditions = [
      {
        display_name = "High Error Rate for Mobile Users"
        condition_threshold = {
          filter          = "metric.type=\"custom.googleapis.com/connection/errors\" resource.type=\"global\" metric.label.\"network_type\"=\"mobile\""
          duration        = "300s"
          comparison      = "COMPARISON_GT"
          threshold_value = 5  # Error rate threshold
        }
      }
    ]
  }
]