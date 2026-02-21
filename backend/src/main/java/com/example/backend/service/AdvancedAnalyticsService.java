package com.example.backend.service;

import com.example.backend.dto.AnalyticsResponse;
import com.example.backend.entity.AnalyticsMetricEntity;
import com.example.backend.repository.AnalyticsMetricRepository;
import com.example.backend.repository.DossierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdvancedAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AdvancedAnalyticsService.class);

    private final AnalyticsMetricRepository analyticsMetricRepository;
    private final DossierRepository dossierRepository;

    public AdvancedAnalyticsService(
            AnalyticsMetricRepository analyticsMetricRepository,
            DossierRepository dossierRepository) {
        this.analyticsMetricRepository = analyticsMetricRepository;
        this.dossierRepository = dossierRepository;
    }

    public AnalyticsResponse getCohortAnalysis(String orgId, LocalDate startDate, LocalDate endDate) {
        logger.info("Generating cohort analysis for org: {} from {} to {}", orgId, startDate, endDate);

        List<AnalyticsMetricEntity> metrics = analyticsMetricRepository
            .findByOrgIdAndMetricTypeAndMetricDateBetween(orgId, "COHORT_CONVERSION", startDate, endDate);

        AnalyticsResponse response = new AnalyticsResponse();
        response.setMetricType("COHORT_ANALYSIS");
        
        List<AnalyticsResponse.DataPoint> dataPoints = metrics.stream()
            .map(metric -> {
                AnalyticsResponse.DataPoint dp = new AnalyticsResponse.DataPoint();
                dp.setDate(metric.getMetricDate().toString());
                dp.setValue(metric.getMetricValue());
                dp.setMetadata(metric.getMetadata());
                return dp;
            })
            .collect(Collectors.toList());
        
        response.setData(dataPoints);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCohorts", dataPoints.size());
        summary.put("avgConversionRate", calculateAverageConversion(metrics));
        response.setSummary(summary);

        return response;
    }

    public AnalyticsResponse getFunnelVisualization(String orgId, LocalDate startDate, LocalDate endDate) {
        logger.info("Generating funnel visualization for org: {} from {} to {}", orgId, startDate, endDate);

        List<String> stages = Arrays.asList("LEAD", "CONTACT", "VISIT", "OFFER", "NEGOTIATION", "SALE");
        
        List<AnalyticsResponse.DataPoint> dataPoints = new ArrayList<>();
        
        for (int i = 0; i < stages.size(); i++) {
            String stage = stages.get(i);
            Long count = countDossiersByStage(orgId, stage, startDate, endDate);
            
            AnalyticsResponse.DataPoint dp = new AnalyticsResponse.DataPoint();
            dp.setDate(stage);
            dp.setValue(count);
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("order", i);
            
            if (i > 0) {
                Long previousCount = (Long) dataPoints.get(i - 1).getValue();
                double dropOffRate = previousCount > 0 
                    ? ((previousCount - count) * 100.0 / previousCount) 
                    : 0.0;
                metadata.put("dropOffRate", String.format("%.2f%%", dropOffRate));
            }
            
            dp.setMetadata(metadata);
            dataPoints.add(dp);
        }

        AnalyticsResponse response = new AnalyticsResponse();
        response.setMetricType("FUNNEL_VISUALIZATION");
        response.setData(dataPoints);
        
        Map<String, Object> summary = new HashMap<>();
        if (!dataPoints.isEmpty()) {
            Long initial = (Long) dataPoints.get(0).getValue();
            Long final_ = (Long) dataPoints.get(dataPoints.size() - 1).getValue();
            double conversionRate = initial > 0 ? (final_ * 100.0 / initial) : 0.0;
            summary.put("overallConversionRate", String.format("%.2f%%", conversionRate));
        }
        response.setSummary(summary);

        return response;
    }

    public AnalyticsResponse getAgentPerformanceLeaderboard(String orgId, LocalDate startDate, LocalDate endDate) {
        logger.info("Generating agent performance leaderboard for org: {} from {} to {}", orgId, startDate, endDate);

        List<AnalyticsMetricEntity> metrics = analyticsMetricRepository
            .findByOrgIdAndCategoryAndDate(orgId, "AGENT_PERFORMANCE", endDate);

        List<AnalyticsResponse.DataPoint> dataPoints = metrics.stream()
            .sorted((m1, m2) -> m2.getMetricValue().compareTo(m1.getMetricValue()))
            .map(metric -> {
                AnalyticsResponse.DataPoint dp = new AnalyticsResponse.DataPoint();
                dp.setDate(metric.getDimensions().get("agentName"));
                dp.setValue(metric.getMetricValue());
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("conversionRate", metric.getMetadata().get("conversionRate"));
                metadata.put("avgResponseTime", metric.getMetadata().get("avgResponseTime"));
                metadata.put("dealsCount", metric.getCountValue());
                dp.setMetadata(metadata);
                
                return dp;
            })
            .collect(Collectors.toList());

        AnalyticsResponse response = new AnalyticsResponse();
        response.setMetricType("AGENT_PERFORMANCE_LEADERBOARD");
        response.setData(dataPoints);

        return response;
    }

    public AnalyticsResponse getPropertyMarketTrends(String orgId, LocalDate startDate, LocalDate endDate) {
        logger.info("Generating property market trends for org: {} from {} to {}", orgId, startDate, endDate);

        List<AnalyticsMetricEntity> metrics = analyticsMetricRepository
            .findMetricsForTimeSeries(orgId, "PROPERTY_MARKET_TREND", startDate);

        AnalyticsResponse response = new AnalyticsResponse();
        response.setMetricType("PROPERTY_MARKET_TRENDS");

        List<AnalyticsResponse.DataPoint> dataPoints = metrics.stream()
            .map(metric -> {
                AnalyticsResponse.DataPoint dp = new AnalyticsResponse.DataPoint();
                dp.setDate(metric.getMetricDate().toString());
                dp.setValue(metric.getMetricValue());
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("location", metric.getDimensions().get("location"));
                metadata.put("propertyType", metric.getDimensions().get("propertyType"));
                metadata.put("demandScore", metric.getMetadata().get("demandScore"));
                dp.setMetadata(metadata);
                
                return dp;
            })
            .collect(Collectors.toList());

        response.setData(dataPoints);

        Map<String, Object> summary = new HashMap<>();
        summary.put("avgPrice", calculateAveragePrice(metrics));
        summary.put("priceGrowth", calculatePriceGrowth(metrics));
        response.setSummary(summary);

        return response;
    }

    public AnalyticsResponse getRevenueForecast(String orgId, int forecastMonths) {
        logger.info("Generating revenue forecast for org: {} for {} months", orgId, forecastMonths);

        LocalDate startDate = LocalDate.now().minusMonths(12);
        List<AnalyticsMetricEntity> historicalMetrics = analyticsMetricRepository
            .findMetricsForTimeSeries(orgId, "MONTHLY_REVENUE", startDate);

        List<BigDecimal> historicalRevenue = historicalMetrics.stream()
            .map(AnalyticsMetricEntity::getMetricValue)
            .collect(Collectors.toList());

        List<AnalyticsResponse.DataPoint> dataPoints = new ArrayList<>();
        
        for (AnalyticsMetricEntity metric : historicalMetrics) {
            AnalyticsResponse.DataPoint dp = new AnalyticsResponse.DataPoint();
            dp.setDate(metric.getMetricDate().toString());
            dp.setValue(metric.getMetricValue());
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("type", "historical");
            dp.setMetadata(metadata);
            dataPoints.add(dp);
        }

        List<BigDecimal> forecast = calculateSeasonalForecast(historicalRevenue, forecastMonths);
        LocalDate forecastStartDate = LocalDate.now().plusMonths(1);
        
        for (int i = 0; i < forecast.size(); i++) {
            AnalyticsResponse.DataPoint dp = new AnalyticsResponse.DataPoint();
            dp.setDate(forecastStartDate.plusMonths(i).toString());
            dp.setValue(forecast.get(i));
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("type", "forecast");
            dp.setMetadata(metadata);
            dataPoints.add(dp);
        }

        AnalyticsResponse response = new AnalyticsResponse();
        response.setMetricType("REVENUE_FORECAST");
        response.setData(dataPoints);

        return response;
    }

    private Long countDossiersByStage(String orgId, String stage, LocalDate startDate, LocalDate endDate) {
        return 0L;
    }

    private BigDecimal calculateAverageConversion(List<AnalyticsMetricEntity> metrics) {
        if (metrics.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal sum = metrics.stream()
            .map(AnalyticsMetricEntity::getMetricValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return sum.divide(BigDecimal.valueOf(metrics.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAveragePrice(List<AnalyticsMetricEntity> metrics) {
        if (metrics.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal sum = metrics.stream()
            .map(AnalyticsMetricEntity::getMetricValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return sum.divide(BigDecimal.valueOf(metrics.size()), 2, RoundingMode.HALF_UP);
    }

    private String calculatePriceGrowth(List<AnalyticsMetricEntity> metrics) {
        if (metrics.size() < 2) {
            return "0.00%";
        }
        
        BigDecimal first = metrics.get(0).getMetricValue();
        BigDecimal last = metrics.get(metrics.size() - 1).getMetricValue();
        
        if (first.compareTo(BigDecimal.ZERO) == 0) {
            return "0.00%";
        }
        
        BigDecimal growth = last.subtract(first)
            .divide(first, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
        
        return String.format("%.2f%%", growth);
    }

    private List<BigDecimal> calculateSeasonalForecast(List<BigDecimal> historical, int months) {
        if (historical.isEmpty()) {
            return Collections.nCopies(months, BigDecimal.ZERO);
        }

        BigDecimal avg = historical.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(historical.size()), 2, RoundingMode.HALF_UP);

        BigDecimal trend = BigDecimal.valueOf(1.05);
        
        List<BigDecimal> forecast = new ArrayList<>();
        for (int i = 0; i < months; i++) {
            BigDecimal monthlyForecast = avg.multiply(trend.pow(i));
            forecast.add(monthlyForecast);
        }
        
        return forecast;
    }
}
