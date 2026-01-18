# Outbound Messaging Observability - Implementation Summary

## Overview

Comprehensive observability has been implemented for the outbound messaging system, providing real-time monitoring, alerting, and analytics capabilities through Micrometer metrics exposed via Prometheus.

## Files Created/Modified

### New Files

1. **`backend/src/main/java/com/example/backend/observability/OutboundMessageMetricsService.java`**
   - Service that manages gauge metrics for queue depth tracking
   - Periodically updates metrics every 10 seconds (configurable)
   - Tracks queue depth by status, channel, retry counts, and dead letter queue size

2. **`backend/src/main/java/com/example/backend/service/OutboundMessageAlertService.java`**
   - Scheduled alert service that monitors message processing health
   - Three scheduled jobs:
     - Stuck messages detector (runs every 15 minutes)
     - High queue depth monitor (runs every 10 minutes)
     - Dead letter queue growth monitor (runs every hour)
   - Logs warnings and increments alert metrics when thresholds are exceeded

3. **`backend/OUTBOUND_MESSAGING_OBSERVABILITY.md`**
   - Comprehensive documentation of all metrics, gauges, and alerts
   - Configuration reference
   - Prometheus query examples
   - Grafana dashboard examples
   - Troubleshooting guide

4. **`backend/METRICS_QUICK_REFERENCE.md`**
   - Quick reference card for key metrics
   - Alert rule examples
   - Common Prometheus queries
   - Dashboard recommendations
   - Troubleshooting checklist

5. **`backend/grafana-dashboard-outbound-messaging.json`**
   - Sample Grafana dashboard configuration
   - Visualizes all key metrics including queue depth, send rates, latency percentiles, retry rates, and alerts

6. **`backend/IMPLEMENTATION_SUMMARY.md`**
   - This file - high-level summary of the implementation

### Modified Files

1. **`backend/src/main/java/com/example/backend/observability/MetricsService.java`**
   - Added methods for outbound message metrics:
     - `incrementOutboundMessageQueued()`
     - `incrementOutboundMessageSendSuccess()`
     - `incrementOutboundMessageSendFailure()`
     - `incrementOutboundMessageRetry()`
     - `incrementOutboundMessageDeadLetter()`
     - `recordOutboundMessageDeliveryLatency()`
   - Made `counter()` and `timer()` methods public for alert service
   - Added `getRegistry()` method for gauge registration

2. **`backend/src/main/java/com/example/backend/repository/OutboundMessageRepository.java`**
   - Added query methods for metrics and alerts:
     - `countByStatus()` - Count messages by status
     - `countByStatusAndChannel()` - Count messages by status and channel
     - `countByChannelAndAttemptCountGreaterThan()` - Count messages with retries
     - `findStuckMessages()` - Find messages stuck in processing

3. **`backend/src/main/java/com/example/backend/service/OutboundJobWorker.java`**
   - Integrated `MetricsService` via constructor injection
   - Added metrics recording in `handleSuccess()`:
     - Increments success counter
     - Records delivery latency
   - Added metrics recording in `handleFailure()`:
     - Increments retry counter (for retryable failures)
     - Increments failure and dead letter counters (for permanent failures)

4. **`backend/src/main/java/com/example/backend/service/OutboundMessageService.java`**
   - Integrated `MetricsService` via constructor injection
   - Added metrics recording in `createOutboundMessage()`:
     - Increments queued counter when message is created

5. **`backend/src/main/resources/application.yml`**
   - Added outbound metrics configuration section
   - Added outbound alert configuration section with cron expressions
   - Configured percentile histograms for delivery latency metrics
   - Defined custom percentiles (p50, p75, p90, p95, p99)

6. **`backend/README.md`**
   - Added Metrics and Prometheus endpoint documentation
   - Added Observability section with reference to detailed documentation

## Metrics Implemented

### Counters (11 metrics)
- `outbound_message_queued_total` - Messages queued by channel
- `outbound_message_send_success_total` - Successful sends by channel
- `outbound_message_send_failure_total` - Failed sends by channel and error code
- `outbound_message_retry_total` - Retry attempts by channel
- `outbound_message_dead_letter_total` - Permanently failed messages by channel
- `outbound_message_stuck_alert_total` - Stuck message alerts by channel and status
- `outbound_message_high_queue_depth_alert_total` - High queue depth alerts
- `outbound_message_dead_letter_alert_total` - Dead letter queue growth alerts
- `outbound_message_alert_error_total` - Alert service errors

### Timers (1 metric)
- `outbound_message_delivery_latency` - End-to-end delivery latency by channel with percentiles

### Gauges (5 metrics)
- `outbound_message_queue_depth` - Current messages by status
- `outbound_message_queue_depth_by_channel` - Current queued messages by channel
- `outbound_message_retry_count` - Messages with retry attempts by channel
- `outbound_message_dead_letter_queue_size` - Current failed message count
- `outbound_message_total_queued` - Total queued messages across all channels

## Alert Jobs Implemented

### 1. Stuck Messages Alert
- **Schedule**: Every 15 minutes (configurable)
- **Detects**: Messages stuck in QUEUED or SENDING state
- **Criteria**: 
  - At least 3 attempts (configurable)
  - At least 2 hours old (configurable)
- **Action**: Logs detailed warning with message ID, channel, attempts, age, error code

### 2. High Queue Depth Alert
- **Schedule**: Every 10 minutes (configurable)
- **Detects**: Excessive queue growth
- **Criteria**: Total pending messages > 1000
- **Action**: Logs warning with queue statistics

### 3. Dead Letter Queue Growth Alert
- **Schedule**: Every hour (configurable)
- **Detects**: Accumulation of permanently failed messages
- **Criteria**: Failed messages > 100
- **Action**: Logs warning with failed message count

## Configuration Properties

All properties are environment-variable configurable:

```yaml
outbound:
  metrics:
    update-interval-ms: 10000
  alert:
    enabled: true
    cron: "0 */15 * * * *"
    stuck-message-threshold-attempts: 3
    stuck-message-age-hours: 2
    max-results: 100
    high-queue-depth:
      cron: "0 */10 * * * *"
    dead-letter:
      cron: "0 0 * * * *"

management:
  metrics:
    distribution:
      percentiles-histogram:
        outbound.message.delivery.latency: true
      percentiles:
        outbound.message.delivery.latency: 0.5, 0.75, 0.9, 0.95, 0.99
```

## Integration Points

### Metrics Recording Flow

1. **Message Creation**: `OutboundMessageService` → increments `outbound_message_queued_total`
2. **Message Processing**: `OutboundJobWorker` → records success/failure/retry metrics
3. **Delivery Tracking**: `OutboundJobWorker` → records delivery latency on success
4. **Gauge Updates**: `OutboundMessageMetricsService` → queries DB and updates gauges every 10s
5. **Alert Monitoring**: `OutboundMessageAlertService` → checks for issues and increments alert counters

### Dependencies

- **Micrometer**: Core metrics library (already included via Spring Boot Actuator)
- **Prometheus**: Metrics format for scraping (already configured)
- **Spring Scheduling**: For periodic gauge updates and alert jobs (already enabled)

## Testing Considerations

- Scheduling is disabled in test profiles (`spring.task.scheduling.enabled: false`)
- Alert jobs will not run during tests
- Metrics can still be validated by injecting `MeterRegistry` in tests
- Gauge updates can be triggered manually by calling `OutboundMessageMetricsService.updateMetrics()`

## Deployment Considerations

1. **Prometheus Scraping**: Configure Prometheus to scrape `/actuator/prometheus` endpoint
2. **Grafana Dashboard**: Import the provided JSON dashboard configuration
3. **Alert Configuration**: Consider setting up PagerDuty/Opsgenie alerts based on metrics
4. **Resource Usage**: Gauge updates run every 10s - monitor DB query performance
5. **Log Aggregation**: Ensure structured logs from alert service are captured

## Sample Prometheus Queries

```promql
# Success rate by channel
rate(outbound_message_send_success_total[5m]) / 
(rate(outbound_message_send_success_total[5m]) + rate(outbound_message_send_failure_total[5m]))

# P95 delivery latency
histogram_quantile(0.95, sum by (channel, le) (rate(outbound_message_delivery_latency_bucket[5m])))

# Current queue depth
outbound_message_total_queued

# Stuck message alert rate
rate(outbound_message_stuck_alert_total[1h])
```

## Future Enhancements

- Add circuit breaker metrics when implemented
- Add per-organization queue depth metrics
- Implement SLO tracking and burn rate alerts
- Add provider-specific success/failure metrics
- Track message age distribution in queue
- Add correlation with external service health metrics

## Monitoring Best Practices

1. Set up alerts on:
   - Delivery latency p95 > 5 seconds
   - Success rate < 95%
   - Stuck message alerts > 0
   - Dead letter queue size growing
   - High queue depth alerts

2. Create dashboards for:
   - Real-time queue health
   - Channel-specific performance
   - Error trending by error code
   - Retry rate analysis

3. Regular reviews:
   - Weekly review of failed message patterns
   - Monthly capacity planning based on queue trends
   - Quarterly SLO review and adjustment
