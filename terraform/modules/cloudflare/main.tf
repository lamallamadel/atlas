resource "cloudflare_record" "cdn" {
  zone_id = var.zone_id
  name    = "cdn"
  value   = var.domain_name
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  value   = var.domain_name
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

resource "cloudflare_load_balancer_pool" "eu_west_1" {
  account_id = var.account_id
  name       = "${var.project_name}-${var.environment}-eu-west-1"
  
  origins {
    name    = "eu-west-1-origin"
    address = var.regional_origins.eu_west_1.address
    enabled = true
    weight  = var.regional_origins.eu_west_1.weight
  }
  
  description         = "EU West 1 (Paris) origin pool"
  enabled             = true
  minimum_origins     = 1
  notification_email  = var.notification_email
  
  check_regions = ["WEUR", "EEUR"]
}

resource "cloudflare_load_balancer_pool" "us_east_1" {
  account_id = var.account_id
  name       = "${var.project_name}-${var.environment}-us-east-1"
  
  origins {
    name    = "us-east-1-origin"
    address = var.regional_origins.us_east_1.address
    enabled = true
    weight  = var.regional_origins.us_east_1.weight
  }
  
  description         = "US East 1 (Virginia) origin pool"
  enabled             = true
  minimum_origins     = 1
  notification_email  = var.notification_email
  
  check_regions = ["NAM"]
}

resource "cloudflare_load_balancer_pool" "ap_southeast_1" {
  account_id = var.account_id
  name       = "${var.project_name}-${var.environment}-ap-southeast-1"
  
  origins {
    name    = "ap-southeast-1-origin"
    address = var.regional_origins.ap_southeast_1.address
    enabled = true
    weight  = var.regional_origins.ap_southeast_1.weight
  }
  
  description         = "AP Southeast 1 (Singapore) origin pool"
  enabled             = true
  minimum_origins     = 1
  notification_email  = var.notification_email
  
  check_regions = ["SEAS", "NEAS"]
}

resource "cloudflare_load_balancer" "main" {
  zone_id = var.zone_id
  name    = "cdn.${var.domain_name}"
  
  default_pool_ids = [
    cloudflare_load_balancer_pool.eu_west_1.id,
    cloudflare_load_balancer_pool.us_east_1.id,
    cloudflare_load_balancer_pool.ap_southeast_1.id
  ]
  
  fallback_pool_id = cloudflare_load_balancer_pool.eu_west_1.id
  
  description = "Multi-region load balancer for ${var.project_name}"
  ttl         = 30
  proxied     = true
  
  region_pools {
    region   = "WEUR"
    pool_ids = [cloudflare_load_balancer_pool.eu_west_1.id]
  }
  
  region_pools {
    region   = "EEUR"
    pool_ids = [cloudflare_load_balancer_pool.eu_west_1.id]
  }
  
  region_pools {
    region   = "NAM"
    pool_ids = [cloudflare_load_balancer_pool.us_east_1.id]
  }
  
  region_pools {
    region   = "SAM"
    pool_ids = [cloudflare_load_balancer_pool.us_east_1.id]
  }
  
  region_pools {
    region   = "SEAS"
    pool_ids = [cloudflare_load_balancer_pool.ap_southeast_1.id]
  }
  
  region_pools {
    region   = "NEAS"
    pool_ids = [cloudflare_load_balancer_pool.ap_southeast_1.id]
  }
  
  region_pools {
    region   = "OC"
    pool_ids = [cloudflare_load_balancer_pool.ap_southeast_1.id]
  }
  
  steering_policy = "geo"
}

resource "cloudflare_page_rule" "cache_static_assets" {
  zone_id  = var.zone_id
  target   = "cdn.${var.domain_name}/assets/*"
  priority = 1
  
  actions {
    cache_level         = "cache_everything"
    edge_cache_ttl      = 7200
    browser_cache_ttl   = 3600
    cache_key_fields {
      query_string {
        exclude = ["*"]
      }
      header {
        include = []
      }
      cookie {
        include = []
      }
      user {
        device_type = false
        geo         = false
        lang        = false
      }
    }
  }
}

resource "cloudflare_page_rule" "cache_images" {
  zone_id  = var.zone_id
  target   = "cdn.${var.domain_name}/images/*"
  priority = 2
  
  actions {
    cache_level         = "cache_everything"
    edge_cache_ttl      = 86400
    browser_cache_ttl   = 7200
  }
}

resource "cloudflare_page_rule" "api_no_cache" {
  zone_id  = var.zone_id
  target   = "api.${var.domain_name}/api/*"
  priority = 3
  
  actions {
    cache_level = "bypass"
  }
}

resource "cloudflare_rate_limit" "api_rate_limit" {
  zone_id   = var.zone_id
  threshold = 1000
  period    = 60
  
  match {
    request {
      url_pattern = "api.${var.domain_name}/api/*"
    }
  }
  
  action {
    mode    = "challenge"
    timeout = 60
  }
  
  description = "API rate limiting"
}

resource "cloudflare_firewall_rule" "block_bad_bots" {
  zone_id     = var.zone_id
  description = "Block known bad bots"
  filter_id   = cloudflare_filter.bad_bots.id
  action      = "block"
  priority    = 1
}

resource "cloudflare_filter" "bad_bots" {
  zone_id     = var.zone_id
  description = "Known bad bots filter"
  expression  = "(cf.client.bot) and not (cf.verified_bot_category in {\"Search Engine Crawler\" \"Monitoring & Analytics\"})"
}

resource "cloudflare_zone_settings_override" "main" {
  zone_id = var.zone_id

  settings {
    tls_1_3                  = "on"
    automatic_https_rewrites = "on"
    ssl                      = "strict"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    opportunistic_encryption = "on"
    tls_client_auth         = "off"
    universal_ssl           = "on"
    
    brotli              = "on"
    early_hints         = "on"
    http2               = "on"
    http3               = "on"
    zero_rtt            = "on"
    
    cache_level         = "aggressive"
    browser_cache_ttl   = 14400
    challenge_ttl       = 1800
    
    development_mode    = "off"
    minify {
      css  = "on"
      js   = "on"
      html = "on"
    }
    
    rocket_loader       = "off"
    
    security_level      = "medium"
    browser_check       = "on"
    hotlink_protection  = "off"
    ip_geolocation      = "on"
    
    ipv6                = "on"
    websockets          = "on"
    
    pseudo_ipv4         = "off"
  }
}
