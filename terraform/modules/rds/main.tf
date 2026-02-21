resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-${var.region}"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-db-subnet-${var.region}"
    Region = var.region
  })
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg-${var.region}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "PostgreSQL from private subnets"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-rds-sg-${var.region}"
    Region = var.region
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-postgres-params-${var.region}"
  family = "postgres15"

  parameter {
    name  = "rds.logical_replication"
    value = "1"
  }

  parameter {
    name  = "wal_sender_timeout"
    value = "0"
  }

  parameter {
    name  = "max_wal_senders"
    value = "10"
  }

  parameter {
    name  = "max_replication_slots"
    value = "10"
  }

  parameter {
    name  = "max_logical_replication_workers"
    value = "10"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pglogical"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-postgres-params-${var.region}"
    Region = var.region
  })
}

resource "random_password" "master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.project_name}-${var.environment}-db-credentials-${var.region}"

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-db-credentials-${var.region}"
    Region = var.region
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "atlas_admin"
    password = random_password.master.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}-db-${var.region}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = "atlas"
  username = "atlas_admin"
  password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az               = var.multi_az
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = 60
  monitoring_role_arn            = aws_iam_role.rds_monitoring.arn

  deletion_protection = var.environment == "production" ? true : false
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-${var.environment}-db-final-${var.region}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  copy_tags_to_snapshot = true

  tags = merge(var.tags, {
    Name       = "${var.project_name}-${var.environment}-db-${var.region}"
    Region     = var.region
    IsPrimary  = var.is_primary ? "true" : "false"
  })
}

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption in ${var.region}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-rds-kms-${var.region}"
    Region = var.region
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-${var.environment}-rds-${var.region}"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-rds-monitoring-${var.region}"
    Region = var.region
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_db_snapshot" "daily" {
  count                  = var.is_primary ? 1 : 0
  db_instance_identifier = aws_db_instance.main.id
  db_snapshot_identifier = "${var.project_name}-${var.environment}-snapshot-${formatdate("YYYY-MM-DD", timestamp())}"

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-snapshot-${var.region}"
    Region = var.region
    Type   = "automated-daily"
  })
}
