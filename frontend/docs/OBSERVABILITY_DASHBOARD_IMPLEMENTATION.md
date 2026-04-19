# Observability Dashboard Implementation

## Overview

A comprehensive real-time monitoring dashboard for outbound message processing with advanced metrics visualization using Chart.js. The dashboard provides deep insights into queue depth, delivery latency, failure rates, DLQ monitoring, and provider quota consumption.

## Features Implemented

### 1. Real-time Queue Depth Monitoring (Line Chart)
- **Chart Type:** Multi-line chart with filled areas
- **Interval:** 1-minute data points
- **History:** Maintains up to 60 historical points (1 hour of data)
- **Channels:** Separate line for each message channel (SMS, EMAIL, WHATSAPP, etc.)
- **Auto-refresh:** Updates every 30 seconds via RxJS interval operator
- **Summary Cards:** Total queued count and per-channel breakdown

**Technical Details:**
```typescript
// Time-series data structure
interface TimeSeriesPoint {
  timestamp: Date;
  values: { [channel: string]: number };
}

// Historical data management
private queueDepthHistory: TimeSeriesPoint[] = [];
private readonly maxHistoryPoints = 60; // 1 hour
```

### 2. Message Delivery Latency Histograms
- **Chart Type:** Grouped bar chart
- **Metrics:** P50, P95, P99 percentiles + average latency
- **Visualization:** 
  - P50 in teal/cyan (75, 192, 192)
  - P95 in yellow (255, 206, 86)
  - P99 in red (255, 99, 132)
- **Data Table:** Detailed latency breakdown with Material table
- **Units:** Milliseconds with 2 decimal precision

**Latency Distribution:**
- P50: Median latency (50th percentile)
- P95: 95th percentile (SLA critical)
- P99: 99th percentile (outlier detection)
- Average: Mean latency across all messages

### 3. Failure Rate Trends (Stacked Bar Chart)
- **Chart Type:** Stacked bar chart
- **Grouping:** By error code over time
- **Time Series:** Daily failure trends
- **Color Coding:** Different color for each error code type
- **Overall Metric:** Failure rate percentage displayed prominently
- **Error Distribution:** Doughnut chart showing error code breakdown
- **Error List:** Material list with error code summaries

**Error Analysis:**
- Tracks failures by channel
- Groups by error code (INVALID_NUMBER, TIMEOUT, REJECTED, etc.)
- Identifies trends and patterns
- Calculates overall failure rate

### 4. DLQ (Dead Letter Queue) Monitoring
- **Chart Type:** Bar chart with threshold annotations
- **Thresholds:**
  - Warning: 75% of alert threshold (yellow/orange)
  - Critical: Alert threshold (red)
  - Normal: Below warning (green)
- **Visual Indicators:**
  - Color-coded bars by status
  - Alert banners when thresholds exceeded
  - Status icons in summary cards
- **Recent Messages Table:** Shows last N DLQ messages with:
  - Message ID
  - Channel
  - Error code and message
  - Attempt count
  - Last attempt timestamp

**DLQ Status Logic:**
```typescript
getDlqStatus(channel: string): 'normal' | 'warning' | 'critical' {
  const size = getDlqSize(channel);
  const threshold = metrics.dlqMetrics.alertThreshold;
  const warningThreshold = threshold * 0.75;
  
  if (size >= threshold) return 'critical';
  if (size >= warningThreshold) return 'warning';
  return 'normal';
}
```

### 5. Provider Quota Consumption Tracking
- **Chart Type:** Bar chart with percentage scale (0-100%)
- **Thresholds:**
  - Normal: < 75% (green)
  - Warning: 75-90% (orange)
  - Critical: >= 90% (red)
- **Visual Components:**
  - Material progress bars
  - Status indicators with icons
  - Detailed usage statistics (used/limit)
  - Period information (daily/hourly)
- **Quota Cards:** Individual card per channel showing:
  - Usage percentage (large)
  - Used count
  - Limit count
  - Period (e.g., "daily", "hourly")
  - Status text (NORMAL/WARNING/CRITICAL)

**Quota Visualization:**
```typescript
getQuotaStatusClass(percentage: number): string {
  if (percentage >= 90) return 'quota-critical';
  if (percentage >= 75) return 'quota-warning';
  return 'quota-normal';
}
```

### 6. Auto-refresh with RxJS
- **Interval:** 30 seconds (configurable)
- **Implementation:**
  ```typescript
  interval(this.refreshInterval)
    .pipe(
      takeUntil(this.destroy$),
      startWith(0),
      switchMap(() => {
        if (this.autoRefresh) {
          return this.reportingService.getObservabilityMetrics(...);
        }
        return [];
      })
    )
    .subscribe(...)
  ```
- **Controls:**
  - Toggle button to enable/disable auto-refresh
  - Manual refresh button
  - Visual indicator showing refresh status
  - Last updated timestamp

## File Structure

```
frontend/src/app/components/
├── observability-dashboard.component.ts       # Main component logic
├── observability-dashboard.component.html     # Template with Material components
├── observability-dashboard.component.css      # Comprehensive styling
└── observability-dashboard.component.spec.ts  # Unit tests
```

## Dependencies

### Angular Modules Used
- `@angular/material` - UI components (card, icon, button, table, etc.)
- `@angular/forms` - FormsModule for ngModel binding
- `chart.js` (v4.4.0) - Chart visualization library
- `rxjs` - Reactive programming (interval, Subject, operators)

### Material Components
- `mat-card` - Metric section containers
- `mat-icon` - Visual indicators and icons
- `mat-button` - Action buttons
- `mat-form-field` & `mat-input` - Date range inputs
- `mat-progress-bar` - Quota usage bars
- `mat-progress-spinner` - Loading indicator
- `mat-table` - Data tables
- `mat-chip` - Channel and error code labels
- `mat-list` - Error code summaries
- `mat-menu` - Export dropdown menu
- `mat-tooltip` - Hover information

## API Integration

### Endpoint
`GET /api/v1/reports/observability/metrics`

### Query Parameters
- `from` (optional): Start date (yyyy-MM-dd)
- `to` (optional): End date (yyyy-MM-dd)  
- `orgId` (optional): Organization ID (defaults to tenant context)

### Response Interface
```typescript
interface ObservabilityMetrics {
  queueMetrics: {
    queueDepthByChannel: { [channel: string]: number };
    totalQueued: number;
  };
  latencyMetrics: {
    latencyByChannel: {
      [channel: string]: {
        p50: number;
        p95: number;
        p99: number;
        average: number;
      };
    };
  };
  failureMetrics: {
    failuresByChannel: { [channel: string]: number };
    failuresByErrorCode: { [errorCode: string]: number };
    failureTrend: TimeSeriesDataPoint[];
    overallFailureRate: number;
  };
  dlqMetrics: {
    dlqSize: number;
    dlqSizeByChannel: { [channel: string]: number };
    recentDlqMessages: DlqMessage[];
    alertThresholdExceeded: boolean;
    alertThreshold: number;
  };
  quotaMetrics: {
    quotaByChannel: {
      [channel: string]: {
        used: number;
        limit: number;
        usagePercentage: number;
        period: string;
      };
    };
  };
  timestamp: string;
}
```

## Chart Configuration

### Color Palette
```typescript
private getChannelColor(index: number, alpha: number = 1): string {
  const colors = [
    [54, 162, 235],   // Blue
    [75, 192, 192],   // Teal
    [255, 206, 86],   // Yellow
    [153, 102, 255],  // Purple
    [255, 159, 64],   // Orange
    [255, 99, 132],   // Red
    [201, 203, 207],  // Grey
    [54, 235, 162],   // Green
  ];
  const color = colors[index % colors.length];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}
```

### Chart Options
All charts use:
- `responsive: true`
- `maintainAspectRatio: false`
- Custom tooltips
- Axis labels and titles
- Legend positioning

## Export Functionality

### CSV Export
- Downloads metrics in CSV format
- Structured tabular data
- Suitable for Excel/Google Sheets
- Includes all metric categories

### JSON Export
- Complete metrics object
- Preserves data structure
- Suitable for programmatic processing
- Pretty-printed format

## Navigation

### Route
`/observability`

### Menu Item
Added to app-layout navigation:
```html
<a mat-list-item routerLink="/observability">
  <mat-icon>analytics</mat-icon>
  <span>Observabilité</span>
</a>
```

## Responsive Design

### Breakpoints
- **Desktop (> 1024px):** Full layout with side-by-side charts
- **Tablet (768-1024px):** Stacked charts, responsive grids
- **Mobile (< 768px):** Single column, vertical navigation

### Mobile Optimizations
- Stacked summary cards
- Full-width date inputs
- Collapsed navigation menu
- Touch-friendly buttons
- Reduced chart heights

## Performance Optimizations

### Lazy Loading
Chart.js library loaded on-demand:
```typescript
private async loadChartJs(): Promise<void> {
  try {
    await import('chart.js/auto');
  } catch (error) {
    console.error('Failed to load Chart.js:', error);
  }
}
```

### Data Management
- Limited historical data points (60 max)
- Efficient array operations with shift()
- Chart destruction on update to prevent memory leaks
- Subscription cleanup with takeUntil

### Rendering
- Canvas-based charts (hardware accelerated)
- Debounced window resize handling
- Conditional rendering with *ngIf

## Testing

### Test Coverage
- Component initialization
- Metrics loading (success and error)
- Auto-refresh toggle
- Date range changes
- Export functionality (CSV and JSON)
- Helper methods (getChannelNames, getQueueDepth, etc.)
- DLQ status determination
- Quota status classification
- Chart lifecycle management
- Cleanup on destroy

### Running Tests
```bash
cd frontend
npm test -- observability-dashboard.component.spec.ts
```

## Accessibility Features

### ARIA Labels
All interactive elements have descriptive ARIA labels:
- Buttons
- Navigation links
- Form inputs
- Menu items

### Semantic HTML
- Proper heading hierarchy
- Table structure with headers
- List semantics
- Main content area

### Keyboard Navigation
- Tab navigation support
- Enter/Space for button activation
- Escape to close menus
- Focus indicators

### Color Contrast
- WCAG AA compliant
- High contrast mode support
- Color-blind friendly palette

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. **Historical Data:** Limited to in-memory storage (60 points). For long-term trends, query different date ranges.
2. **Real-time Updates:** 30-second refresh interval. Not true real-time (websocket).
3. **Large Datasets:** Chart performance may degrade with many channels (10+).
4. **Time Zones:** Displays in browser's local timezone.

## Future Enhancements

1. **WebSocket Integration:** True real-time updates without polling
2. **Customizable Thresholds:** User-configurable warning/critical levels
3. **Alert Notifications:** Browser notifications for critical events
4. **Historical Trends:** Long-term trend analysis with backend storage
5. **Comparative Views:** Compare metrics across date ranges
6. **Drill-down:** Click charts to view detailed message data
7. **Custom Dashboards:** User-defined metric layouts
8. **PDF Export:** Generate PDF reports of metrics

## Troubleshooting

### Charts Not Rendering
- Check browser console for Chart.js loading errors
- Verify canvas elements exist in DOM
- Ensure metrics data is present

### Auto-refresh Not Working
- Check auto-refresh toggle state
- Verify network connectivity
- Check backend API availability

### Export Not Working
- Check network tab for API errors
- Verify blob download permissions
- Check for popup blockers

## Related Files

- `frontend/src/app/services/reporting-api.service.ts` - API service with interfaces
- `frontend/src/app/app-routing.module.ts` - Route configuration
- `frontend/src/app/app.module.ts` - Module declarations
- `frontend/src/app/layout/app-layout/app-layout.component.html` - Navigation menu
- `backend/src/main/java/com/example/backend/controller/ReportingController.java` - Backend API

## Documentation

See `frontend/src/app/components/README.md` for component overview and usage examples.
