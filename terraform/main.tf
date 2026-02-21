terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
    bucket         = "atlas-terraform-state"
    key            = "multi-region/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "atlas-terraform-locks"
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

locals {
  project_name = "atlas-crm"
  environment  = var.environment
  
  regions = {
    eu_west_1 = {
      name            = "eu-west-1"
      display_name    = "Europe (Paris)"
      provider_alias  = "eu_west_1"
      is_primary      = true
      vpc_cidr        = "10.0.0.0/16"
      availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
    }
    us_east_1 = {
      name            = "us-east-1"
      display_name    = "North America (Virginia)"
      provider_alias  = "us_east_1"
      is_primary      = false
      vpc_cidr        = "10.1.0.0/16"
      availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
    }
    ap_southeast_1 = {
      name            = "ap-southeast-1"
      display_name    = "Asia (Singapore)"
      provider_alias  = "ap_southeast_1"
      is_primary      = false
      vpc_cidr        = "10.2.0.0/16"
      availability_zones = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
    }
  }
  
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}

module "vpc_eu_west_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.eu_west_1
  }
  
  region             = local.regions.eu_west_1.name
  vpc_cidr           = local.regions.eu_west_1.vpc_cidr
  availability_zones = local.regions.eu_west_1.availability_zones
  project_name       = local.project_name
  environment        = local.environment
  tags               = local.common_tags
}

module "vpc_us_east_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.us_east_1
  }
  
  region             = local.regions.us_east_1.name
  vpc_cidr           = local.regions.us_east_1.vpc_cidr
  availability_zones = local.regions.us_east_1.availability_zones
  project_name       = local.project_name
  environment        = local.environment
  tags               = local.common_tags
}

module "vpc_ap_southeast_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.ap_southeast_1
  }
  
  region             = local.regions.ap_southeast_1.name
  vpc_cidr           = local.regions.ap_southeast_1.vpc_cidr
  availability_zones = local.regions.ap_southeast_1.availability_zones
  project_name       = local.project_name
  environment        = local.environment
  tags               = local.common_tags
}

module "rds_eu_west_1" {
  source = "./modules/rds"
  providers = {
    aws = aws.eu_west_1
  }
  
  region                  = local.regions.eu_west_1.name
  vpc_id                  = module.vpc_eu_west_1.vpc_id
  private_subnet_ids      = module.vpc_eu_west_1.private_subnet_ids
  project_name            = local.project_name
  environment             = local.environment
  is_primary              = true
  multi_az                = true
  backup_retention_period = 7
  tags                    = local.common_tags
}

module "rds_us_east_1" {
  source = "./modules/rds"
  providers = {
    aws = aws.us_east_1
  }
  
  region                  = local.regions.us_east_1.name
  vpc_id                  = module.vpc_us_east_1.vpc_id
  private_subnet_ids      = module.vpc_us_east_1.private_subnet_ids
  project_name            = local.project_name
  environment             = local.environment
  is_primary              = false
  multi_az                = true
  backup_retention_period = 7
  tags                    = local.common_tags
}

module "rds_ap_southeast_1" {
  source = "./modules/rds"
  providers = {
    aws = aws.ap_southeast_1
  }
  
  region                  = local.regions.ap_southeast_1.name
  vpc_id                  = module.vpc_ap_southeast_1.vpc_id
  private_subnet_ids      = module.vpc_ap_southeast_1.private_subnet_ids
  project_name            = local.project_name
  environment             = local.environment
  is_primary              = false
  multi_az                = true
  backup_retention_period = 7
  tags                    = local.common_tags
}

module "ecs_eu_west_1" {
  source = "./modules/ecs"
  providers = {
    aws = aws.eu_west_1
  }
  
  region             = local.regions.eu_west_1.name
  vpc_id             = module.vpc_eu_west_1.vpc_id
  private_subnet_ids = module.vpc_eu_west_1.private_subnet_ids
  public_subnet_ids  = module.vpc_eu_west_1.public_subnet_ids
  project_name       = local.project_name
  environment        = local.environment
  db_endpoint        = module.rds_eu_west_1.endpoint
  db_secret_arn      = module.rds_eu_west_1.secret_arn
  redis_endpoint     = module.elasticache_eu_west_1.endpoint
  tags               = local.common_tags
}

module "ecs_us_east_1" {
  source = "./modules/ecs"
  providers = {
    aws = aws.us_east_1
  }
  
  region             = local.regions.us_east_1.name
  vpc_id             = module.vpc_us_east_1.vpc_id
  private_subnet_ids = module.vpc_us_east_1.private_subnet_ids
  public_subnet_ids  = module.vpc_us_east_1.public_subnet_ids
  project_name       = local.project_name
  environment        = local.environment
  db_endpoint        = module.rds_us_east_1.endpoint
  db_secret_arn      = module.rds_us_east_1.secret_arn
  redis_endpoint     = module.elasticache_us_east_1.endpoint
  tags               = local.common_tags
}

module "ecs_ap_southeast_1" {
  source = "./modules/ecs"
  providers = {
    aws = aws.ap_southeast_1
  }
  
  region             = local.regions.ap_southeast_1.name
  vpc_id             = module.vpc_ap_southeast_1.vpc_id
  private_subnet_ids = module.vpc_ap_southeast_1.private_subnet_ids
  public_subnet_ids  = module.vpc_ap_southeast_1.public_subnet_ids
  project_name       = local.project_name
  environment        = local.environment
  db_endpoint        = module.rds_ap_southeast_1.endpoint
  db_secret_arn      = module.rds_ap_southeast_1.secret_arn
  redis_endpoint     = module.elasticache_ap_southeast_1.endpoint
  tags               = local.common_tags
}

module "elasticache_eu_west_1" {
  source = "./modules/elasticache"
  providers = {
    aws = aws.eu_west_1
  }
  
  region             = local.regions.eu_west_1.name
  vpc_id             = module.vpc_eu_west_1.vpc_id
  private_subnet_ids = module.vpc_eu_west_1.private_subnet_ids
  project_name       = local.project_name
  environment        = local.environment
  tags               = local.common_tags
}

module "elasticache_us_east_1" {
  source = "./modules/elasticache"
  providers = {
    aws = aws.us_east_1
  }
  
  region             = local.regions.us_east_1.name
  vpc_id             = module.vpc_us_east_1.vpc_id
  private_subnet_ids = module.vpc_us_east_1.private_subnet_ids
  project_name       = local.project_name
  environment        = local.environment
  tags               = local.common_tags
}

module "elasticache_ap_southeast_1" {
  source = "./modules/elasticache"
  providers = {
    aws = aws.ap_southeast_1
  }
  
  region             = local.regions.ap_southeast_1.name
  vpc_id             = module.vpc_ap_southeast_1.vpc_id
  private_subnet_ids = module.vpc_ap_southeast_1.private_subnet_ids
  project_name       = local.project_name
  environment        = local.environment
  tags               = local.common_tags
}

module "route53" {
  source = "./modules/route53"
  
  domain_name = var.domain_name
  project_name = local.project_name
  environment  = local.environment
  
  regional_endpoints = {
    eu_west_1 = {
      alb_dns_name    = module.ecs_eu_west_1.alb_dns_name
      alb_zone_id     = module.ecs_eu_west_1.alb_zone_id
      health_check_id = module.monitoring_eu_west_1.health_check_id
      is_primary      = true
    }
    us_east_1 = {
      alb_dns_name    = module.ecs_us_east_1.alb_dns_name
      alb_zone_id     = module.ecs_us_east_1.alb_zone_id
      health_check_id = module.monitoring_us_east_1.health_check_id
      is_primary      = false
    }
    ap_southeast_1 = {
      alb_dns_name    = module.ecs_ap_southeast_1.alb_dns_name
      alb_zone_id     = module.ecs_ap_southeast_1.alb_zone_id
      health_check_id = module.monitoring_ap_southeast_1.health_check_id
      is_primary      = false
    }
  }
  
  tags = local.common_tags
}

module "cloudflare_cdn" {
  source = "./modules/cloudflare"
  
  zone_id      = var.cloudflare_zone_id
  domain_name  = var.domain_name
  project_name = local.project_name
  environment  = local.environment
  
  regional_origins = {
    eu_west_1 = {
      address = module.ecs_eu_west_1.alb_dns_name
      weight  = 1.0
    }
    us_east_1 = {
      address = module.ecs_us_east_1.alb_dns_name
      weight  = 1.0
    }
    ap_southeast_1 = {
      address = module.ecs_ap_southeast_1.alb_dns_name
      weight  = 1.0
    }
  }
}

module "monitoring_eu_west_1" {
  source = "./modules/monitoring"
  providers = {
    aws = aws.eu_west_1
  }
  
  region            = local.regions.eu_west_1.name
  project_name      = local.project_name
  environment       = local.environment
  alb_arn           = module.ecs_eu_west_1.alb_arn
  ecs_cluster_name  = module.ecs_eu_west_1.cluster_name
  ecs_service_name  = module.ecs_eu_west_1.service_name
  rds_instance_id   = module.rds_eu_west_1.instance_id
  health_check_url  = "https://${local.regions.eu_west_1.name}.${var.domain_name}/actuator/health"
  alert_email       = var.alert_email
  tags              = local.common_tags
}

module "monitoring_us_east_1" {
  source = "./modules/monitoring"
  providers = {
    aws = aws.us_east_1
  }
  
  region            = local.regions.us_east_1.name
  project_name      = local.project_name
  environment       = local.environment
  alb_arn           = module.ecs_us_east_1.alb_arn
  ecs_cluster_name  = module.ecs_us_east_1.cluster_name
  ecs_service_name  = module.ecs_us_east_1.service_name
  rds_instance_id   = module.rds_us_east_1.instance_id
  health_check_url  = "https://${local.regions.us_east_1.name}.${var.domain_name}/actuator/health"
  alert_email       = var.alert_email
  tags              = local.common_tags
}

module "monitoring_ap_southeast_1" {
  source = "./modules/monitoring"
  providers = {
    aws = aws.ap_southeast_1
  }
  
  region            = local.regions.ap_southeast_1.name
  project_name      = local.project_name
  environment       = local.environment
  alb_arn           = module.ecs_ap_southeast_1.alb_arn
  ecs_cluster_name  = module.ecs_ap_southeast_1.cluster_name
  ecs_service_name  = module.ecs_ap_southeast_1.service_name
  rds_instance_id   = module.rds_ap_southeast_1.instance_id
  health_check_url  = "https://${local.regions.ap_southeast_1.name}.${var.domain_name}/actuator/health"
  alert_email       = var.alert_email
  tags              = local.common_tags
}

module "disaster_recovery" {
  source = "./modules/disaster-recovery"
  
  regions = local.regions
  
  regional_configurations = {
    eu_west_1 = {
      db_instance_id    = module.rds_eu_west_1.instance_id
      db_snapshot_arn   = module.rds_eu_west_1.snapshot_arn
      ecs_cluster_arn   = module.ecs_eu_west_1.cluster_arn
      ecs_service_arn   = module.ecs_eu_west_1.service_arn
      alb_arn           = module.ecs_eu_west_1.alb_arn
    }
    us_east_1 = {
      db_instance_id    = module.rds_us_east_1.instance_id
      db_snapshot_arn   = module.rds_us_east_1.snapshot_arn
      ecs_cluster_arn   = module.ecs_us_east_1.cluster_arn
      ecs_service_arn   = module.ecs_us_east_1.service_arn
      alb_arn           = module.ecs_us_east_1.alb_arn
    }
    ap_southeast_1 = {
      db_instance_id    = module.rds_ap_southeast_1.instance_id
      db_snapshot_arn   = module.rds_ap_southeast_1.snapshot_arn
      ecs_cluster_arn   = module.ecs_ap_southeast_1.cluster_arn
      ecs_service_arn   = module.ecs_ap_southeast_1.service_arn
      alb_arn           = module.ecs_ap_southeast_1.alb_arn
    }
  }
  
  project_name = local.project_name
  environment  = local.environment
  alert_email  = var.alert_email
  tags         = local.common_tags
}
