/**
 * VPC Module Variables
 */

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The region to deploy resources to"
  type        = string
}

variable "network_name" {
  description = "The name of the VPC network"
  type        = string
  default     = "fluxori-network"
}

variable "subnet_name" {
  description = "The name of the subnet"
  type        = string
  default     = "fluxori-subnet"
}

variable "subnet_ip_cidr_range" {
  description = "The IP CIDR range for the subnet"
  type        = string
  default     = "10.0.0.0/20"
}

variable "connector_ip_cidr_range" {
  description = "The IP CIDR range for the VPC connector"
  type        = string
  default     = "10.8.0.0/28"
}

variable "secondary_ranges" {
  description = "Secondary IP ranges for the subnet"
  type = map(list(object({
    range_name    = string
    ip_cidr_range = string
  })))
  default = {}
}