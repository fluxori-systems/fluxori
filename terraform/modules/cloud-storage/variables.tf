/**
 * Cloud Storage Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The region to deploy resources to"
  type        = string
}

variable "storage_class" {
  description = "The storage class for GCS buckets"
  type        = string
  default     = "STANDARD"
}

variable "storage_buckets" {
  description = "List of storage buckets to create"
  type = list(object({
    name          = string
    location      = string
    force_destroy = bool
    versioning    = bool
  }))
  default = []
}