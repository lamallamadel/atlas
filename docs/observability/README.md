# WhatsApp Observability and SLA Monitoring

This directory contains Prometheus alerting rules and observability configuration for WhatsApp messaging SLA monitoring.

## Overview

The WhatsApp SLA monitoring system tracks message delivery performance through latency histograms, session window expiration tracking, and automated alerting for stuck messages.

## Metrics Exposed

### Latency Histograms

**Metric Name**: `outbound_message_send_latency_seconds`
- **Description**: Time from message creation to SENT status
- **Labels**: `channel` (whatsapp)
- **Percentiles**: p50, p95, p99
- **Purpose**: Track how quickly messages are sent to the WhatsApp API

**Metric Name**: `outbound_message_delivered_latency_seconds`
- **Description**: Time from message creation to DELIVERED status
- **Labels**: `channel` (whatsapp)
- **Percentiles**: p50, p95, p99
- **Purpose**: Track end-to-end delivery time to recipient

**Metric Name**: `outbound_message_read_latency_seconds`
- **Description**: Time from message creation to READ status
- **Labels**: `channel` (whatsapp)
- **Percentiles**: p50, p95, p99
- **Purpose**: Track when recipients read messages

### Session Window Tracking

**Metric Name**: `whatsapp_session_window_expiration_seconds`
- **Description**: Average time in seconds until WhatsApp session windows expire (0 if no active window)
- **Labels**: `channel` (whatsapp)
- **Purpose**: Monitor session window lifecycle and plan template message usage

### Stuck Message Detection

**Metric Name**: `whatsapp_message_stuck_alert`
- **Description**: Number of messages stuck in SENDING status for more than 5 minutes
- **Purpose**: Detect and alert on messages that are not progressing

**Scheduled Task**: Runs every 60 seconds (configurable via `outbound.metrics.stuck-check-interval-ms`)

## Health Indicator

The WhatsApp health indicator is available at `/actuator/health/whatsapp` and checks:

1. **Provider Configuration Validity**:
   - Provider config exists
   - Provider is enabled
   - API key is configured
   - Phone number ID is configured

2. **Recent Send Success Rate**:
   - Last 10 minutes of message activity
   - Success rate threshold: 50%
   - Returns DOWN if success rate is below threshold

### Example Response

```json
{
  "status": "UP",
  "details": {
    "message": "WhatsApp provider is healthy",
    "providerConfigExists": true,
    "providerConfigValid": true,
    "providerEnabled": true,
    "phoneNumberIdConfigured": true,
    "last10MinutesTotal": 150,
    "last10MinutesSuccessful": 145,
    "last10MinutesFailed": 5,
    "successRate": "96.67%"
  }
}
```

## Prometheus Alerting Rules

The alerting rules are defined in `whatsapp-alerts.yml` and organized into the following groups:

### 1. SLA Latency Alerts
- **WhatsAppHighSendLatency**: P95 send latency > 30s for 5 minutes
- **WhatsAppHighDeliveredLatency**: P95 delivery latency > 60s for 5 minutes
- **WhatsAppCriticalSendLatency**: P99 send latency > 120s for 3 minutes

### 2. Stuck Messages Alerts
- **WhatsAppMessagesStuckInSending**: > 0 messages stuck for 5 minutes (warning)
- **WhatsAppMessagesStuckInSendingCritical**: > 10 messages stuck for 3 minutes (critical)

### 3. Session Window Alerts
- **WhatsAppSessionWindowExpiringSoon**: Window expires in < 1 hour (info)
- **WhatsAppNoActiveSessionWindow**: No active windows for 10 minutes (info)

### 4. Quota Alerts
- **WhatsAppQuotaHighUsage**: > 80% quota used for 5 minutes (warning)
- **WhatsAppQuotaCriticalUsage**: > 95% quota used for 2 minutes (critical)
- **WhatsAppQuotaExhausted**: Quota = 0 for 1 minute (critical)

### 5. Queue Depth Alerts
- **WhatsAppHighQueueDepth**: > 100 queued messages for 5 minutes (warning)
- **WhatsAppCriticalQueueDepth**: > 500 queued messages for 3 minutes (critical)
- **WhatsAppHighFailureRate**: Failure rate > 0.1/s for 5 minutes (warning)

### 6. Health Check Alerts
- **WhatsAppHealthCheckFailing**: Health check down for 3 minutes (critical)
- **WhatsAppLowSuccessRate**: Success rate < 90% for 5 minutes (warning)

### 7. Retry Alerts
- **WhatsAppHighRetryCount**: > 50 messages requiring retries for 5 minutes (warning)

## Configuration

### Application Properties

```yaml
# Metrics update interval (default: 10 seconds)
outbound.metrics.update-interval-ms: 10000

# Stuck message check interval (default: 60 seconds)
outbound.metrics.stuck-check-interval-ms: 60000
```

### Database Schema

The system requires the following timestamp columns in `outbound_message`:

```sql
-- Migration V131__Add_sla_timestamp_columns_to_outbound_message.sql
ALTER TABLE outbound_message ADD COLUMN sent_at TIMESTAMP;
ALTER TABLE outbound_message ADD COLUMN delivered_at TIMESTAMP;
ALTER TABLE outbound_message ADD COLUMN read_at TIMESTAMP;
```

These columns are automatically populated by:
- `OutboundJobWorker`: Sets `sent_at` when message is sent
- `WhatsAppMessageProcessingService`: Sets `delivered_at` and `read_at` from webhook status updates

## Prometheus Configuration

Add the alerting rules to your Prometheus configuration:

```yaml
# prometheus.yml
rule_files:
  - 'whatsapp-alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

## Grafana Dashboard

Create a Grafana dashboard with the following panels:

1. **Send Latency (p50/p95/p99)**: Line graph of `outbound_message_send_latency_seconds`
2. **Delivery Latency (p50/p95/p99)**: Line graph of `outbound_message_delivered_latency_seconds`
3. **Read Latency (p50/p95/p99)**: Line graph of `outbound_message_read_latency_seconds`
4. **Session Window Expiration**: Gauge of `whatsapp_session_window_expiration_seconds`
5. **Stuck Messages**: Counter of `whatsapp_message_stuck_alert`
6. **Queue Depth**: Bar chart of `outbound_message_queue_depth_by_channel{channel="whatsapp"}`
7. **Success Rate**: Rate calculation from sent/delivered vs failed counts

## Runbooks

When alerts fire, refer to the following runbooks:

- **High Latency**: Check WhatsApp API status, network connectivity, rate limiting
- **Stuck Messages**: Review application logs, check database connections, restart worker if needed
- **Session Window Expiry**: Notify operators to prepare template messages
- **Quota Exhausted**: Contact WhatsApp Business support to increase quota
- **Health Check Failing**: Verify provider configuration, API credentials, connectivity

## Troubleshooting

### No Metrics Appearing

1. Check that `OutboundMessageMetricsService` scheduled task is running
2. Verify metrics endpoint: `curl http://localhost:8080/actuator/prometheus | grep whatsapp`
3. Check application logs for errors in metrics collection

### Incorrect Latency Values

1. Ensure webhook status updates are being received and processed
2. Verify timestamp columns are being set correctly in database
3. Check that webhook signature validation is passing

### Stuck Message False Positives

1. Review the 5-minute threshold - may need adjustment based on typical delivery times
2. Check if messages are genuinely stuck or just slow
3. Verify that stale message recovery is working (runs every 10 minutes)

## See Also

- [Production Runbook - WhatsApp](../PRODUCTION_RUNBOOK_WHATSAPP.md)
- [Observability Runbook](../RUNBOOK_OBSERVABILITY.md)
- [WhatsApp Implementation Complete](../../WHATSAPP_IMPLEMENTATION_COMPLETE.md)
