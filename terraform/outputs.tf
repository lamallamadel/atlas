output "regional_endpoints" {
  description = "Regional API endpoints"
  value = {
    eu_west_1      = "https://${local.regions.eu_west_1.name}.${var.domain_name}"
    us_east_1      = "https://${local.regions.us_east_1.name}.${var.domain_name}"
    ap_southeast_1 = "https://${local.regions.ap_southeast_1.name}.${var.domain_name}"
  }
}

output "global_endpoint" {
  description = "Global API endpoint (geo-routed)"
  value       = "https://api.${var.domain_name}"
}

output "cdn_endpoint" {
  description = "CDN endpoint for static assets"
  value       = "https://cdn.${var.domain_name}"
}

output "regional_database_endpoints" {
  description = "Regional database endpoints"
  value = {
    eu_west_1      = module.rds_eu_west_1.endpoint
    us_east_1      = module.rds_us_east_1.endpoint
    ap_southeast_1 = module.rds_ap_southeast_1.endpoint
  }
  sensitive = true
}

output "monitoring_dashboards" {
  description = "CloudWatch dashboard URLs per region"
  value = {
    eu_west_1      = module.monitoring_eu_west_1.dashboard_url
    us_east_1      = module.monitoring_us_east_1.dashboard_url
    ap_southeast_1 = module.monitoring_ap_southeast_1.dashboard_url
  }
}
