/**
 * Vertex AI Module
 * 
 * This module handles the creation and configuration of Vertex AI resources.
 */

# Enable Vertex AI API
resource "google_project_service" "vertex_ai" {
  project = var.project_id
  service = "aiplatform.googleapis.com"
  
  disable_dependent_services = false
  disable_on_destroy         = false
}

# Create a Vertex AI dataset for Vector Search
resource "google_vertex_ai_dataset" "vector_dataset" {
  display_name          = "${var.project_id}-vector-dataset"
  metadata_schema_uri   = "gs://google-cloud-aiplatform/schema/dataset/metadata/image_1.0.0.yaml"
  region                = var.region
  project               = var.project_id
  
  # Depends on the API being enabled
  depends_on = [google_project_service.vertex_ai]
}

# Create a Vector Search index
resource "google_vertex_ai_index" "vector_search_index" {
  display_name     = var.vector_search_index_id
  description      = "Vector search index for document retrieval"
  region           = var.region
  project          = var.project_id
  
  metadata {
    contents_delta_uri = "gs://${var.project_id}-files/vector-index/"
    config {
      dimensions = 768  # For text-embedding-3-small model
      approximate_neighbors_count = 150
      distance_measure_type = "DOT_PRODUCT_DISTANCE"
      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count    = 500
          leaf_nodes_to_search_percent = 10
        }
      }
    }
  }
  
  index_update_method = "BATCH_UPDATE"
  
  # Depends on the API being enabled
  depends_on = [google_project_service.vertex_ai, google_vertex_ai_dataset.vector_dataset]
}

# Create a custom endpoint for vector search
resource "google_vertex_ai_index_endpoint" "vector_search_endpoint" {
  display_name        = "${var.project_id}-vector-endpoint"
  description         = "Endpoint for vector search operations"
  region              = var.region
  project             = var.project_id
  
  network             = var.vpc_network != "" ? var.vpc_network : null
  private_service_connect_config {
    enable_private_service_connect = var.enable_private_endpoint
    project_allowlist              = [var.project_id]
  }
  
  # Depends on the API being enabled
  depends_on = [google_project_service.vertex_ai]
}

# Deploy the index to the endpoint
resource "google_vertex_ai_index_endpoint_deployed_index" "deployed_index" {
  index_endpoint = google_vertex_ai_index_endpoint.vector_search_endpoint.id
  deployed_index_id = "deployed_${var.vector_search_index_id}"
  index = google_vertex_ai_index.vector_search_index.id
  
  display_name = "Deployed ${var.vector_search_index_id}"
  
  dedicated_resources {
    min_replica_count = 1
    max_replica_count = 4
    machine_spec {
      machine_type = "n1-standard-4"
    }
  }
  
  # Depends on the endpoint and index being created
  depends_on = [
    google_vertex_ai_index_endpoint.vector_search_endpoint,
    google_vertex_ai_index.vector_search_index
  ]
}

# Set up Vertex AI Feature Store for credit system (optional)
resource "google_vertex_ai_featurestore" "credit_featurestore" {
  name        = "${var.project_id}-credit-featurestore"
  region      = var.region
  project     = var.project_id
  
  online_serving_config {
    fixed_node_count = 1
  }
  
  # Depends on the API being enabled
  depends_on = [google_project_service.vertex_ai]
}

# Create entity type for credits
resource "google_vertex_ai_featurestore_entitytype" "user_credits" {
  featurestore    = google_vertex_ai_featurestore.credit_featurestore.id
  entity_type_id  = "user_credits"
  description     = "Entity type for tracking user credits for AI resource usage"
  
  monitoring_config {
    categorical_threshold_config {
      value = 0.3
    }
    numerical_threshold_config {
      value = 0.3
    }
  }
  
  # Depends on the featurestore being created
  depends_on = [google_vertex_ai_featurestore.credit_featurestore]
}

# Create features for credit tracking
resource "google_vertex_ai_featurestore_entitytype_feature" "remaining_credits" {
  featurestore   = google_vertex_ai_featurestore.credit_featurestore.id
  entity_type_id = google_vertex_ai_featurestore_entitytype.user_credits.entity_type_id
  feature_id     = "remaining_credits"
  value_type     = "INT64_ARRAY"
  description    = "Remaining AI usage credits for the user"
  
  # Depends on the entity type being created
  depends_on = [google_vertex_ai_featurestore_entitytype.user_credits]
}

resource "google_vertex_ai_featurestore_entitytype_feature" "total_usage" {
  featurestore   = google_vertex_ai_featurestore.credit_featurestore.id
  entity_type_id = google_vertex_ai_featurestore_entitytype.user_credits.entity_type_id
  feature_id     = "total_usage"
  value_type     = "INT64_ARRAY"
  description    = "Total AI resource usage history"
  
  # Depends on the entity type being created
  depends_on = [google_vertex_ai_featurestore_entitytype.user_credits]
}