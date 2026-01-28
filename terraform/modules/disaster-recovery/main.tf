resource "aws_lambda_function" "failover_orchestrator" {
  filename      = data.archive_file.failover_lambda.output_path
  function_name = "${var.project_name}-${var.environment}-failover-orchestrator"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 512

  environment {
    variables = {
      PROJECT_NAME = var.project_name
      ENVIRONMENT  = var.environment
      REGIONS      = jsonencode(keys(var.regions))
      ALERT_EMAIL  = var.alert_email
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-failover-orchestrator"
  })
}

data "archive_file" "failover_lambda" {
  type        = "zip"
  output_path = "${path.module}/failover_lambda.zip"

  source {
    content  = file("${path.module}/lambda/failover_orchestrator.py")
    filename = "index.py"
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-${var.environment}-failover-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-failover-lambda-role"
  })
}

resource "aws_iam_role_policy" "lambda_exec_policy" {
  name = "failover-permissions"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetHealthCheckStatus",
          "route53:UpdateHealthCheck"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:ModifyLoadBalancerAttributes"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:PromoteReadReplica",
          "rds:FailoverDBCluster"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "health_check_failure" {
  name        = "${var.project_name}-${var.environment}-health-check-failure"
  description = "Trigger failover on health check failure"

  event_pattern = jsonencode({
    source      = ["aws.route53"]
    detail-type = ["Route 53 Health Check Status Change"]
    detail = {
      status = ["FAILURE"]
    }
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-health-check-failure"
  })
}

resource "aws_cloudwatch_event_target" "failover_lambda" {
  rule      = aws_cloudwatch_event_rule.health_check_failure.name
  target_id = "FailoverOrchestrator"
  arn       = aws_lambda_function.failover_orchestrator.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_orchestrator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check_failure.arn
}

resource "aws_dynamodb_table" "failover_state" {
  name           = "${var.project_name}-${var.environment}-failover-state"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "region"
  range_key      = "timestamp"

  attribute {
    name = "region"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  ttl {
    attribute_name = "expiration"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-failover-state"
  })
}

resource "aws_sns_topic" "dr_notifications" {
  name = "${var.project_name}-${var.environment}-dr-notifications"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-dr-notifications"
  })
}

resource "aws_sns_topic_subscription" "dr_email" {
  topic_arn = aws_sns_topic.dr_notifications.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_log_group" "failover_logs" {
  name              = "/aws/lambda/${aws_lambda_function.failover_orchestrator.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-failover-logs"
  })
}

resource "aws_backup_plan" "cross_region" {
  name = "${var.project_name}-${var.environment}-cross-region-backup"

  rule {
    rule_name         = "daily-cross-region-backup"
    target_vault_name = aws_backup_vault.cross_region.name
    schedule          = "cron(0 3 * * ? *)"

    lifecycle {
      delete_after = 30
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.cross_region_replica.arn

      lifecycle {
        delete_after = 30
      }
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-cross-region-backup"
  })
}

resource "aws_backup_vault" "cross_region" {
  name = "${var.project_name}-${var.environment}-backup-vault"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-backup-vault"
  })
}

resource "aws_backup_vault" "cross_region_replica" {
  provider = aws.us_east_1
  name     = "${var.project_name}-${var.environment}-backup-vault-replica"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-backup-vault-replica"
  })
}

resource "aws_backup_selection" "rds_backup" {
  name         = "${var.project_name}-${var.environment}-rds-backup"
  plan_id      = aws_backup_plan.cross_region.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    for region, config in var.regional_configurations :
    "arn:aws:rds:${region}:*:db:${config.db_instance_id}"
  ]
}

resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-${var.environment}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-backup-role"
  })
}

resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "restore_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}
