/**
 * Firestore Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The region to deploy the Firestore database in"
  type        = string
}

variable "database_id" {
  description = "The ID of the Firestore database"
  type        = string
  default     = "fluxori-db"
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection for the Firestore database"
  type        = bool
  default     = true
}