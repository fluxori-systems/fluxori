/**
 * Service Mesh Module
 * 
 * This module configures service-to-service authentication and IAP for Cloud Run services
 */

# Enable required APIs
resource "google_project_service" "required_services" {
  for_each = toset([
    "iap.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "run.googleapis.com",
    "iam.googleapis.com",
  ])
  
  project = var.project_id
  service = each.value
  
  disable_on_destroy = false
}

# Create service account for service-to-service authentication
resource "google_service_account" "service_auth" {
  project      = var.project_id
  account_id   = "fluxori-service-auth"
  display_name = "Fluxori Service Auth"
  description  = "Service account for service-to-service authentication"
  
  depends_on = [google_project_service.required_services]
}

# Grant service account token creator role to service account
resource "google_project_iam_member" "service_auth_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.service_auth.email}"
}

# Create service account for IAP
resource "google_service_account" "iap_auth" {
  project      = var.project_id
  account_id   = "fluxori-iap-auth"
  display_name = "Fluxori IAP Auth"
  description  = "Service account for Identity-Aware Proxy authentication"
  
  depends_on = [google_project_service.required_services]
}

# Grant IAP-secured Web App User role to backend services
resource "google_project_iam_member" "backend_iap_access" {
  project = var.project_id
  role    = "roles/iap.httpsResourceAccessor"
  member  = "serviceAccount:fluxori-backend@${var.project_id}.iam.gserviceaccount.com"
  
  depends_on = [google_project_service.required_services]
}

# Create OAuth brand for IAP
resource "google_iap_brand" "fluxori_brand" {
  project           = var.project_id
  support_email     = var.support_email
  application_title = "Fluxori Platform"
}

# Create OAuth client for internal services
resource "google_iap_client" "internal_client" {
  display_name = "Fluxori Internal Service Client"
  brand        = google_iap_brand.fluxori_brand.name
}

# Configure IAP settings for backend service
resource "google_iap_web_backend_service_iam_binding" "backend_service_iam" {
  project             = var.project_id
  web_backend_service = var.backend_service_id
  role                = "roles/iap.httpsResourceAccessor"
  
  members = [
    "serviceAccount:${google_service_account.iap_auth.email}",
    "serviceAccount:fluxori-backend@${var.project_id}.iam.gserviceaccount.com",
    "serviceAccount:fluxori-frontend@${var.project_id}.iam.gserviceaccount.com",
  ]
  
  depends_on = [
    google_project_service.required_services,
    google_iap_brand.fluxori_brand,
  ]
}

# Create service-to-service auth configuration
resource "google_service_account_iam_binding" "service_account_auth" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/fluxori-backend@${var.project_id}.iam.gserviceaccount.com"
  role               = "roles/iam.serviceAccountTokenCreator"
  
  members = [
    "serviceAccount:fluxori-service-auth@${var.project_id}.iam.gserviceaccount.com",
  ]
  
  depends_on = [google_service_account.service_auth]
}

# Set up load balancer for internal services
resource "google_compute_global_address" "internal_services_ip" {
  project      = var.project_id
  name         = "fluxori-internal-services-ip"
  address_type = "EXTERNAL"
  
  depends_on = [google_project_service.required_services]
}

# Configure SSL certificate if domain is provided
resource "google_compute_managed_ssl_certificate" "internal_services_cert" {
  count = var.internal_services_domain != "" ? 1 : 0
  
  project = var.project_id
  name    = "fluxori-internal-services-cert"
  
  managed {
    domains = [var.internal_services_domain]
  }
  
  depends_on = [google_project_service.required_services]
}

# Create backend service for Cloud Run target
resource "google_compute_backend_service" "internal_backend" {
  project           = var.project_id
  name              = "fluxori-internal-backend"
  protocol          = "HTTP"
  port_name         = "http"
  timeout_sec       = 30
  enable_cdn        = false
  
  backend {
    group = var.backend_service_neg_id
  }
  
  depends_on = [google_project_service.required_services]
}

# Create URL map for internal services
resource "google_compute_url_map" "internal_url_map" {
  project         = var.project_id
  name            = "fluxori-internal-url-map"
  default_service = google_compute_backend_service.internal_backend.id
  
  depends_on = [google_compute_backend_service.internal_backend]
}

# Configure HTTPS proxy with SSL if domain is provided
resource "google_compute_target_https_proxy" "internal_https_proxy" {
  count = var.internal_services_domain != "" ? 1 : 0
  
  project          = var.project_id
  name             = "fluxori-internal-https-proxy"
  url_map          = google_compute_url_map.internal_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.internal_services_cert[0].id]
  
  depends_on = [
    google_compute_url_map.internal_url_map,
    google_compute_managed_ssl_certificate.internal_services_cert,
  ]
}

# Configure HTTP proxy if no domain is provided
resource "google_compute_target_http_proxy" "internal_http_proxy" {
  count = var.internal_services_domain == "" ? 1 : 0
  
  project = var.project_id
  name    = "fluxori-internal-http-proxy"
  url_map = google_compute_url_map.internal_url_map.id
  
  depends_on = [google_compute_url_map.internal_url_map]
}

# Create HTTPS forwarding rule if domain is provided
resource "google_compute_global_forwarding_rule" "internal_https_rule" {
  count = var.internal_services_domain != "" ? 1 : 0
  
  project               = var.project_id
  name                  = "fluxori-internal-https-rule"
  target                = google_compute_target_https_proxy.internal_https_proxy[0].id
  port_range            = "443"
  ip_address            = google_compute_global_address.internal_services_ip.address
  load_balancing_scheme = "EXTERNAL"
  
  depends_on = [
    google_compute_target_https_proxy.internal_https_proxy,
    google_compute_global_address.internal_services_ip,
  ]
}

# Create HTTP forwarding rule if no domain is provided
resource "google_compute_global_forwarding_rule" "internal_http_rule" {
  count = var.internal_services_domain == "" ? 1 : 0
  
  project               = var.project_id
  name                  = "fluxori-internal-http-rule"
  target                = google_compute_target_http_proxy.internal_http_proxy[0].id
  port_range            = "80"
  ip_address            = google_compute_global_address.internal_services_ip.address
  load_balancing_scheme = "EXTERNAL"
  
  depends_on = [
    google_compute_target_http_proxy.internal_http_proxy,
    google_compute_global_address.internal_services_ip,
  ]
}