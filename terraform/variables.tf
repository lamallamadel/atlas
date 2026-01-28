variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Root domain name for the application"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for CDN configuration"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the domain"
  type        = string
}

variable "alert_email" {
  description = "Email address for alerts and notifications"
  type        = string
}

variable "db_master_username" {
  description = "Master username for RDS databases"
  type        = string
  default     = "atlas_admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for RDS databases"
  type        = string
  sensitive   = true
}
