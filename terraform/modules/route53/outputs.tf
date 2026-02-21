output "zone_id" {
  description = "Route53 zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "zone_name_servers" {
  description = "Route53 zone name servers"
  value       = aws_route53_zone.main.name_servers
}

output "regional_endpoints" {
  description = "Regional endpoint URLs"
  value = {
    eu_west_1      = "https://eu-west-1.${var.domain_name}"
    us_east_1      = "https://us-east-1.${var.domain_name}"
    ap_southeast_1 = "https://ap-southeast-1.${var.domain_name}"
  }
}

output "global_api_endpoint" {
  description = "Global API endpoint (geo-routed)"
  value       = "https://api.${var.domain_name}"
}
