/**
 * Vertex AI Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The region to deploy resources to"
  type        = string
}

variable "vector_search_index_id" {
  description = "The ID of the Vector Search index"
  type        = string
  default     = "vector-search-index"
}

variable "vpc_network" {
  description = "The VPC network to use for private endpoints"
  type        = string
  default     = ""
}

variable "enable_private_endpoint" {
  description = "Whether to enable private endpoints for Vertex AI"
  type        = bool
  default     = false
}