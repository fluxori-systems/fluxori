# Production Environment Configuration

# Project settings
project_id       = "fluxori-prod"
project_name     = "fluxori-prod"
billing_account  = "REPLACE_WITH_BILLING_ACCOUNT_ID"
org_id           = "REPLACE_WITH_ORGANIZATION_ID"

# Region settings - using Johannesburg (South Africa) where available
region           = "africa-south1"
genai_region     = "europe-west4"  # Using Netherlands for GenAI services (closer to South Africa)
zone             = "africa-south1-a"

# Network settings
subnet_ip_cidr_range = "10.10.0.0/20"
secondary_ranges = {
  "subnet-01" = [
    {
      range_name    = "pods"
      ip_cidr_range = "10.11.0.0/16"
    },
    {
      range_name    = "services"
      ip_cidr_range = "10.12.0.0/20"
    }
  ]
}

# Storage settings
storage_class = "STANDARD"
storage_buckets = [
  {
    name          = "fluxori-prod-files"
    location      = "africa-south1"
    force_destroy = false
    versioning    = true
  },
  {
    name          = "fluxori-prod-documents"
    location      = "africa-south1"
    force_destroy = false
    versioning    = true
  },
  {
    name          = "fluxori-prod-backups"
    location      = "MULTI_REGIONAL"  # Using multi-regional for backups in production
    force_destroy = false
    versioning    = true
  }
]

# Cloud Run settings
backend_image  = "gcr.io/fluxori-prod/fluxori-backend:stable"
frontend_image = "gcr.io/fluxori-prod/fluxori-frontend:stable"

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
      "roles/monitoring.metricWriter"
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
  }
]

# Monitoring settings
notification_channels = [
  {
    display_name = "Fluxori Operations Team Email"
    type         = "email"
    email        = "ops@fluxori.com"
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
          threshold_value = 500
        }
      }
    ]
  },
  {
    display_name = "Error Rate High"
    documentation = {
      content   = "The error rate is too high. Please check the logs."
      mime_type = "text/markdown"
    }
    conditions = [
      {
        display_name = "Error Rate Over 5%"
        condition_threshold = {
          filter          = "metric.type=\"logging.googleapis.com/log_entry_count\" resource.type=\"cloud_run_revision\" severity=\"ERROR\""
          duration        = "300s"
          comparison      = "COMPARISON_GT"
          threshold_value = 50
        }
      }
    ]
  }
]