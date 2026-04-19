# Outbound Message Alert Service

## Overview

The `OutboundMessageAlertService` provides comprehensive monitoring and alerting for outbound message processing, including:

- Dead Letter Queue (DLQ) monitoring with threshold alerts
- Failure rate calculation per channel with time-window aggregation
- Email and Slack webhook notifications for critical thresholds
- Automated escalation after N failed delivery attempts
- Real-time dashboard displaying outbound health metrics

## Features

### 1. Stuck Message Detection

Monitors messages that are stuck in `QUEUED` or `SENDING` states for an extended period.

**Configuration:**
```yaml
outbound:
  alert:
    cron: "0 */15 * * * *"  # Run every 15 minutes
    stuck-message-threshold-attempts: 3
    stuck-message-age-hours: 2
```

**Triggers:** Messages with ≥3 attempts and age >2 hours

### 2. High Queue Depth Monitoring

Alerts when the total pending message count exceeds threshold.

**Configuration:**
```yaml
outbound:
  alert:
    high-queue-threshold: 1000
    high-queue-depth:
      cron: "0 */10 * * * *"  # Run every 10 minutes
```

**Triggers:** Total pending messages (QUEUED + SENDING) > 1000

### 3. Dead Letter Queue (DLQ) Monitoring

Monitors the count of permanently failed messages.

**Configuration:**
```yaml
outbound:
  alert:
    dlq-threshold: 100
    dead-letter:
      cron: "0 0 * * * *"  # Run every hour
```

**Triggers:** Failed message count > 100

### 4. Channel Failure Rate Analysis

Calculates failure rates per channel over a configurable time window.

**Configuration:**
```yaml
outbound:
  alert:
    failure-rate-threshold: 0.30  # 30%
    time-window-minutes: 60
    failure-rate:
      cron: "0 */5 * * * *"  # Run every 5 minutes
```

**Triggers:** 
- Failure rate > 30%
- Minimum 10 messages in time window

### 5. Automated Escalation

Identifies messages that require manual intervention after exceeding retry attempts.

**Configuration:**
```yaml
outbound:
  alert:
    escalation-attempts: 5
    escalation:
      cron: "0 */20 * * * *"  # Run every 20 minutes
```

**Triggers:** Messages with ≥5 delivery attempts still in QUEUED state

### 6. Health Metrics Dashboard

Provides real-time metrics updated every 30 seconds.

**Configuration:**
```yaml
outbound:
  alert:
    health-metrics-update-ms: 30000
```

**Metrics Include:**
- Queue depth (QUEUED, SENDING)
- DLQ size
- Per-channel statistics:
  - Total messages
  - Sent/Delivered counts
  - Failed count
  - Success rate
  - Failure rate
  - Average delivery latency

## Notification Channels

### Email Alerts

**Configuration:**
```yaml
outbound:
  alert:
    email:
      enabled: true
      recipients: "ops@example.com,alerts@example.com"
```

**Note:** Email integration requires mail service configuration.

### Slack Webhooks

**Configuration:**
```yaml
outbound:
  alert:
    slack:
      enabled: true
      webhook-url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Message Format:**
```json
{
  "text": "Alert Title",
  "attachments": [
    {
      "color": "danger",  // or "warning", "good"
      "text": "Alert details...",
      "ts": 1234567890
    }
  ]
}
```

## Alert Severity Levels

- **Critical:** DLQ threshold exceeded, high failure rate, escalation required
- **Warning:** Stuck messages, high queue depth

## API Endpoints

### Get Outbound Health Metrics

```http
GET /api/v1/dashboard/outbound/health
```

**Response:**
```json
{
  "queuedMessages": 42,
  "sendingMessages": 5,
  "totalPendingMessages": 47,
  "deadLetterQueueSize": 12,
  "timestamp": "2024-01-15T10:30:00",
  "channelMetrics": {
    "EMAIL": {
      "channel": "EMAIL",
      "totalMessages": 150,
      "sentMessages": 135,
      "deliveredMessages": 130,
      "failedMessages": 15,
      "successRate": 0.90,
      "failureRate": 0.10,
      "averageDeliveryLatencySeconds": 2.5
    },
    "SMS": {
      "channel": "SMS",
      "totalMessages": 200,
      "sentMessages": 195,
      "deliveredMessages": 190,
      "failedMessages": 5,
      "successRate": 0.975,
      "failureRate": 0.025,
      "averageDeliveryLatencySeconds": 1.2
    }
  }
}
```

## Metrics Exposed

The service exposes Prometheus-compatible metrics:

- `outbound_message_stuck_alert_total{channel, status}` - Counter
- `outbound_message_high_queue_depth_alert_total` - Counter
- `outbound_message_dead_letter_alert_total` - Counter
- `outbound_message_high_failure_rate_alert_total{channel}` - Counter
- `outbound_message_escalation_alert_total{channel}` - Counter
- `outbound_message_alert_error_total` - Counter
- `outbound_alert_slack_sent_total{severity}` - Counter
- `outbound_alert_slack_error_total` - Counter
- `outbound_message_queue_depth` - Gauge
- `outbound_message_dlq_size` - Gauge

## Environment Variables

All configuration properties can be overridden via environment variables:

```bash
# Alert system
OUTBOUND_ALERT_ENABLED=true
OUTBOUND_ALERT_CRON="0 */15 * * * *"
OUTBOUND_ALERT_STUCK_THRESHOLD_ATTEMPTS=3
OUTBOUND_ALERT_STUCK_AGE_HOURS=2
OUTBOUND_ALERT_MAX_RESULTS=100
OUTBOUND_ALERT_DLQ_THRESHOLD=100
OUTBOUND_ALERT_HIGH_QUEUE_THRESHOLD=1000
OUTBOUND_ALERT_FAILURE_RATE_THRESHOLD=0.30
OUTBOUND_ALERT_TIME_WINDOW_MINUTES=60
OUTBOUND_ALERT_ESCALATION_ATTEMPTS=5
OUTBOUND_ALERT_HEALTH_METRICS_UPDATE_MS=30000

# Email alerts
OUTBOUND_ALERT_EMAIL_ENABLED=false
OUTBOUND_ALERT_EMAIL_RECIPIENTS=""

# Slack alerts
OUTBOUND_ALERT_SLACK_ENABLED=false
OUTBOUND_ALERT_SLACK_WEBHOOK_URL=""

# Scheduled job crons
OUTBOUND_ALERT_HIGH_QUEUE_CRON="0 */10 * * * *"
OUTBOUND_ALERT_DEAD_LETTER_CRON="0 0 * * * *"
OUTBOUND_ALERT_FAILURE_RATE_CRON="0 */5 * * * *"
OUTBOUND_ALERT_ESCALATION_CRON="0 */20 * * * *"
```

## Usage Example

### Enable Slack Alerts in Production

```yaml
# application-prod.yml
outbound:
  alert:
    enabled: true
    dlq-threshold: 50
    high-queue-threshold: 500
    failure-rate-threshold: 0.20
    slack:
      enabled: true
      webhook-url: "${SLACK_WEBHOOK_URL}"
```

### Query Health Metrics

```typescript
// Frontend integration
async function fetchOutboundHealth() {
  const response = await fetch('/api/v1/dashboard/outbound/health');
  const metrics = await response.json();
  
  // Display in dashboard
  updateQueueDepth(metrics.queuedMessages);
  updateDLQSize(metrics.deadLetterQueueSize);
  
  // Channel-specific metrics
  Object.values(metrics.channelMetrics).forEach(channel => {
    updateChannelCard(channel);
  });
}
```

## Troubleshooting

### Alerts Not Firing

1. Check if alerts are enabled:
   ```yaml
   outbound.alert.enabled: true
   ```

2. Verify cron expressions are valid

3. Check application logs for errors:
   ```bash
   grep "OutboundMessageAlertService" application.log
   ```

### Slack Webhook Failures

1. Verify webhook URL is correct
2. Check network connectivity
3. Review Slack webhook status in metrics:
   ```
   outbound_alert_slack_error_total
   ```

### Metrics Not Updating

1. Ensure scheduled jobs are running
2. Check database connectivity
3. Verify `health-metrics-update-ms` configuration

## Performance Considerations

- Health metrics update runs every 30 seconds by default
- Query performance optimized with database indexes on:
  - `outbound_message(status, attempt_count)` for stuck message detection
  - `outbound_message(channel, created_at)` for time-window queries
- Metric cache reduces database load for real-time dashboard

## Future Enhancements

- [ ] PagerDuty integration
- [ ] SMS alerts
- [ ] Configurable alert rules via API
- [ ] Historical trend analysis
- [ ] Automatic remediation actions
- [ ] Alert suppression during maintenance windows
