# Observability Quick Start Guide

## 5-Minute Setup

### 1. Start Infrastructure

```bash
cd infra
docker-compose up -d prometheus grafana
```

### 2. Verify Prometheus

Open http://localhost:9090

Check targets: http://localhost:9090/targets  
Expected: `spring-boot-backend` should be UP

### 3. Access Grafana

1. Open http://localhost:3000
2. Login: `admin` / `admin`
3. Navigate to **Dashboards** → **Outbound Messaging** → **Outbound Messaging Production Observability**

### 4. Enable Sentry (Optional)

```bash
# Set environment variables
export SENTRY_ENABLED=true
export SENTRY_DSN="https://your-dsn@sentry.io/project-id"
export SENTRY_ENVIRONMENT="production"

# Restart backend
cd backend
mvn spring-boot:run
```

## Key URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana Dashboard | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| Metrics Endpoint | http://localhost:8080/actuator/prometheus | - |
| Health Check | http://localhost:8080/actuator/health | - |

## Essential Metrics

### View Queue Depth
```bash
curl -s http://localhost:8080/actuator/prometheus | grep outbound_message_total_queued
```

### View Dead Letter Queue
```bash
curl -s http://localhost:8080/actuator/prometheus | grep outbound_message_dead_letter_queue_size
```

### View WhatsApp Quota
```bash
curl -s http://localhost:8080/actuator/prometheus | grep whatsapp_quota
```

## Common Issues

### Metrics showing zeros?
- Create test messages via API
- Wait 10 seconds for metrics update
- Check worker logs: `docker logs backend | grep OutboundJobWorker`

### Grafana shows "No data"?
- Verify Prometheus is scraping: http://localhost:9090/targets
- Check datasource configuration in Grafana
- Ensure backend is running and healthy

### Sentry not receiving errors?
- Verify `SENTRY_ENABLED=true`
- Check DSN is correct
- Trigger test error: Make API call to non-existent endpoint

## Testing Observability

### Generate Test Traffic

```bash
# Create test message
curl -X POST http://localhost:8080/api/outbound-messages \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: test-123" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "dossierId": 1,
    "channel": "EMAIL",
    "to": "test@example.com",
    "templateCode": "test_template",
    "subject": "Test",
    "payloadJson": {"name": "Test"}
  }'
```

### View Correlation ID in Logs

```bash
docker logs backend | grep "correlationId=test-123"
```

### Check Metrics Updated

```bash
curl -s http://localhost:8080/actuator/prometheus | grep outbound_message_queued_total
```

## Next Steps

1. Read full documentation: `docs/OBSERVABILITY_SETUP.md`
2. Review runbook: `docs/OUTBOUND_MESSAGING_RUNBOOK.md`
3. Configure alerts: `infra/prometheus/alerts.yml`
4. Set up Alertmanager for notifications

## Support

- Backend Team: #backend on Slack
- On-Call: @oncall
- Documentation: `backend/docs/`
