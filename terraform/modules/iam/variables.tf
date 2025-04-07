/**
 * IAM Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "service_accounts" {
  description = "List of service accounts to create"
  type = list(object({
    account_id   = string
    display_name = string
    description  = string
    roles        = list(string)
  }))
  default = []
}