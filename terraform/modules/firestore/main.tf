/**
 * Firestore Module
 * 
 * This module handles the creation and configuration of a Firestore database.
 */

# Create a Firestore database in native mode
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = var.database_id
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  # Set concurrency mode to optimistic for high throughput
  concurrency_mode = "OPTIMISTIC"
  
  # Consider the implications before enabling deletion protection in production
  deletion_protection = var.deletion_protection
}

# Create an index for the users collection
resource "google_firestore_index" "users_index" {
  project     = var.project_id
  database    = google_firestore_database.database.name
  collection  = "users"
  
  fields {
    field_path = "email"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "organizationId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }
  
  depends_on = [google_firestore_database.database]
}

# Create an index for the products collection
resource "google_firestore_index" "products_index" {
  project     = var.project_id
  database    = google_firestore_database.database.name
  collection  = "products"
  
  fields {
    field_path = "sku"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "organizationId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  
  depends_on = [google_firestore_database.database]
}

# Create an index for the orders collection
resource "google_firestore_index" "orders_index" {
  project     = var.project_id
  database    = google_firestore_database.database.name
  collection  = "orders"
  
  fields {
    field_path = "organizationId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
  
  depends_on = [google_firestore_database.database]
}

# Create an index for the insights collection
resource "google_firestore_index" "insights_index" {
  project     = var.project_id
  database    = google_firestore_database.database.name
  collection  = "insights"
  
  fields {
    field_path = "organizationId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "type"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
  
  depends_on = [google_firestore_database.database]
}

# Create TTL index for notifications collection
resource "google_firestore_index" "notifications_ttl_index" {
  project     = var.project_id
  database    = google_firestore_database.database.name
  collection  = "notifications"
  
  fields {
    field_path = "expiresAt"
    order      = "ASCENDING"
  }
  
  depends_on = [google_firestore_database.database]
}

# Set up TTL for notifications collection
resource "google_firestore_field" "notifications_ttl" {
  project     = var.project_id
  database    = google_firestore_database.database.name
  collection  = "notifications"
  field       = "expiresAt"
  ttl         = true
  
  depends_on = [google_firestore_database.database]
}