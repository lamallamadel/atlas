resource "aws_route53_health_check" "main" {
  fqdn              = replace(var.health_check_url, "https://", "")
  port              = 443
  type              = "HTTPS"
  resource_path     = "/actuator/health"
  failure_threshold = 3
  request_interval  = 30
  measure_latency   = true

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-health-${var.region}"
    Region = var.region
  })
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts-${var.region}"

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-alerts-${var.region}"
    Region = var.region
  })
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-${var.region}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", label = "Response Time (avg)" }],
            [".", ".", { stat = "p99", label = "Response Time (p99)" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ALB Response Time"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }],
            [".", "HTTPCode_Target_2XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }],
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "ALB Request Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ECS Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            [".", "DatabaseConnections", { stat = "Average" }],
            [".", "FreeableMemory", { stat = "Average" }],
            [".", "ReadLatency", { stat = "Average" }],
            [".", "WriteLatency", { stat = "Average" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average" }],
            [".", "DatabaseMemoryUsagePercentage", { stat = "Average" }],
            [".", "EngineCPUUtilization", { stat = "Average" }],
            [".", "CacheHits", { stat = "Sum" }],
            [".", "CacheMisses", { stat = "Sum" }],
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ElastiCache Metrics"
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '/ecs/${var.project_name}-${var.environment}-${var.region}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region  = var.region
          title   = "Recent Errors"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors ALB 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-alb-5xx-${var.region}"
    Region = var.region
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-latency-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0.2
  alarm_description   = "API response time exceeds 200ms"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-alb-latency-${var.region}"
    Region = var.region
  })
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-ecs-cpu-${var.region}"
    Region = var.region
  })
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-rds-cpu-${var.region}"
    Region = var.region
  })
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-storage-${var.region}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240
  alarm_description   = "RDS free storage space is low (< 10GB)"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-rds-storage-${var.region}"
    Region = var.region
  })
}

resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.project_name}-${var.environment}-error-count-${var.region}"
  log_group_name = "/ecs/${var.project_name}-${var.environment}-${var.region}"
  pattern        = "[time, request_id, level = ERROR*, ...]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
    default_value = 0
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-error-rate-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ErrorCount"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "Error rate is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-error-rate-${var.region}"
    Region = var.region
  })
}

resource "aws_cloudwatch_metric_alarm" "cross_region_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-cross-region-latency-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CrossRegionLatency"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Average"
  threshold           = 0.2
  alarm_description   = "Cross-region API latency exceeds 200ms"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.tags, {
    Name   = "${var.project_name}-${var.environment}-cross-region-latency-${var.region}"
    Region = var.region
  })
}
