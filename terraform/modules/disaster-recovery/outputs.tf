output "failover_lambda_arn" {
  description = "Failover orchestrator Lambda ARN"
  value       = aws_lambda_function.failover_orchestrator.arn
}

output "failover_state_table" {
  description = "DynamoDB table for failover state"
  value       = aws_dynamodb_table.failover_state.name
}

output "dr_notifications_topic_arn" {
  description = "SNS topic ARN for DR notifications"
  value       = aws_sns_topic.dr_notifications.arn
}

output "backup_plan_id" {
  description = "AWS Backup plan ID"
  value       = aws_backup_plan.cross_region.id
}
