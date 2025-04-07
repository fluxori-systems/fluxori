/**
 * Project Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "project_name" {
  description = "The name of the GCP project"
  type        = string
}

variable "billing_account" {
  description = "The ID of the billing account to associate with the project"
  type        = string
}

variable "org_id" {
  description = "The ID of the organization"
  type        = string
}