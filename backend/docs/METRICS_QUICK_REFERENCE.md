# Outbound Messaging Metrics - Quick Reference

## Key Metrics to Monitor

### Queue Health
| Metric | Type | Description | Alert On |
|--------|------|-------------|----------|
| `outbound_message_total_queued` | Gauge | Current queued messages | > 1000 |
| `outbound_message_queue_depth{status="queued"}` | Gauge | Messages in QUEUED state | Growing trend |
| `outbound_message_queue_depth{status="sending"}` | Gauge | Messages in SENDING state | Stuck at high value |

### Success/Failure
| Metric | Type | Description | Alert On |
|--------|------|-------------|----------|
| `outbound_message_send_success_total` | Counter | Successful sends | Rate decreasing |
| `outbound_message_send_failure_total` | Counter | Permanent failures | Rate increasing |
| Success Rate | Calculated | `success / (success + failure)` | < 95% |

### Performance
| Metric | Type | Description | Alert On |
|--------|------|-------------|----------|
| `outbound_message_delivery_latency` | Timer | Time to deliver | p95 > 5s |
| `outbound_message_retry_total` | Counter | Retry attempts | Rate > 10% of queued |

### Dead Letter Queue
| Metric | Type | Description | Alert On |
|--------|------|-------------|----------|
| `outbound_message_dead_letter_queue_size` | Gauge | Failed messages | > 100 or growing |
| `outbound_message_dead_letter_total` | Counter | DLQ additions | Rate increasing |

### Alerts
| Metric | Type | Description | Action |
|--------|------|-------------|--------|
| `outbound_message_stuck_alert_total` | Counter | Stuck message alerts | Investigate immediately |
| `outbound_message_high_queue_depth_alert_total` | Counter | Queue overload alerts | Scale or investigate |

## Quick Prometheus Queries

### Success Rate by Channel (Last 5 Minutes)
```promql
rate(outbound_message_send_success_total[5m]) / 
(rate(outbound_message_send_success_total[5m]) + rate(outbound_message_send_failure_total[5m]))
```

### Current Queue Depth by Status
```promql
outbound_message_queue_depth
```

### P95 Delivery Latency
```promql
histogram_quantile(0.95, sum by (channel, le) (rate(outbound_message_delivery_latency_bucket[5m])))
```

### Retry Rate
```promql
rate(outbound_message_retry_total[5m]) / rate(outbound_message_queued_total[5m])
```

### Failed Messages by Error Code
```promql
sum by (error_code) (rate(outbound_message_send_failure_total[5m]))
```

### Messages Stuck in Queue (Current)
```promql
outbound_message_retry_count
```

## Alert Rules (Prometheus)

```yaml
groups:
  - name: outbound_messaging
    interval: 30s
    rules:
      # Critical: Success rate below 95%
      - alert: OutboundMessageLowSuccessRate
        expr: |
          rate(outbound_message_send_success_total[5m]) / 
          (rate(outbound_message_send_success_total[5m]) + rate(outbound_message_send_failure_total[5m])) < 0.95
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Outbound message success rate below 95%"
          
      # Critical: High delivery latency
      - alert: OutboundMessageHighLatency
        expr: |
          histogram_quantile(0.95, sum by (channel, le) (rate(outbound_message_delivery_latency_bucket[5m]))) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Outbound message P95 latency above 5 seconds for {{ $labels.channel }}"
          
      # Warning: High queue depth
      - alert: OutboundMessageHighQueueDepth
        expr: outbound_message_total_queued > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Outbound message queue depth above 1000"
          
      # Critical: Growing dead letter queue
      - alert: OutboundMessageDeadLetterGrowth
        expr: rate(outbound_message_dead_letter_total[1h]) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Dead letter queue growing rapidly (>10/hour)"
          
      # Warning: Stuck messages detected
      - alert: OutboundMessageStuck
        expr: rate(outbound_message_stuck_alert_total[15m]) > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Stuck messages detected in outbound queue"
```

## Common Dashboards

### Executive Dashboard
- Total queued messages (single stat)
- Success rate over time (graph)
- P95 latency (graph)
- Dead letter queue size (single stat with threshold colors)

### Operations Dashboard
- Queue depth by status (stacked graph)
- Send rate by channel (graph)
- Retry rate (graph)
- Alert counts (table)

### Performance Dashboard
- Delivery latency percentiles (p50, p75, p90, p95, p99)
- Success rate by channel
- Throughput (messages/second)
- Error distribution by error code

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /actuator/metrics` | List all available metrics |
| `GET /actuator/metrics/{metric.name}` | Get specific metric details |
| `GET /actuator/prometheus` | Prometheus scrape endpoint |
| `GET /actuator/health` | Application health status |

## Configuration

### Enable/Disable Features
```yaml
outbound:
  worker:
    enabled: true  # Enable message processing
  metrics:
    update-interval-ms: 10000  # Gauge update frequency
  alert:
    enabled: true  # Enable alert jobs
```

### Common Environment Variables
```bash
OUTBOUND_WORKER_ENABLED=true
OUTBOUND_ALERT_ENABLED=true
OUTBOUND_METRICS_UPDATE_INTERVAL_MS=10000
OUTBOUND_ALERT_STUCK_THRESHOLD_ATTEMPTS=3
OUTBOUND_ALERT_STUCK_AGE_HOURS=2
```

## Tags Reference

### Counter/Timer Tags
- `channel`: email, sms, whatsapp, phone, chat, in_app
- `error_code`: Provider-specific error codes (e.g., "RATE_LIMITED", "INVALID_RECIPIENT")
- `status`: queued, sending, sent, delivered, failed, cancelled

### Gauge Tags
- `channel`: email, sms, whatsapp, phone, chat, in_app
- `status`: queued, sending, sent, delivered, failed, cancelled

## Troubleshooting Checklist

- [ ] Check `/actuator/prometheus` endpoint is accessible
- [ ] Verify metrics are incrementing (create test message)
- [ ] Check logs for alert service warnings
- [ ] Verify Prometheus is scraping successfully
- [ ] Confirm Grafana data source is connected
- [ ] Review time range in dashboards (default: last 1 hour)
- [ ] Check worker is enabled: `outbound.worker.enabled=true`
- [ ] Verify scheduling is enabled (not in test mode)

## Support

For detailed documentation, see [OUTBOUND_MESSAGING_OBSERVABILITY.md](OUTBOUND_MESSAGING_OBSERVABILITY.md)
