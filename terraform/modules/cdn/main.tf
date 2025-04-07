/**
 * Cloud CDN Module for Static Assets
 * Configures a Cloud CDN for serving static assets from a GCS bucket
 */

# Create backend bucket for static assets
resource "google_compute_backend_bucket" "static_assets" {
  name        = "${var.project_id}-static-assets"
  description = "Backend bucket for serving static assets via Cloud CDN"
  bucket_name = var.bucket_name
  enable_cdn  = true
  
  # CDN Cache Policy
  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    client_ttl        = 3600
    default_ttl       = 3600
    max_ttl           = 86400
    serve_while_stale = 86400
    
    # Cache key policy
    cache_key_policy {
      include_host         = true
      include_protocol     = true
      include_query_string = false
    }
  }
}

# Create URL map
resource "google_compute_url_map" "static_assets" {
  name            = "${var.project_id}-cdn-url-map"
  description     = "URL map for Cloud CDN static assets"
  default_service = google_compute_backend_bucket.static_assets.id
  
  # Add host rules if domain is specified
  dynamic "host_rule" {
    for_each = var.domain != "" ? [1] : []
    content {
      hosts        = ["assets.${var.domain}"]
      path_matcher = "static-paths"
    }
  }
  
  # Add path matcher if domain is specified
  dynamic "path_matcher" {
    for_each = var.domain != "" ? [1] : []
    content {
      name            = "static-paths"
      default_service = google_compute_backend_bucket.static_assets.id
      
      path_rule {
        paths   = ["/images/*", "/assets/*", "/static/*"]
        service = google_compute_backend_bucket.static_assets.id
      }
    }
  }
}

# HTTPS certificate (only if domain is specified)
resource "google_compute_managed_ssl_certificate" "cdn_cert" {
  count = var.domain != "" ? 1 : 0
  
  name = "${var.project_id}-cdn-cert"
  
  managed {
    domains = ["assets.${var.domain}"]
  }
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  count = var.domain != "" ? 1 : 0
  
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
  count = var.domain != "" ? 1 : 0
  
  name        = "${var.project_id}-http-proxy"
  description = "HTTP proxy for redirect to HTTPS"
  url_map     = google_compute_url_map.http_redirect[0].id
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "cdn_https_proxy" {
  count = var.domain != "" ? 1 : 0
  
  name             = "${var.project_id}-cdn-https-proxy"
  description      = "HTTPS proxy for Cloud CDN"
  url_map          = google_compute_url_map.static_assets.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cdn_cert[0].id]
}

# Global forwarding rule for HTTPS
resource "google_compute_global_forwarding_rule" "cdn_https_forwarding_rule" {
  count = var.domain != "" ? 1 : 0
  
  name        = "${var.project_id}-cdn-https-rule"
  description = "Global forwarding rule for Cloud CDN (HTTPS)"
  target      = google_compute_target_https_proxy.cdn_https_proxy[0].id
  port_range  = "443"
  ip_address  = google_compute_global_address.cdn_ip.address
}

# Global forwarding rule for HTTP (redirect)
resource "google_compute_global_forwarding_rule" "cdn_http_forwarding_rule" {
  count = var.domain != "" ? 1 : 0
  
  name        = "${var.project_id}-cdn-http-rule"
  description = "Global forwarding rule for HTTP to HTTPS redirect"
  target      = google_compute_target_http_proxy.http_proxy[0].id
  port_range  = "80"
  ip_address  = google_compute_global_address.cdn_ip.address
}

# Reserve IP address
resource "google_compute_global_address" "cdn_ip" {
  name        = "${var.project_id}-cdn-ip"
  description = "Global IP address for Cloud CDN"
}

# Create Cloud Armor security policy
resource "google_compute_security_policy" "cdn_security_policy" {
  count = var.enable_security_policy ? 1 : 0
  
  name        = "${var.project_id}-cdn-security-policy"
  description = "Security policy for Cloud CDN"
  
  # Rate limiting rule
  rule {
    action      = "rate_based_ban"
    priority    = 100
    description = "Rate limiting rule"
    
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = var.rate_limit_threshold
        interval_sec = 60
      }
    }
  }
  
  # Default rule - allow all remaining traffic
  rule {
    action      = "allow"
    priority    = 2147483647
    description = "Default rule, allow all traffic"
    
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}