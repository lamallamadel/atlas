variable "regions" {
  description = "Regional configurations"
  type        = any
}

variable "regional_configurations" {
  description = "Regional resource configurations"
  type = map(object({
    db_instance_id  = string
    db_snapshot_arn = string
    ecs_cluster_arn = string
    ecs_service_arn = string
    alb_arn         = string
  }))
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "alert_email" {
  description = "Email for DR alerts"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
