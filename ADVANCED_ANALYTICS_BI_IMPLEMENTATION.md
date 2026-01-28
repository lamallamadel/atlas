# Advanced Analytics and Business Intelligence Implementation

## Overview

This implementation provides a comprehensive analytics and business intelligence platform with:
- Metabase integration with SSO using JWT authentication
- Embedded BI dashboards with signed URLs
- Custom analytical views (cohort analysis, funnel visualization, agent performance, market trends, revenue forecasting)
- Scheduled report delivery via email
- Data warehouse ETL jobs using Spring Batch
- Custom SQL query builder for power users
- Chart.js dashboards with drill-down capability

## Architecture

### Components

1. **MetabaseDashboardService** - Handles Metabase authentication and embed URL generation
2. **AdvancedAnalyticsService** - Provides analytical views and calculations
3. **ScheduledReportService** - Manages automated report generation and delivery
4. **DataWarehouseETLService** - Extracts and aggregates metrics into analytics database
5. **CustomQueryService** - Allows power users to create and execute custom SQL queries

### Database Schema

#### Analytics Metrics Table
```sql
CREATE TABLE analytics_metric (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    metric_date DATE NOT NULL,
    metric_value DECIMAL(20, 4),
    count_value BIGINT,
    dimensions JSONB,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL
);
```

#### Scheduled Reports Table
```sql
CREATE TABLE scheduled_report (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    format VARCHAR(50) NOT NULL,
    recipients JSONB,
    parameters JSONB,
    next_run_at TIMESTAMP,
    enabled BOOLEAN DEFAULT true
);
```

#### Custom Queries Table
```sql
CREATE TABLE custom_query (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sql_query TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    execution_count BIGINT DEFAULT 0
);
```

## Setup

### 1. Start Metabase

```bash
cd infra
docker-compose -f docker-compose-analytics.yml up -d
```

### 2. Configure Metabase

1. Access Metabase at http://localhost:3000
2. Complete initial setup
3. Add your application database as a data source
4. Generate embedding secret key:
   - Go to Settings > Admin > Embedding
   - Enable embedding
   - Copy the secret key

### 3. Configure Application

Add to `application.yml`:

```yaml
metabase:
  url: http://localhost:3000
  secret-key: ${METABASE_SECRET_KEY}
  site-url: http://localhost:4200
```

Set environment variable:
```bash
export METABASE_SECRET_KEY="your-secret-key-from-metabase"
```

### 4. Run Database Migrations

```bash
cd backend
mvn flyway:migrate
```

## Usage

### Embedding Metabase Dashboards

**Backend:**
```java
@Autowired
private MetabaseDashboardService metabaseService;

MetabaseEmbedRequest request = new MetabaseEmbedRequest();
request.setDashboardId("1");
request.setParams(Map.of("org_id", "default"));
request.setExpirationMinutes(60L);

MetabaseEmbedResponse response = metabaseService.generateEmbedUrl(request);
```

**Frontend:**
```typescript
this.analyticsService.generateMetabaseEmbedUrl({
  dashboardId: '1',
  params: { org_id: 'default' },
  expirationMinutes: 60
}).subscribe(response => {
  this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.embedUrl);
});
```

```html
<iframe [src]="embedUrl" frameborder="0" width="100%" height="800px"></iframe>
```

### Custom Analytical Views

#### Cohort Analysis
```typescript
this.analyticsService.getCohortAnalysis(startDate, endDate).subscribe(data => {
  // Displays lead conversion rates by acquisition month
  this.renderChart(data);
});
```

#### Funnel Visualization
```typescript
this.analyticsService.getFunnelVisualization(startDate, endDate).subscribe(data => {
  // Shows drop-off rates between pipeline stages
  this.renderFunnelChart(data);
});
```

#### Agent Performance Leaderboard
```typescript
this.analyticsService.getAgentPerformanceLeaderboard(startDate, endDate).subscribe(data => {
  // Displays agent metrics: conversion rates, response times, deal counts
  this.renderLeaderboard(data);
});
```

#### Market Trends
```typescript
this.analyticsService.getPropertyMarketTrends(startDate, endDate).subscribe(data => {
  // Shows average prices and demand by location over time
  this.renderTrendsChart(data);
});
```

#### Revenue Forecast
```typescript
this.analyticsService.getRevenueForecast(6).subscribe(data => {
  // Provides 6-month forecast using historical seasonality patterns
  this.renderForecastChart(data);
});
```

### Scheduled Reports

#### Create Scheduled Report
```typescript
const request: ScheduledReportRequest = {
  name: 'Weekly Sales Report',
  reportType: 'SALES_FUNNEL',
  frequency: 'WEEKLY',
  format: 'PDF',
  recipients: ['manager@example.com', 'team@example.com'],
  dayOfWeek: 'MONDAY',
  hour: 8,
  enabled: true
};

this.analyticsService.createScheduledReport(request).subscribe();
```

Reports are automatically executed by the scheduler and emailed to recipients as PDF attachments.

### Custom SQL Queries

#### Create Custom Query
```typescript
const query: CustomQuery = {
  name: 'High Value Leads',
  description: 'Leads with estimated value > 500k',
  sqlQuery: 'SELECT * FROM dossier WHERE estimated_value > 500000',
  category: 'leads',
  isPublic: false
};

this.analyticsService.createCustomQuery(query).subscribe();
```

#### Execute Query (After Approval)
```typescript
this.analyticsService.executeCustomQuery(queryId, {}).subscribe(results => {
  // Display results in table
});
```

**Security:** Only SELECT queries are allowed. Queries must be approved by an admin before execution.

### Data Warehouse ETL

ETL jobs run automatically:
- **Daily ETL** - Runs at 2:00 AM, extracts daily metrics
- **Weekly ETL** - Runs Monday at 3:00 AM, aggregates weekly cohorts and trends

Manual execution:
```java
@Autowired
private DataWarehouseETLService etlService;

// Extract metrics for specific date
etlService.extractLeadMetrics(LocalDate.now().minusDays(1));
etlService.extractConversionMetrics(LocalDate.now().minusDays(1));
etlService.extractRevenueMetrics(LocalDate.now().minusDays(1));
```

### Chart.js Integration with Drill-Down

```typescript
renderCohortChart(): void {
  const config: ChartConfiguration = {
    type: 'line',
    data: { /* ... */ },
    options: {
      onClick: (event, elements) => {
        if (elements.length > 0) {
          // Drill down to detailed Metabase view
          this.drillDownToCohort(elements[0].index);
        }
      }
    }
  };
  
  this.chart = new Chart(canvas, config);
}

drillDownToCohort(index: number): void {
  const cohortMonth = this.data[index].date;
  
  // Generate Metabase question embed with filters
  this.analyticsService.generateQuestionEmbedUrl('2', { 
    cohort_month: cohortMonth 
  }).subscribe(response => {
    this.detailUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.embedUrl);
  });
}
```

## API Endpoints

### Analytics
- `POST /api/v1/analytics/metabase/embed` - Generate dashboard embed URL
- `POST /api/v1/analytics/metabase/question/{id}/embed` - Generate question embed URL
- `GET /api/v1/analytics/metabase/sso-token` - Get SSO authentication token
- `GET /api/v1/analytics/cohort-analysis` - Get cohort analysis
- `GET /api/v1/analytics/funnel` - Get funnel visualization
- `GET /api/v1/analytics/agent-performance` - Get agent leaderboard
- `GET /api/v1/analytics/market-trends` - Get property market trends
- `GET /api/v1/analytics/revenue-forecast` - Get revenue forecast

### Scheduled Reports
- `POST /api/v1/scheduled-reports` - Create scheduled report
- `GET /api/v1/scheduled-reports` - List scheduled reports
- `GET /api/v1/scheduled-reports/{id}` - Get report details
- `PUT /api/v1/scheduled-reports/{id}` - Update report
- `DELETE /api/v1/scheduled-reports/{id}` - Delete report

### Custom Queries
- `POST /api/v1/custom-queries` - Create custom query
- `GET /api/v1/custom-queries` - List queries
- `GET /api/v1/custom-queries/{id}` - Get query
- `PUT /api/v1/custom-queries/{id}` - Update query
- `DELETE /api/v1/custom-queries/{id}` - Delete query
- `POST /api/v1/custom-queries/{id}/execute` - Execute query
- `POST /api/v1/custom-queries/{id}/approve` - Approve query (admin only)
- `GET /api/v1/custom-queries/public` - List public queries

## Frontend Components

### AnalyticsDashboardComponent
Main analytics dashboard with tabbed interface:
- Overview tab with Chart.js visualizations
- Metabase dashboard tab with embedded iframe
- Drill-down tab for detailed views

### CustomQueryBuilderComponent
SQL query builder interface:
- Query editor with syntax validation
- Query approval workflow
- Results table with export to CSV
- Public query library

### ScheduledReportsComponent
Report scheduling interface:
- Report configuration form
- Frequency settings (daily/weekly/monthly/quarterly)
- Recipient management
- Report history and status

## Security Considerations

1. **Metabase JWT**: Tokens expire after 10-60 minutes (configurable)
2. **SQL Injection**: Custom queries are validated - only SELECT allowed, no multiple statements
3. **Query Approval**: Admin approval required before executing custom queries
4. **Org Isolation**: All queries and reports are scoped to organization
5. **Role-Based Access**: Analytics endpoints require ADMIN or PRO roles

## Performance Optimization

1. **Analytics Metrics Table**: Indexed on `(org_id, metric_type, metric_date)`
2. **ETL Jobs**: Run during off-peak hours (2-3 AM)
3. **Chart Lazy Loading**: Charts rendered only when tab is visible
4. **Query Result Limits**: Custom queries limited to 1000 rows
5. **Metabase Caching**: Metabase internally caches query results

## Monitoring

Track ETL job execution:
```sql
SELECT metric_type, metric_date, COUNT(*) 
FROM analytics_metric 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY metric_type, metric_date
ORDER BY metric_date DESC;
```

Monitor scheduled reports:
```sql
SELECT name, frequency, last_status, last_run_at, next_run_at
FROM scheduled_report
WHERE enabled = true
ORDER BY next_run_at;
```

## Troubleshooting

### Metabase Embed Not Working
1. Verify secret key matches between Metabase and application
2. Check CORS settings in Metabase
3. Ensure dashboard has "Enable embedding" enabled

### ETL Jobs Not Running
1. Check Quartz scheduler status
2. Verify database connection
3. Check application logs for errors

### Custom Queries Failing
1. Ensure query is approved
2. Verify SQL syntax (SELECT only)
3. Check query execution time limits

## Next Steps

1. Add more analytical views (customer segmentation, churn prediction)
2. Implement real-time analytics using WebSockets
3. Add data quality monitoring
4. Create ML-based anomaly detection
5. Implement A/B testing analytics
