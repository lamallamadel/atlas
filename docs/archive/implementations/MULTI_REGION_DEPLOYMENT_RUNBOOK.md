# Multi-Region Deployment Runbook

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Initial Deployment](#initial-deployment)
5. [Database Replication Setup](#database-replication-setup)
6. [Disaster Recovery Procedures](#disaster-recovery-procedures)
7. [Monitoring and Alerting](#monitoring-and-alerting)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

## Overview

This runbook describes the procedures for deploying, operating, and maintaining the Atlas CRM multi-region infrastructure across three AWS regions:

- **EU-West-1 (Paris)**: Primary region for European customers
- **US-East-1 (Virginia)**: Primary region for North American customers  
- **AP-Southeast-1 (Singapore)**: Primary region for Asian market customers

### Key Features
- Geo-distributed infrastructure with automated region routing
- PostgreSQL logical replication for global entities
- Region-isolated data for GDPR compliance
- Automated failover with health monitoring
- CDN edge caching via Cloudflare
- Cross-region latency monitoring

## Architecture

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────┐
│                     Cloudflare CDN                       │
│            (Global Load Balancing + Caching)             │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │   Route53 DNS    │
        │  (Geo-routing)   │
        └────────┬─────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
┌────▼────┐ ┌───▼────┐ ┌───▼────┐
│EU-West-1│ │US-East-1│ │AP-SE-1│
│  Region │ │ Region  │ │ Region │
└────┬────┘ └───┬────┘ └───┬────┘
     │          │           │
     │  Logical Replication │
     └──────────┼───────────┘
                │
         Global Entities
```

### Regional Stack
Each region contains:
- VPC with public/private subnets across 3 AZs
- Application Load Balancer (ALB)
- ECS Fargate cluster (2-10 tasks, auto-scaling)
- RDS PostgreSQL 15 (Multi-AZ, logical replication enabled)
- ElastiCache Redis cluster (2+ nodes)
- CloudWatch monitoring and alarms

## Prerequisites

### Required Tools
```bash
# Terraform >= 1.5.0
terraform version

# AWS CLI v2
aws --version

# kubectl (for ECS Exec)
kubectl version

# PostgreSQL client 15
psql --version
```

### Required AWS Credentials
```bash
# Configure AWS profiles for each region
aws configure --profile atlas-eu-west-1
aws configure --profile atlas-us-east-1
aws configure --profile atlas-ap-southeast-1
```

### Required Environment Variables
```bash
export TF_VAR_domain_name="atlas-crm.com"
export TF_VAR_cloudflare_api_token="your-token"
export TF_VAR_cloudflare_zone_id="your-zone-id"
export TF_VAR_alert_email="ops@atlas-crm.com"
export TF_VAR_db_master_password="$(aws secretsmanager get-secret-value --secret-id atlas-db-master-password --query SecretString --output text)"
```

## Initial Deployment

### Step 1: Initialize Terraform

```bash
cd terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan -out=tfplan
```

### Step 2: Deploy Infrastructure

```bash
# Deploy all regions simultaneously
terraform apply tfplan

# Expected duration: 45-60 minutes
```

### Step 3: Verify Regional Deployments

```bash
# Check EU-West-1
aws ecs describe-services \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --services atlas-crm-production-service-eu-west-1 \
  --region eu-west-1

# Check US-East-1
aws ecs describe-services \
  --cluster atlas-crm-production-cluster-us-east-1 \
  --services atlas-crm-production-service-us-east-1 \
  --region us-east-1

# Check AP-Southeast-1
aws ecs describe-services \
  --cluster atlas-crm-production-cluster-ap-southeast-1 \
  --services atlas-crm-production-service-ap-southeast-1 \
  --region ap-southeast-1
```

### Step 4: Configure DNS

```bash
# Get Route53 name servers
terraform output zone_name_servers

# Update domain registrar with name servers
# Wait for DNS propagation (up to 48 hours)
```

### Step 5: Verify Endpoints

```bash
# Test regional endpoints
curl -I https://eu-west-1.atlas-crm.com/actuator/health
curl -I https://us-east-1.atlas-crm.com/actuator/health
curl -I https://ap-southeast-1.atlas-crm.com/actuator/health

# Test global geo-routed endpoint
curl -I https://api.atlas-crm.com/actuator/health

# Test CDN endpoint
curl -I https://cdn.atlas-crm.com
```

## Database Replication Setup

### Step 1: Enable Logical Replication

Logical replication is automatically configured via RDS parameter group:
```
rds.logical_replication = 1
max_wal_senders = 10
max_replication_slots = 10
```

### Step 2: Create Publications (Primary Region)

Connect to EU-West-1 (primary):
```bash
export PRIMARY_DB_HOST=$(terraform output -raw regional_database_endpoints | jq -r '.eu_west_1')
psql -h $PRIMARY_DB_HOST -U atlas_admin -d atlas

-- Create publication for global entities
CREATE PUBLICATION atlas_publication FOR TABLE 
  organization,
  app_user,
  user_preferences,
  referential,
  system_config;

-- Verify publication
SELECT * FROM pg_publication_tables WHERE pubname = 'atlas_publication';
```

### Step 3: Create Subscriptions (Secondary Regions)

**US-East-1:**
```bash
export US_DB_HOST=$(terraform output -raw regional_database_endpoints | jq -r '.us_east_1')
psql -h $US_DB_HOST -U atlas_admin -d atlas

CREATE SUBSCRIPTION atlas_subscription_from_eu
  CONNECTION 'host=$PRIMARY_DB_HOST port=5432 dbname=atlas user=atlas_admin password=xxx'
  PUBLICATION atlas_publication
  WITH (copy_data = true, create_slot = true);
```

**AP-Southeast-1:**
```bash
export AP_DB_HOST=$(terraform output -raw regional_database_endpoints | jq -r '.ap_southeast_1')
psql -h $AP_DB_HOST -U atlas_admin -d atlas

CREATE SUBSCRIPTION atlas_subscription_from_eu
  CONNECTION 'host=$PRIMARY_DB_HOST port=5432 dbname=atlas user=atlas_admin password=xxx'
  PUBLICATION atlas_publication
  WITH (copy_data = true, create_slot = true);
```

### Step 4: Verify Replication Status

```sql
-- On primary (EU-West-1)
SELECT * FROM pg_replication_slots;
SELECT * FROM pg_stat_replication;

-- On secondaries
SELECT * FROM pg_subscription;
SELECT * FROM pg_stat_subscription;
```

### Step 5: Setup Bidirectional Replication (Optional)

For multi-master setup with conflict resolution:

```bash
# Each region becomes both publisher and subscriber
# See docs/DATABASE_REPLICATION.md for detailed setup
```

## Disaster Recovery Procedures

### Automatic Failover

Automatic failover is triggered when:
- Route53 health check fails (3 consecutive failures over 90 seconds)
- Lambda function `failover-orchestrator` executes
- Traffic redirected to healthy regions
- Backup region scales up automatically

### Manual Failover

#### Scenario 1: Region Complete Outage

```bash
# 1. Verify region is down
aws ecs describe-services \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --services atlas-crm-production-service-eu-west-1 \
  --region eu-west-1

# 2. Scale up backup region (US-East-1)
aws ecs update-service \
  --cluster atlas-crm-production-cluster-us-east-1 \
  --service atlas-crm-production-service-us-east-1 \
  --desired-count 10 \
  --region us-east-1

# 3. Update Route53 to disable failed region
aws route53 change-resource-record-sets \
  --hosted-zone-id $(terraform output -raw zone_id) \
  --change-batch file://disable-eu-west-1.json

# 4. Monitor CloudWatch dashboards
# EU-West-1: https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1
# US-East-1: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1
```

#### Scenario 2: Database Failure

```bash
# 1. Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier atlas-production-db-eu-west-1 \
  --region eu-west-1

# 2. If Multi-AZ, trigger failover
aws rds reboot-db-instance \
  --db-instance-identifier atlas-production-db-eu-west-1 \
  --force-failover \
  --region eu-west-1

# 3. Promote read replica if primary is unrecoverable
aws rds promote-read-replica \
  --db-instance-identifier atlas-production-db-eu-west-1-replica \
  --region eu-west-1

# 4. Restore from snapshot to different region
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier atlas-production-db-eu-west-1-restored \
  --db-snapshot-identifier atlas-production-snapshot-latest \
  --db-instance-class db.r6g.xlarge \
  --region us-east-1
```

### Recovery Steps

```bash
# 1. Investigate root cause
# Check CloudWatch logs
aws logs tail /ecs/atlas-crm-production-eu-west-1 --follow --region eu-west-1

# 2. Fix underlying issue (e.g., deploy hotfix)
# Deploy new ECS task definition
aws ecs update-service \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --service atlas-crm-production-service-eu-west-1 \
  --task-definition atlas-crm-production-eu-west-1:NEW_VERSION \
  --region eu-west-1

# 3. Verify health
curl https://eu-west-1.atlas-crm.com/actuator/health

# 4. Re-enable region in Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id $(terraform output -raw zone_id) \
  --change-batch file://enable-eu-west-1.json

# 5. Scale down backup region to normal capacity
aws ecs update-service \
  --cluster atlas-crm-production-cluster-us-east-1 \
  --service atlas-crm-production-service-us-east-1 \
  --desired-count 2 \
  --region us-east-1
```

## Monitoring and Alerting

### CloudWatch Dashboards

Access regional dashboards:
- EU-West-1: `terraform output monitoring_dashboards.eu_west_1`
- US-East-1: `terraform output monitoring_dashboards.us_east_1`
- AP-Southeast-1: `terraform output monitoring_dashboards.ap_southeast_1`

### Key Metrics to Monitor

1. **Application Health**
   - ECS Task count and health
   - ALB target health
   - HTTP 5xx error rate
   - Response time (p50, p95, p99)

2. **Database Health**
   - CPU utilization
   - Connection count
   - Replication lag
   - Storage space

3. **Cross-Region Latency**
   - API call latency between regions
   - Alert threshold: 200ms

4. **Replication Status**
   - Replication slot lag
   - Subscription status
   - Conflict count

### Alert Configuration

Alerts are sent to: `ops@atlas-crm.com`

Critical alerts (PagerDuty):
- Region health check failure
- Database replication lag > 10 seconds
- ALB 5xx error rate > 5%
- ECS service unhealthy

Warning alerts (Email):
- Cross-region latency > 200ms
- Database CPU > 80%
- ECS task count at max capacity

## Rollback Procedures

### Application Rollback

```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix atlas-crm-production-eu-west-1 \
  --region eu-west-1

# Rollback to previous version
PREVIOUS_VERSION="atlas-crm-production-eu-west-1:42"
aws ecs update-service \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --service atlas-crm-production-service-eu-west-1 \
  --task-definition $PREVIOUS_VERSION \
  --region eu-west-1

# Monitor rollback
aws ecs wait services-stable \
  --cluster atlas-crm-production-cluster-eu-west-1 \
  --services atlas-crm-production-service-eu-west-1 \
  --region eu-west-1
```

### Database Schema Rollback

```bash
# Connect to database
psql -h $DB_HOST -U atlas_admin -d atlas

-- Check current Flyway version
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;

-- Flyway doesn't support automatic rollback
-- Must manually write undo migrations or restore from backup

-- Restore from snapshot (if necessary)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier atlas-production-db-rollback \
  --db-snapshot-identifier atlas-production-snapshot-before-migration \
  --region eu-west-1
```

### Infrastructure Rollback

```bash
# Rollback to previous Terraform state
terraform state list

# Restore specific resource
terraform import module.ecs_eu_west_1.aws_ecs_service.app \
  "arn:aws:ecs:eu-west-1:123456789:service/atlas-crm-production-cluster-eu-west-1/atlas-crm-production-service-eu-west-1"

# Full infrastructure rollback
git checkout previous-working-commit
terraform plan
terraform apply
```

## Troubleshooting

### Issue: High Cross-Region Latency

**Symptoms:** API calls between regions exceed 200ms

**Diagnosis:**
```bash
# Check CloudWatch metric
aws cloudwatch get-metric-statistics \
  --namespace AtlasCRM/Production \
  --metric-name CrossRegionLatency \
  --dimensions Name=Region,Value=eu-west-1 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region eu-west-1
```

**Solutions:**
1. Check network connectivity between VPCs
2. Verify VPC peering connections
3. Enable VPC flow logs for analysis
4. Consider using AWS Global Accelerator

### Issue: Replication Lag

**Symptoms:** Data not syncing between regions

**Diagnosis:**
```sql
-- On primary
SELECT * FROM pg_stat_replication;

-- On secondary
SELECT * FROM pg_stat_subscription;

-- Check replication lag
SELECT 
  application_name,
  client_addr,
  state,
  sync_state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

**Solutions:**
1. Check network bandwidth between regions
2. Verify replication slots haven't been dropped
3. Check for long-running transactions
4. Increase WAL retention if necessary

### Issue: Failover Not Triggering

**Symptoms:** Region down but traffic not redirecting

**Diagnosis:**
```bash
# Check health check status
aws route53 get-health-check-status \
  --health-check-id HEALTH_CHECK_ID

# Check Lambda logs
aws logs tail /aws/lambda/atlas-production-failover-orchestrator \
  --follow \
  --region eu-west-1
```

**Solutions:**
1. Verify health check configuration
2. Check Lambda execution role permissions
3. Verify EventBridge rule is enabled
4. Test Lambda function manually

### Issue: Database Connection Pool Exhaustion

**Symptoms:** Application cannot connect to database

**Diagnosis:**
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'atlas';
SELECT * FROM pg_stat_activity WHERE datname = 'atlas' AND state = 'active';
```

**Solutions:**
1. Increase RDS max_connections parameter
2. Optimize application connection pool settings
3. Kill idle connections
4. Scale up RDS instance

## Emergency Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Database Team**: db-team@atlas-crm.com
- **Infrastructure Team**: infra@atlas-crm.com
- **AWS Support**: Premium Support (Case Priority: Critical)

## Post-Incident Review

After resolving an incident:
1. Create incident report in Confluence
2. Update runbook with lessons learned
3. Improve monitoring/alerting
4. Conduct team retrospective
5. Implement preventive measures
