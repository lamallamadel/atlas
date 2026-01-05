# KPI and Reporting Module

## Overview

Comprehensive KPI and reporting module providing detailed analytics and visualizations for lead management metrics.

## Features

### Backend (Spring Boot)

#### ReportingService
Calculates comprehensive metrics including:
- **Conversion Rate by Source**: Tracks lead-to-won conversion rates segmented by source (web, mobile, phone, email, referral, walk-in, social media)
- **Average Response Time**: Measures time between dossier creation and first outbound message (in hours)
- **Appointment Show Rate**: Percentage of completed appointments vs. cancelled
- **Pipeline Velocity**: Average days from dossier creation to won status
- **Time Series Data**: Daily dossier creation and conversion trends

#### REST Endpoints

##### GET /api/v1/reports/kpi
Retrieves comprehensive KPI metrics with optional date filtering.

**Query Parameters:**
- `from` (optional): Start date (ISO format: yyyy-MM-dd)
- `to` (optional): End date (ISO format: yyyy-MM-dd)
- `orgId` (optional): Organization ID for filtering

**Response Structure:**
```json
{
  "conversionRateBySource": [
    {
      "source": "WEB",
      "totalDossiers": 100,
      "wonDossiers": 25,
      "conversionRate": 25.0
    }
  ],
  "averageResponseTimeHours": 2.5,
  "appointmentShowRate": 85.0,
  "pipelineVelocityDays": 14.5,
  "dossierCreationTimeSeries": [
    {
      "date": "2024-01-01",
      "value": 5
    }
  ],
  "conversionTimeSeries": [
    {
      "date": "2024-01-15",
      "value": 2
    }
  ]
}
```

##### GET /api/v1/reports/pipeline-summary
Retrieves pipeline stage distribution and overall metrics.

**Query Parameters:**
- `orgId` (optional): Organization ID for filtering

**Response Structure:**
```json
{
  "stageMetrics": [
    {
      "stage": "NEW",
      "count": 50,
      "percentage": 20.0
    }
  ],
  "totalDossiers": 250,
  "overallConversionRate": 18.5
}
```

### Frontend (Angular)

#### ReportsDashboardComponent
Full-featured dashboard with interactive visualizations located at `/reports`.

**Features:**
- Date range filtering
- Real-time KPI cards showing:
  - Average Response Time
  - Appointment Show Rate
  - Pipeline Velocity
  - Overall Conversion Rate
- Interactive charts:
  - Bar chart: Conversion rates by source
  - Horizontal bar chart: Pipeline funnel
  - Line chart: Dossier creation time series
  - Line chart: Conversion time series
- Detailed data tables:
  - Conversion details by source
  - Pipeline stage distribution

#### Visualizations (Chart.js)

1. **Conversion Rate by Source**: Vertical bar chart comparing conversion rates across different lead sources
2. **Pipeline Funnel**: Horizontal bar chart showing dossier counts at each pipeline stage
3. **Dossier Creation Over Time**: Line chart tracking daily dossier creation trends
4. **Conversions Over Time**: Line chart tracking daily conversion trends

## Installation

### Backend
No additional dependencies required - uses existing Spring Boot stack.

### Frontend
1. Install Chart.js dependencies:
```bash
npm install chart.js ng2-charts
```

2. The module is already registered in `app.module.ts` with:
   - `NgChartsModule` for Chart.js integration
   - `MatProgressSpinnerModule` for loading indicators
   - `ReportsDashboardComponent` declaration

3. Navigation link added to sidebar menu

## Usage

### Accessing the Dashboard
Navigate to `/reports` in the application to view the KPI dashboard.

### API Usage Examples

**Get KPI report for last 30 days:**
```
GET /api/v1/reports/kpi?from=2024-01-01&to=2024-01-31
```

**Get pipeline summary:**
```
GET /api/v1/reports/pipeline-summary
```

**Get KPI report for specific organization:**
```
GET /api/v1/reports/kpi?from=2024-01-01&to=2024-01-31&orgId=org-123
```

## Data Models

### DTOs Created
- `ConversionRateBySourceDto`: Conversion metrics by source
- `PipelineStageMetricsDto`: Pipeline stage statistics
- `TimeSeriesDataPointDto`: Time series data point
- `KpiReportResponse`: Comprehensive KPI report
- `PipelineSummaryResponse`: Pipeline summary

## Technical Details

### Backend Calculations

1. **Conversion Rate**: (Won Dossiers / Total Dossiers) * 100
2. **Response Time**: Duration between dossier creation and first outbound message
3. **Show Rate**: (Completed Appointments / Total Concluded Appointments) * 100
4. **Pipeline Velocity**: Average duration from dossier creation to won status

### Frontend Architecture

- Service layer: `ReportingApiService` handles API calls
- Component: `ReportsDashboardComponent` manages state and chart data
- Responsive grid layout with mobile support
- Real-time chart updates on date filter changes

## Future Enhancements

Potential improvements:
- Export reports to PDF/Excel
- Scheduled report delivery
- Custom metric configurations
- Comparison views (period-over-period)
- User-specific performance metrics
- Advanced filtering options
