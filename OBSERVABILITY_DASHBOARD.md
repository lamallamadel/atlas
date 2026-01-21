# Observability Dashboard

## Overview

The Observability Dashboard provides comprehensive real-time monitoring and visualization of outbound message queue metrics, delivery performance, failure analysis, dead letter queue (DLQ) monitoring, and provider quota tracking.

## Features

### 1. Queue Depth Monitoring
- **Real-time queue depth by channel**: EMAIL, SMS, WHATSAPP, PHONE, CHAT, IN_APP
- **Total queued messages**: Aggregate count across all channels
- **Visual bar charts**: Easy-to-read visualization of queue backlogs

### 2. Delivery Latency Percentiles
- **P50 (Median)**: 50th percentile latency
- **P95**: 95th percentile latency
- **P99**: 99th percentile latency
- **Average**: Mean delivery time
- **Per-channel breakdown**: Latency metrics for each messaging channel
- **Multi-bar chart visualization**: Compare percentiles across channels

### 3. Failure Rate Analysis
- **Overall failure rate**: Percentage of failed messages
- **Failures by channel**: Breakdown of failures per messaging channel
- **Error code breakdown**: Frequency analysis of different error types
- **Failure trend chart**: Time-series visualization showing failure patterns
- **Detailed error tracking**: Identify root causes of delivery issues

### 4. Dead Letter Queue (DLQ) Monitoring
- **DLQ size tracking**: Total messages that exceeded max retry attempts
- **DLQ by channel**: Channel-specific DLQ metrics
- **Alert threshold**: Configurable threshold (default: 100 messages)
- **Visual alerts**: Color-coded warnings when threshold exceeded
- **Recent DLQ messages table**:
  - Message ID
  - Channel
  - Error code
  - Error message
  - Attempt count
  - Last attempt timestamp

### 5. Provider Quota Consumption
- **Usage tracking**: Messages sent vs. quota limits
- **Usage percentage**: Visual percentage indicators
- **Color-coded status**:
  - Green (< 75%): Normal
  - Yellow (75-90%): Warning
  - Red (> 90%): Critical
- **Per-channel quotas**: Individual tracking for each provider
- **Period indication**: Quota refresh period (e.g., last_hour)

### 6. Data Export
- **CSV Export**: Structured CSV format for spreadsheet analysis
- **JSON Export**: Complete metrics data in JSON format
- **Downloadable files**: One-click download of metrics data

### 7. Real-time Updates
- **Auto-refresh**: Configurable automatic refresh (default: 30 seconds)
- **Manual refresh**: On-demand metrics reload
- **Last updated timestamp**: Shows when data was last refreshed
- **Date range filtering**: Custom date range selection

## API Endpoints

### GET /api/v1/reports/observability/metrics
Returns comprehensive observability metrics.

**Query Parameters:**
- `from` (optional): Start date in ISO format (yyyy-MM-dd)
- `to` (optional): End date in ISO format (yyyy-MM-dd)
- `orgId` (optional): Organization ID (defaults to current tenant)

**Response:**
```json
{
  "queueMetrics": {
    "queueDepthByChannel": {
      "EMAIL": 10,
      "SMS": 5,
      "WHATSAPP": 8
    },
    "totalQueued": 23
  },
  "latencyMetrics": {
    "latencyByChannel": {
      "EMAIL": {
        "p50": 120.5,
        "p95": 450.2,
        "p99": 890.1,
        "average": 180.3
      }
    }
  },
  "failureMetrics": {
    "failuresByChannel": {
      "EMAIL": 5,
      "SMS": 2
    },
    "failuresByErrorCode": {
      "RATE_LIMIT_EXCEEDED": 3,
      "INVALID_RECIPIENT": 2
    },
    "failureTrend": [
      { "date": "2024-01-01", "value": 5 },
      { "date": "2024-01-02", "value": 3 }
    ],
    "overallFailureRate": 2.5
  },
  "dlqMetrics": {
    "dlqSize": 15,
    "dlqSizeByChannel": {
      "EMAIL": 10,
      "SMS": 5
    },
    "recentDlqMessages": [
      {
        "messageId": 12345,
        "channel": "EMAIL",
        "errorCode": "INVALID_RECIPIENT",
        "errorMessage": "Email address not found",
        "attemptCount": 5,
        "lastAttemptAt": "2024-01-15T10:30:00"
      }
    ],
    "alertThresholdExceeded": false,
    "alertThreshold": 100
  },
  "quotaMetrics": {
    "quotaByChannel": {
      "EMAIL": {
        "used": 5000,
        "limit": 10000,
        "usagePercentage": 50.0,
        "period": "last_hour"
      }
    }
  },
  "timestamp": "2024-01-15T12:00:00"
}
```

### GET /api/v1/reports/observability/metrics/export
Exports metrics in CSV or JSON format.

**Query Parameters:**
- `format` (required): Export format ("csv" or "json")
- `from` (optional): Start date
- `to` (optional): End date
- `orgId` (optional): Organization ID

**Response:**
- CSV format: `Content-Type: text/csv`
- JSON format: `Content-Type: application/json`

## Database Queries

The observability service uses optimized database queries:

### Queue Depth
```sql
SELECT om.channel, COUNT(om) 
FROM outbound_message om 
WHERE om.status = 'QUEUED' 
GROUP BY om.channel
```

### Latency Percentiles
```sql
SELECT EXTRACT(EPOCH FROM (oa.updatedAt - oa.createdAt)) 
FROM outbound_attempt oa 
JOIN oa.outboundMessage om 
WHERE om.channel = :channel 
  AND oa.status = 'SUCCESS' 
  AND oa.createdAt >= :afterTime 
ORDER BY EXTRACT(EPOCH FROM (oa.updatedAt - oa.createdAt))
```

### Failure Trends
```sql
SELECT DATE(om.createdAt), COUNT(om) 
FROM outbound_message om 
WHERE om.status = 'FAILED' 
  AND om.createdAt >= :afterTime 
GROUP BY DATE(om.createdAt) 
ORDER BY DATE(om.createdAt)
```

### DLQ Messages
```sql
SELECT om 
FROM outbound_message om 
WHERE om.status = 'FAILED' 
  AND om.attemptCount >= om.maxAttempts 
ORDER BY om.updatedAt DESC
```

## Frontend Components

### ObservabilityDashboardComponent
Location: `frontend/src/app/components/observability-dashboard.component.ts`

**Features:**
- Real-time metrics loading with auto-refresh
- Chart.js integration for visualizations
- Responsive design with mobile support
- Date range filtering
- Export functionality
- Error handling and loading states

### Chart Visualizations
- **Bar Charts**: Queue depth, latency percentiles, failures, DLQ
- **Line Chart**: Failure trends over time
- **Pie Chart**: Error code distribution

## Usage

### Accessing the Dashboard
Navigate to `/observability` in the application.

### Filtering by Date Range
1. Select "From" date
2. Select "To" date
3. Click outside the date picker or press Enter
4. Metrics will automatically reload

### Auto-refresh
- Toggle auto-refresh using the play/pause button
- Default refresh interval: 30 seconds
- Auto-refresh continues in the background

### Exporting Data
1. Click "Export CSV" for spreadsheet format
2. Click "Export JSON" for raw data format
3. File downloads automatically

## Configuration

### Alert Threshold
Default DLQ alert threshold: 100 messages

To modify, update `ObservabilityService.java`:
```java
private static final long DLQ_ALERT_THRESHOLD = 100L;
```

### Refresh Interval
Default auto-refresh: 30 seconds (30000ms)

To modify, update `observability-dashboard.component.ts`:
```typescript
refreshInterval = 30000;
```

### Recent DLQ Limit
Default: 10 recent messages

To modify, update `ObservabilityService.java`:
```java
private static final int RECENT_DLQ_LIMIT = 10;
```

## Performance Considerations

### Database Optimization
- Uses indexed queries for fast retrieval
- Partial indexes on PostgreSQL (V101 migration):
  - `idx_outbound_message_queued` for queued messages
  - `idx_outbound_attempt_pending_retry` for retry attempts
- Group by operations for aggregations
- Limited result sets for DLQ messages

### Frontend Optimization
- Chart.js lazy loading
- Chart destruction on component destroy
- Efficient chart updates (destroy and recreate)
- Date range caching
- Observable cleanup on component destroy

## Monitoring Best Practices

1. **Queue Depth**: Monitor for unusual spikes indicating processing bottlenecks
2. **Latency**: Track P99 latency for performance degradation
3. **Failure Rate**: Set alerts for rates > 5%
4. **DLQ Size**: Investigate when threshold exceeded
5. **Quota Usage**: Plan capacity when usage > 75%

## Troubleshooting

### No Data Displayed
- Check date range is valid
- Verify backend service is running
- Check browser console for errors
- Ensure proper authentication

### Charts Not Rendering
- Chart.js may not be loaded
- Check browser console for import errors
- Verify Chart.js is in package.json

### Slow Performance
- Reduce date range
- Increase refresh interval
- Check database indexes
- Monitor backend logs

## Future Enhancements

- WebSocket support for real-time updates
- Historical trend analysis
- Anomaly detection algorithms
- Custom alert rules
- Grafana/Prometheus integration
- Email/Slack notifications
- Multi-tenant filtering
- Custom dashboard layouts
