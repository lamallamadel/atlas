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

variable "regional_endpoints" {
  description = "Regional endpoint configurations"
  type = map(object({
    alb_dns_name    = string
    alb_zone_id     = string
    health_check_id = string
    is_primary      = bool
  }))
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
