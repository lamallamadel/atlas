# WhatsApp SLA Monitoring and Alerting Implementation

## Summary

This document describes the implementation of SLA monitoring and alerting for WhatsApp messaging, including latency histograms, session window tracking, stuck message detection, health indicators, and Prometheus alerting rules.

## Features Implemented

### 1. Latency Histograms (p50/p95/p99)

Enhanced `OutboundMessageMetricsService` with three latency histogram metrics:

- **`outbound_message_send_latency_seconds`**: Time from message creation to SENT status
- **`outbound_message_delivered_latency_seconds`**: Time from message creation to DELIVERED status  
- **`outbound_message_read_latency_seconds`**: Time from message creation to READ receipt

All metrics publish percentiles (0.5, 0.95, 0.99) and histograms for detailed SLA analysis.

### 2. Session Window Expiration Tracking

**Metric**: `whatsapp_session_window_expiration_seconds`

Tracks the average time in seconds until active WhatsApp session windows expire. Returns 0 if no active windows exist. This enables:
- Proactive planning for template message usage
- Alerts when windows are expiring soon
- Monitoring of session window lifecycle

### 3. Stuck Message Detection

**Metric**: `whatsapp_message_stuck_alert`

**Scheduled Task**: `OutboundMessageMetricsService.checkStuckSendingMessages()`
- Runs every 60 seconds (configurable via `outbound.metrics.stuck-check-interval-ms`)
- Counts messages stuck in SENDING status for more than 5 minutes
- Emits warning logs when stuck messages are detected

### 4. WhatsApp Health Indicator

**Endpoint**: `/actuator/health/whatsapp`

**Component**: `WhatsAppHealthIndicator`

Checks:
1. **Provider Configuration Validity**:
   - Configuration exists
   - Provider is enabled
   - API key is configured
   - Phone number ID is configured

2. **Recent Send Success Rate** (last 10 minutes):
   - Total messages sent
   - Successful messages (SENT + DELIVERED)
   - Failed messages
   - Success rate percentage
   - Returns DOWN if success rate < 50%

### 5. Database Schema Enhancements

**Migration**: `V131__Add_sla_timestamp_columns_to_outbound_message.sql`

Added timestamp columns to `outbound_message` table:
- `sent_at`: When message was successfully sent to provider
- `delivered_at`: When message was delivered to recipient
- `read_at`: When message was read by recipient

Includes indexes for efficient SLA queries:
- Individual indexes on each timestamp column
- Composite indexes for channel + created_at and status + updated_at

### 6. Prometheus Alerting Rules

**File**: `docs/observability/whatsapp-alerts.yml`

**Alert Groups**:

1. **SLA Latency Alerts**:
   - `WhatsAppHighSendLatency`: P95 > 30s for 5 minutes (warning)
   - `WhatsAppHighDeliveredLatency`: P95 > 60s for 5 minutes (warning)
   - `WhatsAppCriticalSendLatency`: P99 > 120s for 3 minutes (critical)

2. **Stuck Messages Alerts**:
   - `WhatsAppMessagesStuckInSending`: > 0 messages for 5 minutes (warning)
   - `WhatsAppMessagesStuckInSendingCritical`: > 10 messages for 3 minutes (critical)

3. **Session Window Alerts**:
   - `WhatsAppSessionWindowExpiringSoon`: < 1 hour remaining (info)
   - `WhatsAppNoActiveSessionWindow`: No active windows for 10 minutes (info)

4. **Quota Alerts**:
   - `WhatsAppQuotaHighUsage`: > 80% usage (warning)
   - `WhatsAppQuotaCriticalUsage`: > 95% usage (critical)
   - `WhatsAppQuotaExhausted`: 0 remaining (critical)

5. **Queue Depth Alerts**:
   - `WhatsAppHighQueueDepth`: > 100 messages (warning)
   - `WhatsAppCriticalQueueDepth`: > 500 messages (critical)
   - `WhatsAppHighFailureRate`: > 0.1/s for 5 minutes (warning)

6. **Health Check Alerts**:
   - `WhatsAppHealthCheckFailing`: Down for 3 minutes (critical)
   - `WhatsAppLowSuccessRate`: < 90% for 5 minutes (warning)

7. **Retry Alerts**:
   - `WhatsAppHighRetryCount`: > 50 messages requiring retries (warning)

## Code Changes

### Modified Files

1. **`backend/src/main/java/com/example/backend/entity/OutboundMessageEntity.java`**
   - Added `sentAt`, `deliveredAt`, `readAt` timestamp fields
   - Added getters and setters for timestamp fields

2. **`backend/src/main/java/com/example/backend/repository/OutboundMessageRepository.java`**
   - Added `findByChannelAndCreatedAtAfter()` for SLA queries
   - Added `countByStatusAndUpdatedAtBefore()` for stuck message detection

3. **`backend/src/main/java/com/example/backend/repository/WhatsAppSessionWindowRepository.java`**
   - Added `findActiveWindows()` to retrieve active session windows

4. **`backend/src/main/java/com/example/backend/observability/OutboundMessageMetricsService.java`**
   - Implemented `updateSessionWindowExpirationMetrics()`
   - Implemented `updateSLALatencyHistograms()`
   - Added `checkStuckSendingMessages()` scheduled task
   - Initialized latency histogram metrics with percentiles

5. **`backend/src/main/java/com/example/backend/service/OutboundJobWorker.java`**
   - Set `sentAt` timestamp when message status changes to SENT

6. **`backend/src/main/java/com/example/backend/service/WhatsAppMessageProcessingService.java`**
   - Set `deliveredAt` timestamp when webhook reports DELIVERED status
   - Set `readAt` timestamp when webhook reports READ status

### New Files

1. **`backend/src/main/java/com/example/backend/config/WhatsAppHealthIndicator.java`**
   - Spring Boot Actuator health indicator for WhatsApp
   - Checks provider config validity and recent success rate

2. **`backend/src/main/resources/db/migration/V131__Add_sla_timestamp_columns_to_outbound_message.sql`**
   - Database migration adding timestamp columns
   - Creates indexes for efficient SLA queries

3. **`docs/observability/whatsapp-alerts.yml`**
   - Prometheus alerting rules for WhatsApp SLA monitoring
   - 7 alert groups covering latency, stuck messages, quotas, health

4. **`docs/observability/README.md`**
   - Complete documentation of metrics, alerts, and health indicator
   - Configuration guide and troubleshooting tips

## Configuration

### Application Properties

```yaml
# Metrics update interval (default: 10 seconds)
outbound.metrics.update-interval-ms: 10000

# Stuck message check interval (default: 60 seconds)  
outbound.metrics.stuck-check-interval-ms: 60000
```

### Prometheus Integration

Add to `prometheus.yml`:

```yaml
rule_files:
  - 'whatsapp-alerts.yml'

scrape_configs:
  - job_name: 'atlas-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
```

## Testing

### Verify Metrics Endpoint

```bash
curl http://localhost:8080/actuator/prometheus | grep -E "(send_latency|delivered_latency|read_latency|session_window|stuck_alert)"
```

### Verify Health Indicator

```bash
curl http://localhost:8080/actuator/health/whatsapp | jq
```

### Verify Stuck Message Detection

```sql
-- Create a stuck message
UPDATE outbound_message 
SET status = 'SENDING', updated_at = NOW() - INTERVAL '10 minutes'
WHERE id = 123;

-- Wait 60 seconds for scheduled task to run
-- Check metric
curl http://localhost:8080/actuator/prometheus | grep whatsapp_message_stuck_alert
```

### Verify Latency Histograms

```sql
-- Check that timestamps are being set
SELECT id, status, created_at, sent_at, delivered_at, read_at
FROM outbound_message
WHERE channel = 'WHATSAPP'
ORDER BY created_at DESC
LIMIT 10;
```

## Monitoring Dashboard

Recommended Grafana panels:

1. **Send Latency (p50/p95/p99)**: 
   ```promql
   outbound_message_send_latency_seconds{channel="whatsapp"}
   ```

2. **Delivery Latency (p50/p95/p99)**:
   ```promql
   outbound_message_delivered_latency_seconds{channel="whatsapp"}
   ```

3. **Session Window Expiration**:
   ```promql
   whatsapp_session_window_expiration_seconds{channel="whatsapp"}
   ```

4. **Stuck Messages**:
   ```promql
   whatsapp_message_stuck_alert
   ```

5. **Success Rate**:
   ```promql
   (sum(rate(outbound_message_queue_depth{channel="whatsapp",status="sent"}[5m])) + 
    sum(rate(outbound_message_queue_depth{channel="whatsapp",status="delivered"}[5m]))) /
   (sum(rate(outbound_message_queue_depth{channel="whatsapp"}[5m])))
   ```

## Operational Procedures

### When Alerts Fire

1. **High Latency Alerts**:
   - Check WhatsApp API status page
   - Review application logs for rate limiting
   - Check network connectivity
   - Verify database performance

2. **Stuck Messages**:
   - Check application logs for errors
   - Verify database connectivity
   - Review circuit breaker state
   - Consider restarting worker service

3. **Session Window Expiry**:
   - Notify operations team
   - Prepare template messages
   - Update communication strategy

4. **Quota Exhausted**:
   - Contact WhatsApp Business support
   - Implement message throttling
   - Prioritize critical messages

5. **Health Check Failing**:
   - Verify provider configuration
   - Check API credentials
   - Test connectivity to WhatsApp API
   - Review recent configuration changes

## Future Enhancements

Potential improvements:

1. **Advanced Analytics**:
   - Latency breakdown by template vs freeform
   - Geographic latency distribution
   - Time-of-day latency patterns

2. **Predictive Alerting**:
   - Anomaly detection for latency spikes
   - Forecast quota exhaustion
   - Predict session window expiry based on usage patterns

3. **Auto-remediation**:
   - Automatic retry of stuck messages
   - Circuit breaker integration with alerts
   - Dynamic rate limiting based on latency

4. **Enhanced Dashboards**:
   - Real-time delivery funnel visualization
   - SLA compliance tracking
   - Cost per message analytics

## Related Documentation

- [Production Runbook - WhatsApp](docs/PRODUCTION_RUNBOOK_WHATSAPP.md)
- [Observability Runbook](docs/RUNBOOK_OBSERVABILITY.md)
- [WhatsApp Implementation Complete](WHATSAPP_IMPLEMENTATION_COMPLETE.md)
- [Observability README](docs/observability/README.md)
