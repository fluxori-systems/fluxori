/**
 * Security module for Fluxori
 * Configures Cloud Armor security policies and IAM security settings
 */

# Create Cloud Armor security policy for backend services
resource "google_compute_security_policy" "backend_security_policy" {
  name        = "${var.project_id}-backend-security-policy"
  description = "Security policy for Fluxori backend services"
  
  # Rate limiting rule - configurable requests per minute per IP
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
      ban_duration_sec = 300 # 5-minute ban after exceeding threshold
    }
  }
  
  # Block common attack patterns - XSS protection
  rule {
    action      = "deny(403)"
    priority    = 200
    description = "XSS protection"
    
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
  }
  
  # SQL injection protection
  rule {
    action      = "deny(403)"
    priority    = 300
    description = "SQL injection protection"
    
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
  }
  
  # Remote file inclusion attacks protection
  rule {
    action      = "deny(403)"
    priority    = 400
    description = "Remote file inclusion protection"
    
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rfi-stable')"
      }
    }
  }
  
  # Local file inclusion attacks protection
  rule {
    action      = "deny(403)"
    priority    = 500
    description = "Local file inclusion protection"
    
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-stable')"
      }
    }
  }
  
  # Unwanted scanners and vulnerability scanners
  rule {
    action      = "deny(403)"
    priority    = 600
    description = "Scanner protection"
    
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('scanners-whitelist')"
      }
    }
  }
  
  # Geo-restriction - Allow only South Africa and specified countries
  dynamic "rule" {
    for_each = var.enable_geo_restriction ? [1] : []
    content {
      action      = "deny(403)"
      priority    = 900
      description = "Geo-restriction"
      
      match {
        expr {
          # Allow South Africa (ZA) plus any additionally specified countries
          expression = "!has(geoIP.country_code) || !(geoIP.country_code in ${jsonencode(concat(["ZA"], var.allowed_countries))})"
        }
      }
    }
  }
  
  # Block TOR exit nodes
  rule {
    action      = "deny(403)"
    priority    = 950
    description = "Block TOR exit nodes"
    
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('tor-exit-node')"
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

# Configure Custom Header rules for the backend
resource "google_compute_security_policy_advanced_options_config" "advanced_options" {
  security_policy = google_compute_security_policy.backend_security_policy.name
  
  json_custom_config {
    content_type    = "application/json"
    json_parsing    = "STANDARD"
    request_header_action {
      header_name    = "X-Powered-By"
      action         = "REMOVE"
    }
    request_header_action {
      header_name    = "Server"
      action         = "REMOVE"
    }
  }
}

# Security scanner for regular vulnerability scanning
resource "google_security_scanner_scan_config" "security_scan" {
  count = var.enable_security_scanner ? 1 : 0
  
  display_name = "${var.project_id}-security-scan"
  max_qps      = 10
  starting_urls = [
    "https://${var.domain}",
    "https://api.${var.domain}"
  ]
  
  authentication {
    google_account {
      username = var.scanner_email
      password = var.scanner_password
    }
  }
  
  schedule {
    schedule_time = "2030-01-01T00:00:00Z" # Initial schedule time (will be replaced by Cloud Scheduler)
    interval      = "WEEKLY"
  }
  
  target_platforms = ["APP_ENGINE"]
  
  risk_level = "MEDIUM"
  user_agent = "CHROME_LINUX"
}

# IAM audit logging for critical services
resource "google_project_iam_audit_config" "project_audit_config" {
  project = var.project_id
  service = "allServices"
  
  audit_log_config {
    log_type = "ADMIN_READ"
  }
  
  audit_log_config {
    log_type = "DATA_WRITE"
  }
  
  audit_log_config {
    log_type = "DATA_READ"
  }
}