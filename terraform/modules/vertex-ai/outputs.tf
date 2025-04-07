/**
 * Vertex AI Module Outputs
 */

output "vector_search_index_id" {
  description = "The ID of the Vector Search index"
  value       = google_vertex_ai_index.vector_search_index.id
}

output "vector_search_endpoint_id" {
  description = "The ID of the Vector Search endpoint"
  value       = google_vertex_ai_index_endpoint.vector_search_endpoint.id
}

output "deployed_index_id" {
  description = "The ID of the deployed Vector Search index"
  value       = google_vertex_ai_index_endpoint_deployed_index.deployed_index.id
}

output "credit_featurestore_id" {
  description = "The ID of the credit featurestore"
  value       = google_vertex_ai_featurestore.credit_featurestore.id
}