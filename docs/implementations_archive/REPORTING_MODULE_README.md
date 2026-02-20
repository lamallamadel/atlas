# Advanced KPI and Reporting Module

## Overview

Comprehensive advanced reporting module providing detailed analytics, KPI metrics, conversion funnel analysis, agent performance tracking, and revenue forecasting with 30/60/90 day projections. All expensive calculations are cached with 1-hour TTL for optimal performance.

## Implementation Summary

### New Features Implemented

1. **Conversion Funnel Analysis by Source** - Breakdown of funnel metrics by lead source (WEBSITE, REFERRAL, PHONE, etc.)
2. **Conversion Funnel Analysis by Time Period** - Funnel metrics segmented by DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
3. **Detailed Agent Performance Metrics** - Individual agent metrics with dedicated endpoint
4. **Revenue Forecast with Projections** - 30/60/90 day revenue projections with conservative/optimistic scenarios
5. **Enhanced Caching** - All analytics cached with 1-hour TTL for optimal performance

### Files Modified/Created

#### Modified Files:
- `backend/src/main/java/com/example/backend/service/ReportingService.java` - Added new advanced reporting methods
- `backend/src/main/java/com/example/backend/controller/ReportingController.java` - Added new REST endpoints
- `backend/src/main/java/com/example/backend/config/CacheConfig.java` - Added new cache configurations
- `backend/src/main/java/com/example/backend/dto/RevenueForecastResponse.java` - Added projection DTOs
- `backend/src/main/java/com/example/backend/dto/FunnelAnalysisResponse.java` - Added time period support
- `REPORTING_MODULE_README.md` - Comprehensive documentation

### New Service Methods

1. `generateConversionFunnelBySource()` - Cached, 1-hour TTL
2. `generateConversionFunnelByTimePeriod()` - Cached, 1-hour TTL  
3. `generateDetailedAgentMetrics()` - Cached, 1-hour TTL
4. `generateRevenueForecastWithProjections()` - Cached, 1-hour TTL
5. `calculateRevenueProjection()` - Helper method for projections
6. `calculateFunnelMetricsForDossiers()` - Reusable funnel calculation
7. `getPeriodKey()` - Time period formatting helper

### New REST Endpoints

1. `GET /api/v1/reports/funnel-analysis/by-source` - Funnel by source
2. `GET /api/v1/reports/funnel-analysis/by-period` - Funnel by time period
3. `GET /api/v1/reports/agent-performance/{agentId}` - Individual agent metrics
4. `GET /api/v1/reports/revenue-forecast/projections` - Forecast with projections

## Features

### Backend (Spring Boot)

#### Core Services

##### ReportingService
Advanced analytics service with comprehensive metrics including:
- **Conversion Rate Analysis**: NEW→WON rates by source and time period
- **Agent Performance Metrics**: Response time, messages sent, appointments, conversion rates
- **Revenue Forecasting**: Historical conversion rates + pipeline value with 30/60/90 day projections
- **Custom JPQL Queries**: Efficient aggregations with date range filtering
- **Caching**: @Cacheable with 1-hour TTL to prevent expensive repeated calculations

### REST Endpoints

#### 1. GET /api/v1/reports/kpi
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
      "source": "WEBSITE",
      "totalDossiers": 100,
      "wonDossiers": 25,
      "conversionRate": 25.0
    }
  ],
  "averageResponseTimeHours": 2.5,
  "appointmentShowRate": 85.0,
  "pipelineVelocityDays": 14.5,
  "dossierCreationTimeSeries": [...],
  "conversionTimeSeries": [...]
}
```

#### 2. GET /api/v1/reports/pipeline-summary
Pipeline stage distribution and overall metrics.

**Caching**: 30-minute TTL

#### 3. GET /api/v1/reports/funnel-analysis
Conversion funnel analysis with NEW→WON rates by source.

**Caching**: 1-hour TTL

#### 4. GET /api/v1/reports/funnel-analysis/by-source (NEW)
Conversion funnel metrics broken down by lead source.

**Response Structure:**
```json
{
  "WEBSITE": {
    "newCount": 150,
    "qualifyingCount": 90,
    "qualifiedCount": 45,
    "appointmentCount": 30,
    "wonCount": 15,
    "lostCount": 20,
    "newToQualifyingRate": 60.0,
    "qualifyingToQualifiedRate": 50.0,
    "qualifiedToAppointmentRate": 66.67,
    "appointmentToWonRate": 50.0,
    "overallConversionRate": 10.0
  },
  "REFERRAL": {...}
}
```

**Caching**: 1-hour TTL with key `conversionFunnelBySource`

#### 5. GET /api/v1/reports/funnel-analysis/by-period (NEW)
Conversion funnel metrics broken down by time period.

**Query Parameters:**
- `periodType`: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY (default: MONTHLY)

**Period Formats:**
- DAILY: `2025-01-15`
- WEEKLY: `2025-W3`
- MONTHLY: `2025-01`
- QUARTERLY: `2025-Q1`
- YEARLY: `2025`

**Caching**: 1-hour TTL with key `conversionFunnelByPeriod`

#### 6. GET /api/v1/reports/agent-performance
Detailed agent performance metrics for all agents.

**Response Structure:**
```json
{
  "agentMetrics": [
    {
      "agentId": "AGENT123",
      "averageResponseTimeHours": 2.3,
      "messagesSent": 145,
      "appointmentsScheduled": 23,
      "dossiersAssigned": 42,
      "dossiersWon": 15,
      "winRate": 35.71
    }
  ],
  "aggregateMetrics": {
    "averageResponseTimeHours": 2.8,
    "totalMessagesSent": 1450,
    "totalAppointmentsScheduled": 230,
    "totalDossiersAssigned": 420,
    "totalDossiersWon": 150,
    "overallWinRate": 35.71
  }
}
```

**Caching**: 1-hour TTL

#### 7. GET /api/v1/reports/agent-performance/{agentId} (NEW)
Detailed performance metrics for a specific agent.

**Path Parameters:**
- `agentId`: Agent ID

**Caching**: 1-hour TTL with key `agentMetricsDetailed`

#### 8. GET /api/v1/reports/revenue-forecast
Revenue forecast based on pipeline value and historical conversion rates.

**Response Structure:**
```json
{
  "totalPipelineValue": 2500000.00,
  "forecastedRevenue": 875000.00,
  "averageConversionRate": 35.0,
  "totalOpportunities": 42,
  "pipelineByStage": [
    {
      "stage": "QUALIFIED",
      "count": 15,
      "totalValue": 750000.00,
      "weightedValue": 375000.00,
      "weightPercentage": 50.0
    }
  ],
  "forecastBySource": [
    {
      "source": "WEBSITE",
      "opportunityCount": 20,
      "totalValue": 1000000.00,
      "historicalConversionRate": 25.0,
      "forecastedRevenue": 250000.00
    }
  ]
}
```

**Stage Weights:**
- NEW: 10%
- QUALIFYING: 25%
- QUALIFIED: 50%
- APPOINTMENT: 75%
- WON: 100%

**Caching**: 1-hour TTL

#### 9. GET /api/v1/reports/revenue-forecast/projections (NEW)
Revenue forecast with 30/60/90 day projections.

**Response Structure:**
```json
{
  "totalPipelineValue": 2500000.00,
  "forecastedRevenue": 875000.00,
  "averageConversionRate": 35.0,
  "totalOpportunities": 42,
  "projection30Days": {
    "days": 30,
    "estimatedRevenue": 291666.67,
    "conservativeRevenue": 204166.67,
    "optimisticRevenue": 379166.67,
    "expectedClosedDeals": 5
  },
  "projection60Days": {
    "days": 60,
    "estimatedRevenue": 583333.33,
    "conservativeRevenue": 408333.33,
    "optimisticRevenue": 758333.33,
    "expectedClosedDeals": 10
  },
  "projection90Days": {
    "days": 90,
    "estimatedRevenue": 875000.00,
    "conservativeRevenue": 612500.00,
    "optimisticRevenue": 1137500.00,
    "expectedClosedDeals": 15
  },
  "pipelineByStage": [...],
  "forecastBySource": [...]
}
```

**Projection Calculation:**
- Time factor: `days / 90.0`
- Adjusted conversion rate: `avgConversionRate * timeFactor`
- Estimated revenue: `totalPipelineValue * adjustedConversionRate / 100`
- Conservative: `estimatedRevenue * 0.7`
- Optimistic: `estimatedRevenue * 1.3`

**Caching**: 1-hour TTL with key `revenueProjections`

#### 10. GET /api/v1/reports/analytics
Comprehensive analytics dashboard data.

**Response**: Combined data from multiple endpoints

## Caching Strategy

All reporting endpoints use Redis caching with 1-hour TTL:

| Cache Name | TTL | Purpose |
|------------|-----|---------|
| `pipelineSummary` | 30 minutes | Pipeline overview |
| `funnelAnalysis` | 1 hour | Overall funnel |
| `conversionFunnelBySource` | 1 hour | Source-based funnel |
| `conversionFunnelByPeriod` | 1 hour | Time-based funnel |
| `agentPerformance` | 1 hour | Aggregate agent metrics |
| `agentMetricsDetailed` | 1 hour | Individual agent metrics |
| `revenueForecast` | 1 hour | Basic forecast |
| `revenueProjections` | 1 hour | Forecast with projections |

**Cache Key Format**: `{cacheName}::{orgId}_{from}_{to}_{additionalParams}`

## Custom JPQL Queries

### Conversion Rates by Source
```java
@Query("SELECT d.source as source, COUNT(d) as total, " +
       "SUM(CASE WHEN d.status = 'WON' THEN 1 ELSE 0 END) as won " +
       "FROM Dossier d " +
       "WHERE d.annonceId IS NOT NULL " +
       "AND d.orgId = :orgId " +
       "AND d.createdAt >= :startDate " +
       "GROUP BY d.source")
List<Object[]> getConversionRatesBySource(@Param("orgId") String orgId, 
                                          @Param("startDate") LocalDateTime startDate);
```

### Pipeline Metrics by Stage
```java
@Query("SELECT d.status as status, COUNT(d) as count, " +
       "COALESCE(SUM(a.price), 0) as totalValue " +
       "FROM Dossier d " +
       "LEFT JOIN Annonce a ON d.annonceId = a.id AND a.orgId = :orgId " +
       "WHERE d.orgId = :orgId " +
       "AND d.status NOT IN ('WON', 'LOST') " +
       "GROUP BY d.status")
List<Object[]> getPipelineMetricsByStage(@Param("orgId") String orgId);
```

## Usage Examples

### Get Conversion Funnel by Source
```bash
curl -X GET "http://localhost:8080/api/v1/reports/funnel-analysis/by-source?from=2025-01-01&to=2025-01-31"
```

### Get Conversion Funnel by Period
```bash
curl -X GET "http://localhost:8080/api/v1/reports/funnel-analysis/by-period?from=2025-01-01&to=2025-12-31&periodType=MONTHLY"
```

### Get Detailed Agent Metrics
```bash
curl -X GET "http://localhost:8080/api/v1/reports/agent-performance/AGENT123?from=2025-01-01&to=2025-01-31"
```

### Get Revenue Forecast with Projections
```bash
curl -X GET "http://localhost:8080/api/v1/reports/revenue-forecast/projections?orgId=ORG123"
```

## Data Models

### New DTOs
- `RevenueForecastResponse.RevenueForecastProjection`: Revenue projections for 30/60/90 days
- Enhanced `FunnelAnalysisResponse`: Added `funnelByTimePeriod` map
- Enhanced `ConversionRateBySourceDto`: Added period tracking

### Existing DTOs
- `ConversionRateBySourceDto`: Conversion metrics by source
- `PipelineStageMetricsDto`: Pipeline stage statistics
- `TimeSeriesDataPointDto`: Time series data point
- `KpiReportResponse`: Comprehensive KPI report
- `PipelineSummaryResponse`: Pipeline summary
- `AgentPerformanceResponse`: Agent metrics and aggregates
- `RevenueForecastResponse`: Revenue forecast with breakdown

## Performance Considerations

1. **Custom JPQL Queries**: Efficient aggregations with JPA Specification API
2. **1-Hour Cache TTL**: All expensive calculations cached for 1 hour
3. **Date Range Filtering**: Always specify date ranges for large datasets
4. **Lazy Loading**: Avoids N+1 query problems
5. **Database Indexes**: Ensure indexes on:
   - `dossier.created_at`
   - `dossier.status`
   - `dossier.source`
   - `dossier.created_by`
   - `message.direction`
   - `message.timestamp`

## Cache Configuration

Configured in `CacheConfig.java`:

```java
cacheConfigurations.put("funnelAnalysis", defaultConfig.entryTtl(Duration.ofHours(1)));
cacheConfigurations.put("agentPerformance", defaultConfig.entryTtl(Duration.ofHours(1)));
cacheConfigurations.put("revenueForecast", defaultConfig.entryTtl(Duration.ofHours(1)));
cacheConfigurations.put("conversionFunnelBySource", defaultConfig.entryTtl(Duration.ofHours(1)));
cacheConfigurations.put("conversionFunnelByPeriod", defaultConfig.entryTtl(Duration.ofHours(1)));
cacheConfigurations.put("agentMetricsDetailed", defaultConfig.entryTtl(Duration.ofHours(1)));
cacheConfigurations.put("revenueProjections", defaultConfig.entryTtl(Duration.ofHours(1)));
```

## Future Enhancements

- Export capabilities (CSV, Excel, PDF)
- Real-time dashboard updates via WebSockets
- Scheduled report generation and email delivery
- Customizable KPI thresholds and alerts
- Comparative analysis (period-over-period, year-over-year)
- Predictive analytics using machine learning models
- Advanced filtering (by region, property type, price range)
- Drill-down capabilities for detailed analysis
- Custom report builder with drag-and-drop interface
