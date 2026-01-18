# Outbound Messaging Observability

This document describes the comprehensive observability features implemented for the outbound messaging system.

## Overview

The outbound messaging system includes robust metrics, gauges, and alerting capabilities to monitor message processing, delivery latency, retry behavior, and system health.

## Metrics

All metrics are exposed via Micrometer and available through the `/actuator/prometheus` endpoint.

### Counter Metrics

#### `outbound_message_queued_total`
- **Type**: Counter
- **Tags**: `channel` (email, sms, whatsapp, phone, chat, in_app)
- **Description**: Total number of messages queued for sending
- **When incremented**: When a new outbound message is created with QUEUED status

#### `outbound_message_send_success_total`
- **Type**: Counter
- **Tags**: `channel`
- **Description**: Total number of successfully sent messages
- **When incremented**: When a message is successfully sent and moved to SENT status

#### `outbound_message_send_failure_total`
- **Type**: Counter
- **Tags**: `channel`, `error_code`
- **Description**: Total number of permanently failed messages
- **When incremented**: When a message exhausts all retry attempts or encounters a non-retryable error

#### `outbound_message_retry_total`
- **Type**: Counter
- **Tags**: `channel`
- **Description**: Total number of message retry attempts
- **When incremented**: When a message is scheduled for retry after a failure

#### `outbound_message_dead_letter_total`
- **Type**: Counter
- **Tags**: `channel`
- **Description**: Total number of messages moved to dead letter queue (permanently failed)
- **When incremented**: When a message reaches FAILED status

#### `outbound_message_stuck_alert_total`
- **Type**: Counter
- **Tags**: `channel`, `status` (queued, sending)
- **Description**: Total number of stuck message alerts triggered
- **When incremented**: When the alert job detects a stuck message

#### `outbound_message_high_queue_depth_alert_total`
- **Type**: Counter
- **Description**: Total number of high queue depth alerts triggered
- **When incremented**: When total pending messages exceed threshold (default: 1000)

#### `outbound_message_dead_letter_alert_total`
- **Type**: Counter
- **Description**: Total number of dead letter queue alerts triggered
- **When incremented**: When failed messages exceed threshold (default: 100)

#### `outbound_message_alert_error_total`
- **Type**: Counter
- **Description**: Total number of errors encountered while running alert checks
- **When incremented**: When an exception occurs in alert service

### Timer Metrics

#### `outbound_message_delivery_latency`
- **Type**: Timer
- **Tags**: `channel`
- **Description**: Time taken from message creation to successful delivery
- **Percentiles**: p50, p75, p90, p95, p99
- **When recorded**: When a message is successfully sent

### Gauge Metrics

#### `outbound_message_queue_depth`
- **Type**: Gauge
- **Tags**: `status` (queued, sending, sent, delivered, failed, cancelled)
- **Description**: Current number of messages in each status
- **Update frequency**: Every 10 seconds (configurable via `outbound.metrics.update-interval-ms`)

#### `outbound_message_queue_depth_by_channel`
- **Type**: Gauge
- **Tags**: `channel`, `status=queued`
- **Description**: Current number of queued messages per channel
- **Update frequency**: Every 10 seconds

#### `outbound_message_retry_count`
- **Type**: Gauge
- **Tags**: `channel`
- **Description**: Current number of messages with retry attempts (attempt_count > 0) per channel
- **Update frequency**: Every 10 seconds

#### `outbound_message_dead_letter_queue_size`
- **Type**: Gauge
- **Description**: Current number of permanently failed messages
- **Update frequency**: Every 10 seconds

#### `outbound_message_total_queued`
- **Type**: Gauge
- **Description**: Current total number of queued messages across all channels
- **Update frequency**: Every 10 seconds

## Scheduled Alert Jobs

The system includes three scheduled jobs that monitor message processing health and log warnings when thresholds are exceeded.

### Stuck Messages Alert

- **Schedule**: Every 15 minutes (configurable via `outbound.alert.cron`)
- **Purpose**: Detect messages stuck in QUEUED or SENDING state
- **Thresholds**:
  - Minimum attempts: 3 (configurable via `outbound.alert.stuck-message-threshold-attempts`)
  - Minimum age: 2 hours (configurable via `outbound.alert.stuck-message-age-hours`)
- **Alert details**: Logs message ID, channel, attempt count, age, and error code
- **Metric**: Increments `outbound_message_stuck_alert_total`

### High Queue Depth Alert

- **Schedule**: Every 10 minutes (configurable via `outbound.alert.high-queue-depth.cron`)
- **Purpose**: Detect when the outbound message queue grows too large
- **Threshold**: 1000 total pending messages (hardcoded)
- **Alert details**: Logs queued count, sending count, and total pending
- **Metric**: Increments `outbound_message_high_queue_depth_alert_total`

### Dead Letter Queue Growth Alert

- **Schedule**: Every hour (configurable via `outbound.alert.dead-letter.cron`)
- **Purpose**: Detect accumulation of permanently failed messages
- **Threshold**: 100 failed messages (hardcoded)
- **Alert details**: Logs failed message count
- **Metric**: Increments `outbound_message_dead_letter_alert_total`

## Configuration Properties

### Worker Configuration

```yaml
outbound:
  worker:
    enabled: true                    # Enable/disable the worker
    poll-interval-ms: 5000          # How often to poll for pending messages
    batch-size: 10                   # Max messages to process per batch
```

### Metrics Configuration

```yaml
outbound:
  metrics:
    update-interval-ms: 10000       # How often to update gauge metrics
```

### Alert Configuration

```yaml
outbound:
  alert:
    enabled: true                                    # Enable/disable alerts
    cron: "0 */15 * * * *"                          # Stuck messages check (every 15 min)
    stuck-message-threshold-attempts: 3              # Min attempts to be considered stuck
    stuck-message-age-hours: 2                       # Min age to be considered stuck
    max-results: 100                                 # Max stuck messages to report
    high-queue-depth:
      cron: "0 */10 * * * *"                        # High queue depth check (every 10 min)
    dead-letter:
      cron: "0 0 * * * *"                           # Dead letter check (every hour)
```

### Metrics Distribution Configuration

```yaml
management:
  metrics:
    distribution:
      percentiles-histogram:
        outbound.message.delivery.latency: true     # Enable histogram
      percentiles:
        outbound.message.delivery.latency: 0.5, 0.75, 0.9, 0.95, 0.99  # Percentiles to track
```

## Environment Variables

All configuration properties can be overridden via environment variables:

- `OUTBOUND_WORKER_ENABLED`: Enable/disable worker (default: true)
- `OUTBOUND_WORKER_POLL_INTERVAL_MS`: Polling interval (default: 5000)
- `OUTBOUND_WORKER_BATCH_SIZE`: Batch size (default: 10)
- `OUTBOUND_METRICS_UPDATE_INTERVAL_MS`: Metrics update interval (default: 10000)
- `OUTBOUND_ALERT_ENABLED`: Enable/disable alerts (default: true)
- `OUTBOUND_ALERT_CRON`: Stuck messages cron expression (default: "0 */15 * * * *")
- `OUTBOUND_ALERT_STUCK_THRESHOLD_ATTEMPTS`: Min attempts for stuck alert (default: 3)
- `OUTBOUND_ALERT_STUCK_AGE_HOURS`: Min age for stuck alert (default: 2)
- `OUTBOUND_ALERT_MAX_RESULTS`: Max results per alert (default: 100)
- `OUTBOUND_ALERT_HIGH_QUEUE_CRON`: High queue depth cron (default: "0 */10 * * * *")
- `OUTBOUND_ALERT_DEAD_LETTER_CRON`: Dead letter cron (default: "0 0 * * * *")

## Usage Examples

### Query Metrics via Prometheus

```promql
# Total messages queued by channel
sum by (channel) (outbound_message_queued_total)

# Success rate by channel
rate(outbound_message_send_success_total[5m]) / (rate(outbound_message_send_success_total[5m]) + rate(outbound_message_send_failure_total[5m]))

# P95 delivery latency by channel
histogram_quantile(0.95, sum by (channel, le) (rate(outbound_message_delivery_latency_bucket[5m])))

# Current queue depth
outbound_message_total_queued

# Dead letter queue size
outbound_message_dead_letter_queue_size

# Retry rate by channel
rate(outbound_message_retry_total[5m])
```

### Grafana Dashboard Queries

**Panel: Current Queue Depth by Status**
```promql
outbound_message_queue_depth
```

**Panel: Message Send Rate by Channel**
```promql
rate(outbound_message_send_success_total[5m])
```

**Panel: Delivery Latency Percentiles (Email)**
```promql
histogram_quantile(0.50, sum by (le) (rate(outbound_message_delivery_latency_bucket{channel="email"}[5m])))
histogram_quantile(0.95, sum by (le) (rate(outbound_message_delivery_latency_bucket{channel="email"}[5m])))
histogram_quantile(0.99, sum by (le) (rate(outbound_message_delivery_latency_bucket{channel="email"}[5m])))
```

**Panel: Failure Rate by Error Code**
```promql
sum by (error_code) (rate(outbound_message_send_failure_total[5m]))
```

**Panel: Retry Attempts by Channel**
```promql
outbound_message_retry_count
```

## Architecture

### Components

1. **MetricsService**: Central service for recording counter and timer metrics
2. **OutboundMessageMetricsService**: Manages gauge metrics, updates them periodically
3. **OutboundMessageAlertService**: Scheduled jobs that check for stuck messages and system health issues
4. **OutboundJobWorker**: Processes messages and records metrics during send attempts
5. **OutboundMessageService**: Records metrics when messages are queued

### Data Flow

```
Message Creation
    ↓
OutboundMessageService.createOutboundMessage()
    ↓
Increment: outbound_message_queued_total
    ↓
OutboundJobWorker.processMessage()
    ↓
Send Attempt
    ↓
Success? → Increment: outbound_message_send_success_total
         → Record: outbound_message_delivery_latency
    ↓
Failure? → Retry? → Increment: outbound_message_retry_total
                 → No Retry? → Increment: outbound_message_send_failure_total
                            → Increment: outbound_message_dead_letter_total
```

### Gauge Update Flow

```
OutboundMessageMetricsService (Scheduled every 10s)
    ↓
Query OutboundMessageRepository
    ↓
Update Gauges:
  - outbound_message_queue_depth (by status)
  - outbound_message_queue_depth_by_channel
  - outbound_message_retry_count
  - outbound_message_dead_letter_queue_size
  - outbound_message_total_queued
```

### Alert Flow

```
OutboundMessageAlertService (Scheduled)
    ↓
Query for Stuck/High Queue/Dead Letter Issues
    ↓
Found Issues? → Log Warning
              → Increment Alert Counter Metric
```

## Best Practices

1. **Monitor delivery latency percentiles**: Focus on p95 and p99 to catch tail latencies
2. **Set up alerts on stuck messages**: Configure PagerDuty/Opsgenie based on `outbound_message_stuck_alert_total`
3. **Track retry rates**: High retry rates may indicate external service issues
4. **Watch dead letter queue growth**: Indicates systematic delivery failures
5. **Correlate with error codes**: Group failures by `error_code` to identify root causes
6. **Monitor queue depth trends**: Sudden spikes may indicate throughput issues

## Troubleshooting

### High Queue Depth

**Symptoms**: `outbound_message_total_queued` growing continuously

**Potential causes**:
- Worker disabled (`outbound.worker.enabled=false`)
- External service degradation
- Insufficient worker capacity (increase `outbound.worker.batch-size`)

**Actions**:
1. Check worker logs for errors
2. Verify external service health
3. Consider scaling worker instances
4. Temporarily increase batch size

### High Retry Rate

**Symptoms**: `rate(outbound_message_retry_total)` increasing

**Potential causes**:
- External service intermittent failures
- Network issues
- Rate limiting by provider

**Actions**:
1. Check error codes in logs
2. Verify provider status pages
3. Review retry backoff configuration
4. Consider circuit breaker pattern

### Growing Dead Letter Queue

**Symptoms**: `outbound_message_dead_letter_queue_size` growing

**Potential causes**:
- Invalid recipient addresses
- Provider configuration issues
- Systematic validation failures

**Actions**:
1. Review failed messages for patterns
2. Check error codes and messages
3. Validate provider credentials
4. Consider manual reprocessing of recoverable failures

## Testing Metrics

### Manual Verification

You can verify metrics are being recorded by:

1. **Start the application**:
   ```bash
   mvn spring-boot:run
   ```

2. **Create a test message** (use the API or service directly)

3. **Check metrics endpoint**:
   ```bash
   # List all metrics
   curl http://localhost:8080/actuator/metrics
   
   # Check specific metric
   curl http://localhost:8080/actuator/metrics/outbound_message_queued_total
   
   # Check gauge
   curl http://localhost:8080/actuator/metrics/outbound_message_total_queued
   ```

4. **Check Prometheus endpoint**:
   ```bash
   curl http://localhost:8080/actuator/prometheus | grep outbound_message
   ```

### Integration Testing

In integration tests, you can inject `MeterRegistry` to verify metrics:

```java
@SpringBootTest
class OutboundMessageMetricsIntegrationTest {
    
    @Autowired
    private MeterRegistry meterRegistry;
    
    @Autowired
    private OutboundMessageService outboundMessageService;
    
    @Test
    void testQueuedMetricIncremented() {
        double before = meterRegistry.counter("outbound_message_queued_total", 
                "channel", "email").count();
        
        // Create a message
        outboundMessageService.createOutboundMessage(
            null, MessageChannel.EMAIL, "test@example.com", 
            null, null, null, UUID.randomUUID().toString()
        );
        
        double after = meterRegistry.counter("outbound_message_queued_total", 
                "channel", "email").count();
        
        assertEquals(before + 1, after);
    }
}
```

## Future Enhancements

- [ ] Add success/failure rate alerts with thresholds
- [ ] Implement circuit breaker metrics
- [ ] Add per-organization queue depth metrics
- [ ] Track message age distribution
- [ ] Add provider-specific metrics
- [ ] Implement SLO tracking and burn rate alerts
- [ ] Add custom metric tags from message metadata
