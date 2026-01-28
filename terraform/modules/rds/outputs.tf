output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "RDS address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "secret_arn" {
  description = "Secrets Manager ARN for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "snapshot_arn" {
  description = "Latest snapshot ARN"
  value       = var.is_primary && length(aws_db_snapshot.daily) > 0 ? aws_db_snapshot.daily[0].db_snapshot_arn : null
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
