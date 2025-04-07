/**
 * Secret Manager Module
 * 
 * This module handles the creation and management of secrets in Secret Manager.
 */

# Create secrets based on the configuration
resource "google_secret_manager_secret" "secrets" {
  for_each  = { for secret in var.secrets : secret.name => secret }
  
  project   = var.project_id
  secret_id = each.value.name
  
  replication {
    auto {
      // Use automatic replication
    }
  }
  
  # Add labels for better organization
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Store the secret data
resource "google_secret_manager_secret_version" "secret_versions" {
  for_each = { for secret in var.secrets : secret.name => secret }
  
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value.secret_data
}

# Create common secrets for the application (JWT, etc.)
resource "google_secret_manager_secret" "common_secrets" {
  for_each  = toset([
    "jwt-secret",
    "mongodb-uri",
    "mongodb-username",
    "mongodb-password",
  ])
  
  project   = var.project_id
  secret_id = each.key
  
  replication {
    auto {
      // Use automatic replication
    }
  }
  
  # Add labels for better organization
  labels = {
    environment = var.environment
    managed_by  = "terraform"
    type        = "common"
  }
}

# IAM bindings for the backend service account to access secrets
resource "google_secret_manager_secret_iam_binding" "backend_secret_access" {
  for_each  = merge(
    { for secret in var.secrets : secret.name => secret },
    { for s in toset([
        "jwt-secret",
        "mongodb-uri",
        "mongodb-username",
        "mongodb-password",
      ]) : s => { name = s } }
  )
  
  project   = var.project_id
  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  members   = [
    "serviceAccount:fluxori-backend@${var.project_id}.iam.gserviceaccount.com",
  ]
  
  depends_on = [
    google_secret_manager_secret.secrets,
    google_secret_manager_secret.common_secrets
  ]
}