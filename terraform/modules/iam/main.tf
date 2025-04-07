/**
 * IAM Module
 * 
 * This module handles the creation and management of IAM resources.
 */

# Create service accounts based on the configuration
resource "google_service_account" "service_accounts" {
  for_each     = { for sa in var.service_accounts : sa.account_id => sa }
  
  project      = var.project_id
  account_id   = each.value.account_id
  display_name = each.value.display_name
  description  = each.value.description
}

# Assign roles to the service accounts
resource "google_project_iam_binding" "service_account_roles" {
  for_each = {
    for pair in flatten([
      for sa in var.service_accounts : [
        for role in sa.roles : {
          account_id = sa.account_id
          role       = role
        }
      ]
    ]) : "${pair.account_id}-${pair.role}" => pair
  }
  
  project = var.project_id
  role    = each.value.role
  members = ["serviceAccount:${each.value.account_id}@${var.project_id}.iam.gserviceaccount.com"]
  
  depends_on = [google_service_account.service_accounts]
}

# Create default service accounts if not specified
resource "google_service_account" "default_service_accounts" {
  for_each = toset([
    "fluxori-backend",
    "fluxori-frontend",
    "fluxori-ai",
  ])
  
  # Only create if not already specified in var.service_accounts
  count = contains([for sa in var.service_accounts : sa.account_id], each.key) ? 0 : 1
  
  project      = var.project_id
  account_id   = each.key
  display_name = title(replace(each.key, "-", " "))
  description  = "Default service account for ${each.key}"
}

# Grant basic roles to the default service accounts
resource "google_project_iam_member" "default_backend_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/aiplatform.user",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:fluxori-backend@${var.project_id}.iam.gserviceaccount.com"
  
  depends_on = [google_service_account.default_service_accounts]
}

resource "google_project_iam_member" "default_frontend_roles" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:fluxori-frontend@${var.project_id}.iam.gserviceaccount.com"
  
  depends_on = [google_service_account.default_service_accounts]
}

resource "google_project_iam_member" "default_ai_roles" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/storage.objectAdmin",
    "roles/datastore.user",
    "roles/logging.logWriter",
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:fluxori-ai@${var.project_id}.iam.gserviceaccount.com"
  
  depends_on = [google_service_account.default_service_accounts]
}

# Create custom IAM role for credit management
resource "google_project_iam_custom_role" "credit_manager" {
  project     = var.project_id
  role_id     = "fluxoriCreditManager"
  title       = "Fluxori Credit Manager"
  description = "Custom role for managing AI credits in the Fluxori system"
  permissions = [
    "aiplatform.featurestores.read",
    "aiplatform.entityTypes.read",
    "aiplatform.entityTypes.update",
    "aiplatform.features.read",
    "aiplatform.features.update",
    "monitoring.timeSeries.create",
  ]
}