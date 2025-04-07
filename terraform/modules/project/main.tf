/**
 * Project Module
 * 
 * This module handles the creation and configuration of a GCP project.
 */

# Create a new GCP project
resource "google_project" "fluxori_project" {
  name            = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
  org_id          = var.org_id
  
  # Skip delete if project is already created
  lifecycle {
    prevent_destroy = true
  }
}

# Enable required APIs for the project
resource "google_project_service" "project_services" {
  for_each = toset([
    "serviceusage.googleapis.com",      # Service Usage API
    "iam.googleapis.com",               # Identity and Access Management API
    "compute.googleapis.com",           # Compute Engine API
    "run.googleapis.com",               # Cloud Run API
    "artifactregistry.googleapis.com",  # Artifact Registry API
    "firestore.googleapis.com",         # Firestore API
    "storage.googleapis.com",           # Cloud Storage API 
    "secretmanager.googleapis.com",     # Secret Manager API
    "vpcaccess.googleapis.com",         # VPC Access API
    "servicenetworking.googleapis.com", # Service Networking API
    "aiplatform.googleapis.com",        # Vertex AI API
    "cloudresourcemanager.googleapis.com", # Resource Manager API
    "monitoring.googleapis.com",        # Cloud Monitoring API
    "logging.googleapis.com",           # Cloud Logging API
    "cloudtrace.googleapis.com",        # Cloud Trace API
    "cloudbuild.googleapis.com",        # Cloud Build API
    "containerregistry.googleapis.com", # Container Registry API
  ])

  project  = google_project.fluxori_project.project_id
  service  = each.key
  
  # Disable Services on destroy prevents destroying a project if services
  # are still active, wait for 30 seconds before sending a delete request
  disable_dependent_services = true
  disable_on_destroy         = true
  
  depends_on = [google_project.fluxori_project]
}