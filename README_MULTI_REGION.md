# Atlas CRM Multi-Region Deployment

## Overview

Atlas CRM is deployed across three AWS regions to provide low-latency access for customers worldwide while ensuring GDPR compliance and data residency requirements.

## Architecture

### Regions

- **EU-West-1 (Paris)**: Primary region for European customers
- **US-East-1 (Virginia)**: Primary region for North American customers
- **AP-Southeast-1 (Singapore)**: Primary region for Asian market customers

### Key Features

✅ **Geo-Distributed Infrastructure**: Users automatically routed to nearest region  
✅ **Database Replication**: PostgreSQL logical replication for global entities  
✅ **Regional Data Isolation**: Dossiers and documents stay in customer's region (GDPR compliant)  
✅ **Automated Failover**: Health monitoring with automatic region failover  
✅ **CDN Edge Caching**: Cloudflare CDN for static assets (200+ global locations)  
✅ **Cross-Region Monitoring**: CloudWatch dashboards and alerts per region  
✅ **Disaster Recovery**: Automated backups with cross-region replication  
✅ **Latency Monitoring**: Alerts when API latency exceeds 200ms  

## Quick Start

### Prerequisites

```bash
# Install required tools
brew install terraform aws-cli jq

# Configure AWS credentials
aws configure --profile atlas-production

# Set environment variables
export TF_VAR_domain_name="atlas-crm.com"
export TF_VAR_cloudflare_api_token="your-token"
export TF_VAR_alert_email="ops@atlas-crm.com"
```

### Deploy Infrastructure

```bash
# Initialize Terraform
cd terraform
terraform init

# Plan deployment
terraform plan -out=tfplan

# Deploy all regions (45-60 minutes)
terraform apply tfplan

# Verify deployment
terraform output regional_endpoints
```

### Deploy Application

```bash
# Build and deploy to all regions
./scripts/deploy-multi-region.sh production v1.0.0
```

## Documentation

📚 **Comprehensive Guides:**

- [Multi-Region Deployment Runbook](docs/MULTI_REGION_DEPLOYMENT_RUNBOOK.md) - Complete deployment and operations guide
- [CDN Configuration](docs/CDN_CONFIGURATION.md) - Cloudflare CDN setup and optimization
- [GDPR & Data Residency](docs/GDPR_DATA_RESIDENCY.md) - Compliance and data isolation strategy

## Regional Endpoints

After deployment, your application will be accessible at:

- **Global (Geo-Routed)**: https://api.atlas-crm.com
- **Europe**: https://eu-west-1.atlas-crm.com
- **North America**: https://us-east-1.atlas-crm.com
- **Asia Pacific**: https://ap-southeast-1.atlas-crm.com
- **CDN**: https://cdn.atlas-crm.com

## Monitoring

### CloudWatch Dashboards

Access regional dashboards:

```bash
# Get dashboard URLs
terraform output monitoring_dashboards

# Example output:
# eu_west_1: https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1#dashboards:name=atlas-crm-production-eu-west-1
# us_east_1: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=atlas-crm-production-us-east-1
# ap_southeast_1: https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#dashboards:name=atlas-crm-production-ap-southeast-1
```

### Key Metrics

- **Application Health**: ECS task count, ALB health, HTTP error rates
- **Database Performance**: CPU, connections, replication lag
- **Cross-Region Latency**: API call latency between regions (threshold: 200ms)
- **CDN Performance**: Cache hit ratio, bandwidth savings

### Alerts

Critical alerts sent to: ops@atlas-crm.com

- Region health check failure → PagerDuty
- Database replication lag > 10s → Email
- Cross-region latency > 200ms → Email
- ALB 5xx error rate > 5% → PagerDuty

## Database Architecture

### Global Entities (Replicated)

Synchronized across all regions using PostgreSQL logical replication:
- User accounts
- Organizations
- System configuration
- Referential data

### Regional Entities (Isolated)

Stored only in the region where created (GDPR compliant):
- Dossiers (real estate files)
- Documents
- Annonces (property listings)
- Activity logs

### Replication Setup

```sql
-- Primary region (EU-West-1)
CREATE PUBLICATION atlas_publication FOR TABLE 
  organization, app_user, user_preferences, referential;

-- Secondary regions
CREATE SUBSCRIPTION atlas_subscription_from_eu
  CONNECTION 'host=eu-db-endpoint port=5432 dbname=atlas'
  PUBLICATION atlas_publication;
```

## Disaster Recovery

### Automatic Failover

Failover triggers:
- Route53 health check fails (3 consecutive failures)
- Lambda function executes failover orchestrator
- Backup region scales up automatically
- Traffic redirects to healthy regions

### Manual Failover

```bash
# Scale up backup region
aws ecs update-service \
  --cluster atlas-crm-production-cluster-us-east-1 \
  --service atlas-crm-production-service-us-east-1 \
  --desired-count 10 \
  --region us-east-1

# Update Route53 to disable failed region
# See runbook for detailed steps
```

### Recovery Time Objectives

- **RTO (Recovery Time Objective)**: < 5 minutes
- **RPO (Recovery Point Objective)**: < 1 minute (replication lag)

## Cost Optimization

### Monthly Cost Estimate (per region)

| Service | Spec | Monthly Cost |
|---------|------|--------------|
| ECS Fargate (2 tasks) | 2 vCPU, 4GB RAM | $120 |
| RDS PostgreSQL | db.r6g.xlarge | $450 |
| ElastiCache Redis | cache.r6g.large | $200 |
| ALB | Active-Active | $25 |
| Data Transfer | 1TB outbound | $90 |
| Cloudflare Pro | CDN + Security | $20 |
| **Total per region** | | **~$905** |
| **Total (3 regions)** | | **~$2,715/month** |

### Cost Optimization Tips

1. **Use Fargate Spot** for non-critical tasks (70% savings)
2. **Reserved Instances** for RDS (40% savings)
3. **S3 Intelligent-Tiering** for documents
4. **CloudWatch Log retention** (7-30 days)
5. **Auto-scaling** based on load

## Troubleshooting

### Common Issues

**1. High latency between regions**
```bash
# Check cross-region latency
aws cloudwatch get-metric-statistics \
  --namespace AtlasCRM/Production \
  --metric-name CrossRegionLatency \
  --dimensions Name=Region,Value=eu-west-1
```

**2. Database replication lag**
```sql
SELECT * FROM pg_stat_replication;
SELECT * FROM pg_stat_subscription;
```

**3. CDN cache not working**
```bash
curl -I https://cdn.atlas-crm.com/assets/main.js | grep CF-Cache-Status
# Should return: HIT
```

**4. Failover not triggering**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/atlas-production-failover-orchestrator --follow
```

## Security

### Encryption

- **At Rest**: AES-256 (RDS, S3, ElastiCache)
- **In Transit**: TLS 1.3 minimum
- **Secrets**: AWS Secrets Manager
- **Keys**: AWS KMS with automatic rotation

### Access Control

- **IAM**: Least privilege roles
- **MFA**: Required for admin access
- **IP Allowlisting**: Database and admin endpoints
- **VPC**: Private subnets for all data services

### Compliance

- **GDPR**: Regional data isolation, data subject rights APIs
- **SOC 2 Type II**: AWS infrastructure certified
- **ISO 27001**: AWS infrastructure certified
- **HIPAA**: Available upon request

## Support

### Documentation

- [Deployment Runbook](docs/MULTI_REGION_DEPLOYMENT_RUNBOOK.md)
- [CDN Configuration](docs/CDN_CONFIGURATION.md)
- [GDPR Compliance](docs/GDPR_DATA_RESIDENCY.md)

### Contact

- **Technical Support**: support@atlas-crm.com
- **Security Issues**: security@atlas-crm.com
- **Data Protection Officer**: dpo@atlas-crm.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX

## Contributing

For infrastructure changes:

1. Create feature branch
2. Update Terraform code
3. Run `terraform plan`
4. Submit PR with plan output
5. Get approval from infrastructure team
6. Apply in staging first
7. Deploy to production

## License

Copyright © 2024 Atlas CRM. All rights reserved.
