/**
 * Fluxori SaaS - GCP Infrastructure
 * 
 * This is the main Terraform configuration file for the Fluxori project.
 * It sets up the required GCP resources for running the Fluxori e-commerce operations platform.
 */

# Configure the Google Cloud provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Import project module
module "project" {
  source          = "./modules/project"
  project_id      = var.project_id
  project_name    = var.project_name
  billing_account = var.billing_account
  org_id          = var.org_id
}

# Import VPC module
module "vpc" {
  source                  = "./modules/vpc"
  project_id              = var.project_id
  region                  = var.region
  network_name            = "${var.project_name}-network"
  subnet_name             = "${var.project_name}-subnet"
  subnet_ip_cidr_range    = var.subnet_ip_cidr_range
  secondary_ranges        = var.secondary_ranges
  depends_on              = [module.project]
}

# Import Firestore module
module "firestore" {
  source                  = "./modules/firestore"
  project_id              = var.project_id
  region                  = var.region
  database_id             = "${var.project_name}-db"
  depends_on              = [module.project]
}

# Import Cloud Storage module
module "cloud_storage" {
  source                  = "./modules/cloud-storage"
  project_id              = var.project_id
  region                  = var.region
  storage_class           = var.storage_class
  storage_buckets         = var.storage_buckets
  depends_on              = [module.project]
}

# Import Cloud Run module
module "cloud_run" {
  source                  = "./modules/cloud-run"
  project_id              = var.project_id
  region                  = var.region
  backend_service_name    = "${var.project_name}-backend"
  frontend_service_name   = "${var.project_name}-frontend"
  backend_image           = var.backend_image
  frontend_image          = var.frontend_image
  vpc_connector_id        = module.vpc.connector_id
  depends_on              = [module.vpc, module.firestore]
}

# Import Vertex AI module
module "vertex_ai" {
  source                  = "./modules/vertex-ai"
  project_id              = var.project_id
  region                  = var.region
  vector_search_index_id  = "${var.project_name}-vector-index"
  depends_on              = [module.project]
}

# Import Secret Manager module
module "secret_manager" {
  source                  = "./modules/secret-manager"
  project_id              = var.project_id
  secrets                 = var.secrets
  depends_on              = [module.project]
}

# Import IAM module
module "iam" {
  source                  = "./modules/iam"
  project_id              = var.project_id
  service_accounts        = var.service_accounts
  depends_on              = [module.project]
}

# Import Monitoring module
module "monitoring" {
  source                  = "./modules/monitoring"
  project_id              = var.project_id
  notification_channels   = var.notification_channels
  alert_policies          = var.alert_policies
  depends_on              = [module.project]
}

# Import Service Mesh module
module "service_mesh" {
  source                  = "./modules/service-mesh"
  project_id              = var.project_id
  backend_service_id      = module.cloud_run.backend_service_id
  backend_service_neg_id  = module.cloud_run.backend_service_neg_id
  support_email           = var.support_email
  internal_services_domain = var.internal_services_domain
  allowed_service_accounts = [
    "fluxori-backend@${var.project_id}.iam.gserviceaccount.com",
    "fluxori-frontend@${var.project_id}.iam.gserviceaccount.com",
    "fluxori-ai@${var.project_id}.iam.gserviceaccount.com",
  ]
  depends_on              = [module.cloud_run, module.iam]
}