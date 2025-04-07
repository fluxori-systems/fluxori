/**
 * VPC Module
 * 
 * This module handles the creation and configuration of VPC resources.
 */

# Create a VPC network
resource "google_compute_network" "vpc_network" {
  project                 = var.project_id
  name                    = var.network_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  
  # Recommended deletion protection for production networks
  delete_default_routes_on_create = false
}

# Create a subnet within the VPC
resource "google_compute_subnetwork" "subnet" {
  project       = var.project_id
  name          = var.subnet_name
  region        = var.region
  network       = google_compute_network.vpc_network.id
  ip_cidr_range = var.subnet_ip_cidr_range
  
  # Enable Google Cloud services to create private connections
  private_ip_google_access = true
  
  # Add secondary IP ranges if specified
  dynamic "secondary_ip_range" {
    for_each = var.secondary_ranges[var.subnet_name] == null ? [] : var.secondary_ranges[var.subnet_name]
    content {
      range_name    = secondary_ip_range.value.range_name
      ip_cidr_range = secondary_ip_range.value.ip_cidr_range
    }
  }
  
  # Enable flow logs for better network monitoring
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Create a VPC Connector for Serverless services to access VPC resources
resource "google_vpc_access_connector" "connector" {
  project        = var.project_id
  name           = "vpc-connector"
  region         = var.region
  ip_cidr_range  = var.connector_ip_cidr_range
  network        = google_compute_network.vpc_network.name
  
  # Configure min and max instances for the connector
  min_instances  = 2
  max_instances  = 10
  
  # Use the standard machine type for the connector
  machine_type   = "e2-standard-4"
  
  depends_on = [google_compute_network.vpc_network]
}

# Create a Cloud NAT for private instances to access the internet
resource "google_compute_router" "router" {
  project = var.project_id
  name    = "nat-router"
  region  = var.region
  network = google_compute_network.vpc_network.id
}

resource "google_compute_router_nat" "nat" {
  project                            = var.project_id
  name                               = "nat-config"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  
  # Configure logging
  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Create firewall rules for the network
resource "google_compute_firewall" "allow_internal" {
  project     = var.project_id
  name        = "allow-internal"
  network     = google_compute_network.vpc_network.name
  description = "Allow internal traffic between resources in the VPC"
  
  allow {
    protocol = "icmp"
  }
  
  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  
  source_ranges = [var.subnet_ip_cidr_range]
}

resource "google_compute_firewall" "allow_health_checks" {
  project     = var.project_id
  name        = "allow-health-checks"
  network     = google_compute_network.vpc_network.name
  description = "Allow health checks from Google Cloud"
  
  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  
  # Health check ranges for GCP
  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
}

# Create a private connection to access Google services without public IPs
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
}

resource "google_compute_global_address" "private_ip_alloc" {
  project       = var.project_id
  name          = "private-ip-alloc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc_network.id
}