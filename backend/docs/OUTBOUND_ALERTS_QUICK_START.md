# Outbound Message Alert Service - Quick Start

## Enable Alerts (Development)

Add to `application-local.yml` or `application-dev.yml`:

```yaml
outbound:
  alert:
    enabled: true
```

That's it! Alerts will log to console with default thresholds.

## Enable Slack Alerts (Production)

1. Create a Slack Incoming Webhook: https://api.slack.com/messaging/webhooks

2. Set environment variable:
```bash
export OUTBOUND_ALERT_SLACK_ENABLED=true
export OUTBOUND_ALERT_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

3. Restart application

## View Health Dashboard

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/dashboard/outbound/health
```

## Check Prometheus Metrics

```bash
curl http://localhost:8080/actuator/prometheus | grep outbound_message
```

## Default Thresholds

| Alert Type | Threshold | Frequency |
|------------|-----------|-----------|
| Stuck Messages | 3 attempts, 2 hours old | Every 15 min |
| High Queue Depth | 1000 messages | Every 10 min |
| DLQ Size | 100 failed messages | Every hour |
| Failure Rate | 30% in 60 min window | Every 5 min |
| Escalation | 5 attempts | Every 20 min |

## Adjust Thresholds

```yaml
outbound:
  alert:
    dlq-threshold: 50                    # Reduce to 50 for prod
    high-queue-threshold: 500            # Reduce to 500 for prod
    failure-rate-threshold: 0.20         # Reduce to 20% for prod
    time-window-minutes: 60              # Look back 60 minutes
    escalation-attempts: 5               # Escalate after 5 attempts
```

## Disable Specific Alerts

Set cron to a far future date or use a conditional property:

```yaml
outbound:
  alert:
    enabled: true
    dead-letter:
      cron: "0 0 1 1 * ?" # Never run (Jan 1 only)
```

Or use Spring profiles to disable:

```yaml
# application-dev.yml
outbound:
  alert:
    enabled: false  # No alerts in dev
```

## Common Issues

### Alerts not firing
- Check `outbound.alert.enabled: true`
- Verify scheduled jobs are running: check logs for "OutboundMessageAlertService"
- Ensure database has data above thresholds

### Slack webhook failing
- Verify webhook URL is correct
- Check network connectivity
- Review metrics: `outbound_alert_slack_error_total`

### Too many alerts
- Increase thresholds
- Increase time windows
- Reduce job frequency (adjust cron expressions)

## Full Documentation

See `OUTBOUND_ALERTS.md` for complete documentation.
