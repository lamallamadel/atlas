resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-zone"
  })
}

resource "aws_route53_record" "regional_eu" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "eu-west-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.regional_endpoints.eu_west_1.alb_dns_name
    zone_id                = var.regional_endpoints.eu_west_1.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "regional_us" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "us-east-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.regional_endpoints.us_east_1.alb_dns_name
    zone_id                = var.regional_endpoints.us_east_1.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "regional_ap" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "ap-southeast-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.regional_endpoints.ap_southeast_1.alb_dns_name
    zone_id                = var.regional_endpoints.ap_southeast_1.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_geolocation_eu" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "eu-west-1"
  geolocation_routing_policy {
    continent = "EU"
  }

  alias {
    name                   = var.regional_endpoints.eu_west_1.alb_dns_name
    zone_id                = var.regional_endpoints.eu_west_1.alb_zone_id
    evaluate_target_health = true
  }

  health_check_id = var.regional_endpoints.eu_west_1.health_check_id
}

resource "aws_route53_record" "api_geolocation_na" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "us-east-1"
  geolocation_routing_policy {
    continent = "NA"
  }

  alias {
    name                   = var.regional_endpoints.us_east_1.alb_dns_name
    zone_id                = var.regional_endpoints.us_east_1.alb_zone_id
    evaluate_target_health = true
  }

  health_check_id = var.regional_endpoints.us_east_1.health_check_id
}

resource "aws_route53_record" "api_geolocation_as" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "ap-southeast-1"
  geolocation_routing_policy {
    continent = "AS"
  }

  alias {
    name                   = var.regional_endpoints.ap_southeast_1.alb_dns_name
    zone_id                = var.regional_endpoints.ap_southeast_1.alb_zone_id
    evaluate_target_health = true
  }

  health_check_id = var.regional_endpoints.ap_southeast_1.health_check_id
}

resource "aws_route53_record" "api_geolocation_default" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "default"
  geolocation_routing_policy {
    country = "*"
  }

  alias {
    name                   = var.regional_endpoints.eu_west_1.alb_dns_name
    zone_id                = var.regional_endpoints.eu_west_1.alb_zone_id
    evaluate_target_health = true
  }

  health_check_id = var.regional_endpoints.eu_west_1.health_check_id
}

resource "aws_route53_record" "api_latency_eu" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api-latency.${var.domain_name}"
  type    = "A"

  set_identifier = "eu-west-1"
  latency_routing_policy {
    region = "eu-west-1"
  }

  alias {
    name                   = var.regional_endpoints.eu_west_1.alb_dns_name
    zone_id                = var.regional_endpoints.eu_west_1.alb_zone_id
    evaluate_target_health = true
  }

  health_check_id = var.regional_endpoints.eu_west_1.health_check_id
}

resource "aws_route53_record" "api_latency_us" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api-latency.${var.domain_name}"
  type    = "A"

  set_identifier = "us-east-1"
  latency_routing_policy {
    region = "us-east-1"
  }

  alias {
    name                   = var.regional_endpoints.us_east_1.alb_dns_name
    zone_id                = var.regional_endpoints.us_east_1.alb_zone_id
    evaluate_target_health = true
  }

  health_check_id = var.regional_endpoints.us_east_1.health_check_id
}

resource "aws_route53_record" "api_latency_ap" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api-latency.${var.domain_name}"
  type    = "A"

  set_identifier = "ap-southeast-1"
  latency_routing_policy {
    region = "ap-southeast-1"
  }

  alias {
    name                   = var.regional_endpoints.ap_southeast_1.alb_dns_name
    zone_id                = var.regional_endpoints.ap_southeast_1.alb_zone_id
    evaluate_target_health = true
  }

  health_check_id = var.regional_endpoints.ap_southeast_1.health_check_id
}
