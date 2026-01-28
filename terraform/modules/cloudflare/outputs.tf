output "cdn_endpoint" {
  description = "CDN endpoint"
  value       = "https://cdn.${var.domain_name}"
}

output "load_balancer_id" {
  description = "Load balancer ID"
  value       = cloudflare_load_balancer.main.id
}

output "pool_ids" {
  description = "Load balancer pool IDs"
  value = {
    eu_west_1      = cloudflare_load_balancer_pool.eu_west_1.id
    us_east_1      = cloudflare_load_balancer_pool.us_east_1.id
    ap_southeast_1 = cloudflare_load_balancer_pool.ap_southeast_1.id
  }
}
