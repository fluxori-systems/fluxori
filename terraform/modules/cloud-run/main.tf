/**
 * Cloud Run Module
 * 
 * This module handles the creation and configuration of Cloud Run services.
 */

# Create the backend Cloud Run service
resource "google_cloud_run_service" "backend" {
  name     = var.backend_service_name
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = var.backend_image
        
        # Set resource limits for the container
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
        
        # Define environment variables from Secret Manager
        dynamic "env" {
          for_each = var.backend_env_vars
          content {
            name = env.key
            value = env.value
          }
        }
        
        # Secret environment variables
        dynamic "env" {
          for_each = var.backend_secret_env_vars
          content {
            name = env.key
            value_from {
              secret_key_ref {
                name = env.value.secret_name
                key  = env.value.secret_key
              }
            }
          }
        }
        
        # Set health checks
        startup_probe {
          http_get {
            path = "/health"
          }
          initial_delay_seconds = 10
          period_seconds = 5
          failure_threshold = 5
        }
        
        liveness_probe {
          http_get {
            path = "/health"
          }
          period_seconds = 15
        }
      }
      
      # Service account for the service
      service_account_name = "fluxori-backend@${var.project_id}.iam.gserviceaccount.com"
      
      # Configure container concurrency
      container_concurrency = 80
      
      # Set timeout
      timeout_seconds = 300
    }
    
    metadata {
      annotations = {
        # Configure autoscaling
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
        
        # Connect to VPC
        "run.googleapis.com/vpc-access-connector" = var.vpc_connector_id
        "run.googleapis.com/vpc-access-egress"    = "all-traffic"
        
        # Configure CPU allocation
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }
  
  # Configure traffic distribution (enable gradual rollout)
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  # Prevent destroying the service with terraform destroy unless explicitly targeted
  lifecycle {
    ignore_changes = [
      metadata[0].annotations["client.knative.dev/user-image"],
      metadata[0].annotations["run.googleapis.com/client-name"],
      metadata[0].annotations["run.googleapis.com/client-version"],
      metadata[0].annotations["run.googleapis.com/ingress-status"],
      metadata[0].labels["cloud.googleapis.com/location"],
    ]
  }
}

# Create the frontend Cloud Run service
resource "google_cloud_run_service" "frontend" {
  name     = var.frontend_service_name
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = var.frontend_image
        
        # Set resource limits for the container
        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }
        }
        
        # Define environment variables
        dynamic "env" {
          for_each = var.frontend_env_vars
          content {
            name = env.key
            value = env.value
          }
        }
        
        # Set health checks
        liveness_probe {
          http_get {
            path = "/"
          }
          period_seconds = 15
        }
      }
      
      # Service account for the service
      service_account_name = "fluxori-frontend@${var.project_id}.iam.gserviceaccount.com"
      
      # Configure container concurrency
      container_concurrency = 80
      
      # Set timeout
      timeout_seconds = 300
    }
    
    metadata {
      annotations = {
        # Configure autoscaling
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
        
        # Configure CPU allocation
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }
  
  # Configure traffic distribution (enable gradual rollout)
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  # Prevent destroying the service with terraform destroy unless explicitly targeted
  lifecycle {
    ignore_changes = [
      metadata[0].annotations["client.knative.dev/user-image"],
      metadata[0].annotations["run.googleapis.com/client-name"],
      metadata[0].annotations["run.googleapis.com/client-version"],
      metadata[0].annotations["run.googleapis.com/ingress-status"],
      metadata[0].labels["cloud.googleapis.com/location"],
    ]
  }
}

# Set IAM policy for the backend service to be publicly accessible
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Set IAM policy for the frontend service to be publicly accessible
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Create a Cloud Run domain mapping for the frontend
resource "google_cloud_run_domain_mapping" "frontend_domain" {
  count    = var.frontend_domain != "" ? 1 : 0
  
  name     = var.frontend_domain
  location = var.region
  project  = var.project_id
  
  metadata {
    namespace = var.project_id
  }
  
  spec {
    route_name = google_cloud_run_service.frontend.name
  }
}