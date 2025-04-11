/**
 * Fluxori SaaS - GCP Infrastructure
 * 
 * This is the main Terraform configuration file for the Fluxori project.
 * It sets up the required GCP resources for running the Fluxori e-commerce operations platform.
 * Optimized for South African regional deployment in africa-south1 (Johannesburg).
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
  region                  = var.region  # africa-south1 (Johannesburg)
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
  region                  = var.region  # africa-south1 (Johannesburg)
  database_id             = "${var.project_name}-db"
  depends_on              = [module.project]
}

# Import Cloud Storage module
module "cloud_storage" {
  source                  = "./modules/cloud-storage"
  project_id              = var.project_id
  region                  = var.region  # africa-south1 (Johannesburg)
  storage_class           = var.storage_class
  storage_buckets         = var.storage_buckets
  depends_on              = [module.project]
}

# Import Cloud Run module for regional services
module "cloud_run" {
  source                  = "./modules/cloud-run"
  project_id              = var.project_id
  region                  = var.region  # africa-south1 (Johannesburg)
  backend_service_name    = "${var.project_name}-backend"
  frontend_service_name   = "${var.project_name}-frontend"
  backend_image           = var.backend_image
  frontend_image          = var.frontend_image
  vpc_connector_id        = module.vpc.connector_id
  depends_on              = [module.vpc, module.firestore]
}

# Import Cloud Run module for GenAI services in europe-west1 (closest region to South Africa with GenAI)
module "genai_cloud_run" {
  source                  = "./modules/cloud-run"
  project_id              = var.project_id
  region                  = var.genai_region  # europe-west1 (Belgium)
  backend_service_name    = "${var.project_name}-genai-backend"
  frontend_service_name   = "${var.project_name}-genai-frontend"
  backend_image           = var.backend_image
  frontend_image          = var.frontend_image
  vpc_connector_id        = module.vpc.connector_id
  depends_on              = [module.vpc, module.firestore]
}

# Import Vertex AI module with multi-region approach
module "vertex_ai" {
  source                  = "./modules/vertex-ai"
  project_id              = var.project_id
  region                  = var.genai_region  # europe-west1 (Belgium) for GenAI services
  vector_search_index_id  = "${var.project_name}-vector-index"
  vpc_network             = module.vpc.network_self_link
  enable_private_endpoint = true
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

# Import Regional Optimization module for South Africa
module "regional_optimization" {
  source                  = "./modules/regional-optimization"
  project_id              = var.project_id
  region                  = var.region            # africa-south1 (Johannesburg)
  genai_region            = var.genai_region      # europe-west1 (Belgium)
  domain                  = var.domain
  static_assets_bucket    = module.cloud_storage.bucket_names[0]
  vpc_network             = module.vpc.network_self_link
  default_backend_service = module.cloud_run.backend_service_id
  genai_backend_service   = module.genai_cloud_run.backend_service_id
  critical_backend_service = module.cloud_run.backend_service_id
  redis_memory_size_gb    = 2
  cors_origins            = ["https://${var.domain}", "https://api.${var.domain}"]
  notification_channels   = module.monitoring.notification_channel_ids
  scheduler_service_account = "fluxori-backend@${var.project_id}.iam.gserviceaccount.com"
  
  # Latency and ISP performance monitoring filters
  latency_filter         = "resource.labels.\"url_map_name\"=\"${var.project_name}-url-map\""
  isp_performance_filter = "metadata.user_labels.\"region\"=\"${var.region}\""
  api_latency_filter     = "resource.labels.\"service_name\"=\"${var.project_name}-backend\""
  
  depends_on = [
    module.cloud_run,
    module.genai_cloud_run,
    module.cloud_storage,
    module.vpc,
    module.monitoring,
    module.iam
  ]
}

# Import CDN module for static assets with global edge locations
module "cdn" {
  source                  = "./modules/cdn"
  project_id              = var.project_id
  bucket_name             = module.regional_optimization.regional_storage_bucket
  domain                  = var.domain
  enable_security_policy  = true
  
  # Fast cache settings for static assets
  cache_ttl_seconds       = 86400  # 24 hour default TTL for static assets
  rate_limit_threshold    = 2000   # Higher threshold for multiple users on same networks
  
  depends_on              = [module.cloud_storage, module.regional_optimization]
}