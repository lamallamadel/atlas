# Outbound Message Alert Service Implementation

## Overview

This document describes the implementation of the comprehensive outbound message alerting service with DLQ monitoring, failure rate calculation, email/Slack notifications, automated escalation, and real-time health metrics dashboard.

## Files Modified/Created

### Core Service
- **`OutboundMessageAlertService.java`** - Main alert service with all monitoring logic
  - DLQ threshold monitoring
  - Stuck message detection
  - High queue depth alerts
  - Per-channel failure rate calculation with time-window aggregation
  - Automated escalation for messages exceeding retry threshold
  - Slack webhook integration
  - Email alert integration (stub)
  - Real-time health metrics calculation and caching

### Repository Layer
- **`OutboundMessageRepository.java`** - Added methods:
  - `findMessagesNeedingEscalation()` - Find messages requiring escalation
  - `countByChannelAndCreatedAtAfter()` - Count messages per channel in time window
  - `countByChannelAndStatusAndCreatedAtAfter()` - Count by channel, status, and time window

- **`OutboundAttemptRepository.java`** - Added methods:
  - `calculateAverageDeliveryLatency()` - Calculate average delivery time per channel

### Controller Layer
- **`DashboardController.java`** - Added endpoint:
  - `GET /api/v1/dashboard/outbound/health` - Real-time health metrics API

### DTOs
- **`OutboundHealthMetricsDto.java`** - Health metrics response DTO
- **`ChannelHealthMetricsDto.java`** - Per-channel health metrics DTO

### Configuration
- **`application.yml`** - Added comprehensive configuration:
  ```yaml
  outbound:
    alert:
      enabled: true
      dlq-threshold: 100
      high-queue-threshold: 1000
      failure-rate-threshold: 0.30
      time-window-minutes: 60
      escalation-attempts: 5
      health-metrics-update-ms: 30000
      email:
        enabled: false
        recipients: ""
      slack:
        enabled: false
        webhook-url: ""
      failure-rate:
        cron: "0 */5 * * * *"
      escalation:
        cron: "0 */20 * * * *"
  ```

- **`application-prod.yml`** - Production-specific overrides with stricter thresholds

### Documentation
- **`OUTBOUND_ALERTS.md`** - Comprehensive user guide with:
  - Feature descriptions
  - Configuration examples
  - API documentation
  - Metrics reference
  - Troubleshooting guide
  - Usage examples

## Features Implemented

### 1. DLQ Monitoring
- **Scheduled Job:** Every hour (configurable)
- **Trigger:** Failed message count exceeds threshold (default: 100)
- **Action:** Log alert, send notifications, increment metrics

### 2. Stuck Message Detection
- **Scheduled Job:** Every 15 minutes (configurable)
- **Criteria:** 
  - Messages in QUEUED/SENDING status
  - Attempt count ≥ threshold (default: 3)
  - Age > threshold hours (default: 2)
- **Action:** Log details, send alerts, track per-channel metrics

### 3. High Queue Depth Monitoring
- **Scheduled Job:** Every 10 minutes (configurable)
- **Trigger:** Total pending messages (QUEUED + SENDING) exceeds threshold (default: 1000)
- **Action:** Alert with breakdown of queued vs. sending

### 4. Channel Failure Rate Analysis
- **Scheduled Job:** Every 5 minutes (configurable)
- **Time Window:** Configurable (default: 60 minutes)
- **Calculation:**
  ```
  failure_rate = failed_messages / total_messages (in time window)
  ```
- **Trigger:** 
  - Failure rate > threshold (default: 30%)
  - Minimum 10 messages in window
- **Action:** Per-channel alerts with detailed statistics

### 5. Automated Escalation
- **Scheduled Job:** Every 20 minutes (configurable)
- **Criteria:** Messages with ≥N attempts (default: 5) still in QUEUED
- **Action:** Critical alert with message details for manual intervention

### 6. Health Metrics Dashboard
- **Update Frequency:** Every 30 seconds (configurable)
- **Metrics Provided:**
  - Queue depth (QUEUED, SENDING)
  - DLQ size
  - Total pending messages
  - Per-channel statistics:
    - Total messages in time window
    - Sent/Delivered counts
    - Failed count
    - Success rate (%)
    - Failure rate (%)
    - Average delivery latency (seconds)

### 7. Slack Webhook Integration
- **Format:** Slack Incoming Webhook
- **Severity Levels:**
  - Critical: Red (danger)
  - Warning: Yellow (warning)
  - Info: Green (good)
- **Payload:** Title + detailed message + timestamp
- **Metrics:** Success/failure counters

### 8. Email Alert Integration
- **Status:** Stub implementation
- **Configuration:** Recipients list (comma-separated)
- **Note:** Requires mail service integration

## Metrics Exposed

All metrics are Prometheus-compatible:

### Counters
- `outbound_message_stuck_alert_total{channel, status}`
- `outbound_message_high_queue_depth_alert_total`
- `outbound_message_dead_letter_alert_total`
- `outbound_message_high_failure_rate_alert_total{channel}`
- `outbound_message_escalation_alert_total{channel}`
- `outbound_message_alert_error_total`
- `outbound_alert_slack_sent_total{severity}`
- `outbound_alert_slack_error_total`

### Gauges
- `outbound_message_queue_depth` - Current QUEUED count
- `outbound_message_dlq_size` - Current FAILED count

## API Endpoints

### Get Outbound Health Metrics
```http
GET /api/v1/dashboard/outbound/health
Authorization: Bearer <token>
```

**Response Schema:**
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
    }
  }
}
```

## Configuration Reference

### Required Configuration
None - all features have sensible defaults and can be disabled

### Recommended Production Configuration
```yaml
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

### Environment Variables
```bash
# Enable/disable alerting
OUTBOUND_ALERT_ENABLED=true

# Thresholds
OUTBOUND_ALERT_DLQ_THRESHOLD=100
OUTBOUND_ALERT_HIGH_QUEUE_THRESHOLD=1000
OUTBOUND_ALERT_FAILURE_RATE_THRESHOLD=0.30
OUTBOUND_ALERT_ESCALATION_ATTEMPTS=5

# Time windows
OUTBOUND_ALERT_TIME_WINDOW_MINUTES=60
OUTBOUND_ALERT_STUCK_AGE_HOURS=2

# Slack integration
OUTBOUND_ALERT_SLACK_ENABLED=false
OUTBOUND_ALERT_SLACK_WEBHOOK_URL=""

# Email integration
OUTBOUND_ALERT_EMAIL_ENABLED=false
OUTBOUND_ALERT_EMAIL_RECIPIENTS=""
```

## Design Decisions

### 1. In-Memory Cache for Health Metrics
**Decision:** Cache metrics in memory with periodic updates

**Rationale:**
- Reduces database load for dashboard queries
- Provides consistent snapshot across multiple API calls
- 30-second update frequency balances freshness vs. performance

### 2. Separate Scheduled Jobs
**Decision:** Each alert type has its own scheduled job with independent cron

**Rationale:**
- Different monitoring needs different frequencies
- Failure isolation - one job failing doesn't affect others
- Easier to disable/tune individual checks

### 3. Time-Window Aggregation
**Decision:** Calculate failure rates over sliding time window

**Rationale:**
- More accurate than lifetime statistics
- Detects recent degradations quickly
- Configurable window allows tuning sensitivity

### 4. Slack Primary, Email Secondary
**Decision:** Slack is fully implemented, email is stubbed

**Rationale:**
- Slack webhooks are simpler (no SMTP dependencies)
- Most modern ops teams use Slack/Teams
- Email can be added later without breaking changes

### 5. Threshold-Based Alerts Only
**Decision:** No anomaly detection or ML-based alerts

**Rationale:**
- Simple, predictable behavior
- Easy to configure and troubleshoot
- Sufficient for most use cases
- Can be extended later if needed

## Testing Considerations

### Unit Tests Needed
- Alert threshold logic
- Failure rate calculation
- Time window filtering
- Slack payload formatting

### Integration Tests Needed
- Database query performance with time windows
- Scheduled job execution
- Metrics collection accuracy

### E2E Tests Needed
- Full alert workflow from detection to notification
- Dashboard API with real data
- Concurrent metric updates

## Performance Impact

### Database Queries
- All queries use indexed columns
- Time-window queries limited to configurable window
- No full table scans

### Memory Usage
- Health metrics cache: ~1KB per channel
- Total: <10KB for 6 channels

### CPU Usage
- Scheduled jobs run in background threads
- No impact on request processing
- Metrics calculation is O(n) where n = channels (constant)

## Future Enhancements

1. **PagerDuty Integration** - Critical alert escalation
2. **Configurable Rules API** - Dynamic threshold management
3. **Historical Trending** - Store and analyze alert history
4. **Automatic Remediation** - Retry failed messages automatically
5. **Alert Suppression** - Maintenance mode support
6. **SMS Alerts** - Additional notification channel
7. **Grafana Dashboard** - Pre-built visualization templates

## Rollout Plan

### Phase 1: Monitoring Only (Week 1)
- Enable alert service with high thresholds
- Monitor logs only, no external notifications
- Tune thresholds based on baseline metrics

### Phase 2: Internal Alerts (Week 2)
- Enable Slack alerts to ops channel
- Lower thresholds to production values
- Monitor for false positives

### Phase 3: Production Ready (Week 3)
- Add email alerts for critical issues
- Document runbooks for each alert type
- Train ops team on response procedures

## Maintenance

### Regular Tasks
- Review alert thresholds quarterly
- Check Slack webhook connectivity monthly
- Monitor alert volume for alert fatigue
- Audit DLQ and manually resolve stuck messages

### Troubleshooting
See `OUTBOUND_ALERTS.md` for detailed troubleshooting guide.

## Support

For issues or questions:
1. Check logs: `grep "OutboundMessageAlertService" application.log`
2. Verify configuration in `application.yml`
3. Review metrics in `/actuator/prometheus`
4. Check API health: `GET /api/v1/dashboard/outbound/health`
