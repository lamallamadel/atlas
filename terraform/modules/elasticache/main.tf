resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-${var.region}"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-redis-subnet-${var.region}"
    Region = var.region
  })
}

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis-sg-${var.region}"
  description = "Security group for Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "Redis from private subnets"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-redis-sg-${var.region}"
    Region = var.region
  })
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-redis-params-${var.region}"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-redis-params-${var.region}"
    Region = var.region
  })
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.project_name}-${var.environment}-redis-${var.region}"
  replication_group_description = "Redis cluster for ${var.project_name} ${var.environment} in ${var.region}"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  port                 = 6379
  
  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled          = var.num_cache_nodes > 1
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled        = true
  auth_token                = random_password.redis_auth.result
  
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "mon:05:00-mon:07:00"
  
  auto_minor_version_upgrade = true
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-redis-${var.region}"
    Region = var.region
  })
}

resource "random_password" "redis_auth" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name = "${var.project_name}-${var.environment}-redis-auth-${var.region}"

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-redis-auth-${var.region}"
    Region = var.region
  })
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth.result
    endpoint   = aws_elasticache_replication_group.main.configuration_endpoint_address
    port       = 6379
  })
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/elasticache/${var.project_name}-${var.environment}-${var.region}"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-redis-logs-${var.region}"
    Region = var.region
  })
}
