# Multi-Region Deployment - Quick Reference

## Common Commands

### Infrastructure Deployment

```bash
# Initialize Terraform
cd terraform
terraform init

# Deploy all regions
terraform apply

# Deploy specific region module
terraform apply -target=module.ecs_eu_west_1

# Destroy infrastructure (WARNING)
terraform destroy
```

### Application Deployment

```bash
# Deploy to all regions
./scripts/deploy-multi-region.sh production v1.2.3

# Check deployment status
aws ecs describe-services \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --services atlas-crm-production-service-eu-west-1 \
  --region eu-west-1
```

### Database Operations

```bash
# Connect to primary database
export DB_HOST=$(terraform output -raw regional_database_endpoints | jq -r '.eu_west_1')
psql -h $DB_HOST -U atlas_admin -d atlas

# Check replication status
SELECT * FROM pg_stat_replication;
SELECT * FROM pg_stat_subscription;

# Manual failover
aws rds reboot-db-instance \
  --db-instance-identifier atlas-production-db-eu-west-1 \
  --force-failover \
  --region eu-west-1
```

### Monitoring

```bash
# View CloudWatch logs
aws logs tail /ecs/atlas-crm-production-eu-west-1 --follow

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AtlasCRM/Production \
  --metric-name CrossRegionLatency \
  --dimensions Name=Region,Value=eu-west-1 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Troubleshooting

```bash
# Check ECS task logs
aws ecs describe-tasks \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --tasks $(aws ecs list-tasks --cluster atlas-crm-production-cluster-eu-west-1 --query 'taskArns[0]' --output text) \
  --region eu-west-1

# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups --names atlas-crm-production-tg-eu-west-1 --query 'TargetGroups[0].TargetGroupArn' --output text --region eu-west-1) \
  --region eu-west-1

# Test health endpoint
curl -i https://eu-west-1.atlas-crm.com/actuator/health
```

## Regional Endpoints

| Region | Endpoint | Dashboard |
|--------|----------|-----------|
| EU-West-1 | https://eu-west-1.atlas-crm.com | [Dashboard](https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1) |
| US-East-1 | https://us-east-1.atlas-crm.com | [Dashboard](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1) |
| AP-Southeast-1 | https://ap-southeast-1.atlas-crm.com | [Dashboard](https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1) |
| Global (Geo) | https://api.atlas-crm.com | N/A |
| CDN | https://cdn.atlas-crm.com | [Cloudflare Dashboard](https://dash.cloudflare.com) |

## Key Metrics & Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Cross-region latency | > 200ms | Alert + Investigation |
| ALB 5xx rate | > 5% | PagerDuty |
| ECS CPU | > 80% | Auto-scale |
| RDS CPU | > 80% | Alert |
| DB Replication lag | > 10s | Alert |
| Health check failure | 3 consecutive | Auto-failover |

## Emergency Contacts

- **On-Call**: +1-XXX-XXX-XXXX
- **Ops Email**: ops@atlas-crm.com
- **Security**: security@atlas-crm.com
- **DPO**: dpo@atlas-crm.com

## Quick Failover

```bash
# 1. Scale up backup region
aws ecs update-service \
  --cluster atlas-crm-production-cluster-us-east-1 \
  --service atlas-crm-production-service-us-east-1 \
  --desired-count 10 \
  --region us-east-1

# 2. Verify health
curl -i https://us-east-1.atlas-crm.com/actuator/health

# 3. Route53 already has automatic failover configured
# Manual override only if automatic failover fails
```

## Rollback

```bash
# Rollback ECS service
PREVIOUS_TASK_DEF=$(aws ecs list-task-definitions \
  --family-prefix atlas-crm-production-eu-west-1 \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text \
  --region eu-west-1)

aws ecs update-service \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --service atlas-crm-production-service-eu-west-1 \
  --task-definition $PREVIOUS_TASK_DEF \
  --region eu-west-1

# Verify rollback
aws ecs wait services-stable \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --services atlas-crm-production-service-eu-west-1 \
  --region eu-west-1
```

## Cost Monitoring

```bash
# Monthly cost estimate per region: ~$905
# Total for 3 regions: ~$2,715/month

# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```
