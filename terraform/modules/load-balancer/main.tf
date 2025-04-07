/**
 * Cloud Load Balancing module for Fluxori backend services
 * Configures load balancing, SSL termination, and routing for Cloud Run services
 */

# Health check for backend service
resource "google_compute_health_check" "backend_health_check" {
  name                = "${var.project_id}-health-check"
  description         = "Health check for backend services"
  timeout_sec         = 5
  check_interval_sec  = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3
  
  http_health_check {
    port               = 80
    port_specification = "USE_FIXED_PORT"
    request_path       = "/health"
    proxy_header       = "NONE"
  }
}

# Network endpoint group for Cloud Run
resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  name                  = "${var.project_id}-serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  
  cloud_run {
    service = var.cloud_run_service_name
  }
}

# Backend service with Cloud Armor security policy
resource "google_compute_backend_service" "backend_service" {
  name                  = "${var.project_id}-backend-service"
  description           = "Backend service for Fluxori API"
  protocol              = "HTTP"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.backend_health_check.id]
  security_policy       = var.security_policy_id
  load_balancing_scheme = "EXTERNAL_MANAGED"
  
  backend {
    group = google_compute_region_network_endpoint_group.serverless_neg.id
  }
  
  log_config {
    enable      = true
    sample_rate = 1.0
  }
  
  # Connection draining (gracefully shut down existing connections)
  connection_draining_timeout_sec = 300
  
  # Enable IAP if requested
  dynamic "iap" {
    for_each = var.enable_iap ? [1] : []
    content {
      oauth2_client_id     = var.oauth2_client_id
      oauth2_client_secret = var.oauth2_client_secret
    }
  }
}

# URL map for HTTP(S) routing
resource "google_compute_url_map" "url_map" {
  name            = "${var.project_id}-url-map"
  description     = "URL map for Fluxori services"
  default_service = google_compute_backend_service.backend_service.id
  
  # Add host rules for API subdomain
  host_rule {
    hosts        = ["api.${var.domain}"]
    path_matcher = "api-paths"
  }
  
  # Path matcher for API routes
  path_matcher {
    name            = "api-paths"
    default_service = google_compute_backend_service.backend_service.id
    
    # Add specific path rules if needed
    path_rule {
      paths   = ["/health", "/health/*"]
      service = google_compute_backend_service.backend_service.id
    }
  }
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name        = "${var.project_id}-http-redirect"
  description = "URL map to redirect HTTP to HTTPS"
  
  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

# HTTP target proxy for redirect
resource "google_compute_target_http_proxy" "http_proxy" {
  name        = "${var.project_id}-http-proxy"
  description = "HTTP proxy for redirect to HTTPS"
  url_map     = google_compute_url_map.http_redirect.id
}

# HTTPS SSL certificate
resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  name = "${var.project_id}-ssl-cert"
  
  managed {
    domains = ["api.${var.domain}", "${var.domain}"]
  }
}

# HTTPS target proxy with SSL certificate
resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "${var.project_id}-https-proxy"
  description      = "HTTPS proxy for Fluxori services"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_cert.id]
  
  # Enable quic protocol (HTTP/3) for better performance
  quic_override = "ENABLE"
}

# Global forwarding rule for HTTPS
resource "google_compute_global_forwarding_rule" "https_forwarding_rule" {
  name        = "${var.project_id}-https-rule"
  description = "Global forwarding rule for HTTPS"
  target      = google_compute_target_https_proxy.https_proxy.id
  port_range  = "443"
  ip_address  = google_compute_global_address.static_ip.address
  
  # Enable the premium network tier for better global performance
  network_tier = "PREMIUM"
  
  # Labels for cost tracking
  labels = {
    service = "api"
    environment = var.environment
  }
}

# Global forwarding rule for HTTP (redirect)
resource "google_compute_global_forwarding_rule" "http_forwarding_rule" {
  name        = "${var.project_id}-http-rule"
  description = "Global forwarding rule for HTTP to HTTPS redirect"
  target      = google_compute_target_http_proxy.http_proxy.id
  port_range  = "80"
  ip_address  = google_compute_global_address.static_ip.address
  
  # Enable the premium network tier for better global performance
  network_tier = "PREMIUM"
  
  # Labels for cost tracking
  labels = {
    service = "api"
    environment = var.environment
  }
}

# Global static IP address
resource "google_compute_global_address" "static_ip" {
  name        = "${var.project_id}-global-ip"
  description = "Global IP address for Fluxori services"
  
  # Labels for cost tracking
  labels = {
    service = "api"
    environment = var.environment
  }
}