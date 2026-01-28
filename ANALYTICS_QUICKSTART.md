# Analytics & BI - Quick Start Guide

## Prerequisites
- Java 17
- Maven 3.6+
- Node.js 16+
- Docker & Docker Compose

## Quick Setup (5 minutes)

### 1. Start Metabase
```bash
cd infra
docker-compose -f docker-compose-analytics.yml up -d
```

Wait for Metabase to start (about 1-2 minutes), then access http://localhost:3000

### 2. Configure Metabase
1. Complete initial setup wizard
2. Add your PostgreSQL database:
   - Host: `host.docker.internal` (or your database host)
   - Port: `5432`
   - Database: `your_database_name`
   - Username/Password: your credentials
3. Go to Settings > Admin > Embedding
4. Enable embedding and copy the secret key

### 3. Configure Backend
Add to `backend/src/main/resources/application.yml`:
```yaml
metabase:
  url: http://localhost:3000
  secret-key: YOUR_METABASE_SECRET_KEY_HERE
  site-url: http://localhost:4200
```

### 4. Run Migrations
```bash
cd backend
mvn flyway:migrate -Plocal
```

### 5. Start Backend
```bash
cd backend
mvn spring-boot:run
```

### 6. Start Frontend
```bash
cd frontend
npm start
```

## Access the Analytics Dashboard

1. Login to the application at http://localhost:4200
2. Navigate to **Analytics** in the main menu
3. You'll see:
   - **Overview Tab**: Chart.js visualizations
   - **Metabase Dashboard Tab**: Embedded BI dashboard
   - **Custom Queries**: SQL query builder
   - **Scheduled Reports**: Report scheduling interface

## Creating Your First Dashboard

### In Metabase:
1. Click "New" > "Dashboard"
2. Add questions/cards to the dashboard
3. Save the dashboard
4. Note the dashboard ID from the URL (e.g., `/dashboard/1` = ID is `1`)

### In the Application:
```typescript
// Generate embed URL for dashboard ID 1
this.analyticsService.generateMetabaseEmbedUrl({
  dashboardId: '1',
  params: { org_id: 'default' },
  expirationMinutes: 60
}).subscribe(response => {
  this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.embedUrl);
});
```

```html
<iframe [src]="embedUrl" width="100%" height="800px" frameborder="0"></iframe>
```

## Creating a Scheduled Report

1. Navigate to **Scheduled Reports**
2. Click "Schedule New Report"
3. Fill in the form:
   - Name: "Weekly Sales Report"
   - Report Type: "SALES_FUNNEL"
   - Frequency: "WEEKLY"
   - Day of Week: "MONDAY"
   - Hour: 8 (8 AM)
   - Format: "PDF"
   - Recipients: email addresses separated by commas
4. Click "Save"

The report will automatically run every Monday at 8 AM and email PDF attachments to the recipients.

## Creating a Custom Query

1. Navigate to **Custom Queries**
2. Click "New Query"
3. Enter query details:
   ```sql
   SELECT 
       status, 
       COUNT(*) as count,
       AVG(estimated_value) as avg_value
   FROM dossier
   WHERE created_at > NOW() - INTERVAL '30 days'
   GROUP BY status
   ORDER BY count DESC
   ```
4. Save the query
5. Request approval from an admin
6. Once approved, execute the query and view results

## Using Pre-built Analytics Views

### Cohort Analysis
```typescript
this.analyticsService.getCohortAnalysis(
  '2024-01-01', // start date
  '2024-03-31'  // end date
).subscribe(data => {
  console.log('Conversion rates by cohort:', data);
});
```

### Sales Funnel
```typescript
this.analyticsService.getFunnelVisualization(
  '2024-01-01',
  '2024-03-31'
).subscribe(data => {
  console.log('Funnel stages with drop-off:', data);
});
```

### Agent Performance
```typescript
this.analyticsService.getAgentPerformanceLeaderboard(
  '2024-01-01',
  '2024-03-31'
).subscribe(data => {
  console.log('Top performing agents:', data);
});
```

### Revenue Forecast
```typescript
this.analyticsService.getRevenueForecast(6) // 6 months
  .subscribe(data => {
    console.log('Revenue projection:', data);
  });
```

## ETL Jobs

The system automatically runs:
- **Daily ETL**: Every day at 2:00 AM
  - Extracts daily leads, conversions, revenue metrics
- **Weekly ETL**: Every Monday at 3:00 AM
  - Aggregates cohort analysis, market trends

View aggregated metrics:
```sql
SELECT * FROM analytics_metric 
WHERE org_id = 'default' 
  AND metric_date > NOW() - INTERVAL '7 days'
ORDER BY metric_date DESC;
```

## API Endpoints

### Generate Metabase Embed URL
```bash
curl -X POST http://localhost:8080/api/v1/analytics/metabase/embed \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboardId": "1",
    "params": {"org_id": "default"},
    "expirationMinutes": 60
  }'
```

### Get Cohort Analysis
```bash
curl "http://localhost:8080/api/v1/analytics/cohort-analysis?startDate=2024-01-01&endDate=2024-03-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Scheduled Report
```bash
curl -X POST http://localhost:8080/api/v1/scheduled-reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Sales Report",
    "reportType": "SALES_FUNNEL",
    "frequency": "WEEKLY",
    "format": "PDF",
    "recipients": ["manager@example.com"],
    "dayOfWeek": "MONDAY",
    "hour": 8,
    "enabled": true
  }'
```

### Execute Custom Query
```bash
curl -X POST http://localhost:8080/api/v1/custom-queries/1/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Troubleshooting

### Metabase not accessible
```bash
docker-compose -f docker-compose-analytics.yml logs metabase
```

### Database connection failed
Check your database host. For Docker Desktop on Windows/Mac, use `host.docker.internal` instead of `localhost`.

### ETL jobs not running
Check application logs:
```bash
tail -f backend/logs/application.log | grep ETL
```

### Custom query execution fails
Ensure query is:
1. Approved by admin
2. Starts with SELECT
3. Contains no forbidden operations (DROP, DELETE, UPDATE, etc.)

## Next Steps

1. **Create custom dashboards in Metabase** for your specific needs
2. **Set up scheduled reports** for regular business reviews
3. **Build custom queries** for ad-hoc analysis
4. **Integrate drill-down** from Chart.js to Metabase views
5. **Monitor ETL jobs** and analytics metrics quality

## Resources

- Full documentation: `ADVANCED_ANALYTICS_BI_IMPLEMENTATION.md`
- Metabase documentation: https://www.metabase.com/docs/
- Chart.js documentation: https://www.chartjs.org/docs/
- Spring Batch: https://spring.io/projects/spring-batch

## Support

For issues or questions:
1. Check the logs: `backend/logs/application.log`
2. Review Metabase logs: `docker-compose -f docker-compose-analytics.yml logs`
3. Verify configuration in `application.yml`
