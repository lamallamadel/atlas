variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "regional_origins" {
  description = "Regional origin configurations"
  type = map(object({
    address = string
    weight  = number
  }))
}

variable "notification_email" {
  description = "Email for notifications"
  type        = string
  default     = ""
}
