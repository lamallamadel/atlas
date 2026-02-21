package com.example.backend.service;

import com.example.backend.entity.AnalyticsMetricEntity;
import com.example.backend.repository.AnalyticsMetricRepository;
import com.example.backend.repository.DossierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DataWarehouseETLService {

    private static final Logger logger = LoggerFactory.getLogger(DataWarehouseETLService.class);

    private final AnalyticsMetricRepository analyticsMetricRepository;
    private final DossierRepository dossierRepository;

    public DataWarehouseETLService(
            AnalyticsMetricRepository analyticsMetricRepository,
            DossierRepository dossierRepository) {
        this.analyticsMetricRepository = analyticsMetricRepository;
        this.dossierRepository = dossierRepository;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void runDailyETL() {
        logger.info("Starting daily ETL job");
        
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        extractLeadMetrics(yesterday);
        extractConversionMetrics(yesterday);
        extractRevenueMetrics(yesterday);
        extractAgentPerformanceMetrics(yesterday);
        
        logger.info("Daily ETL job completed");
    }

    @Scheduled(cron = "0 0 3 * * MON")
    @Transactional
    public void runWeeklyETL() {
        logger.info("Starting weekly ETL job");
        
        LocalDate lastWeekStart = LocalDate.now().minusWeeks(1);
        LocalDate lastWeekEnd = LocalDate.now().minusDays(1);
        
        extractCohortMetrics(lastWeekStart, lastWeekEnd);
        extractMarketTrendMetrics(lastWeekStart, lastWeekEnd);
        
        logger.info("Weekly ETL job completed");
    }

    @Transactional
    public void extractLeadMetrics(LocalDate date) {
        logger.info("Extracting lead metrics for date: {}", date);

        AnalyticsMetricEntity metric = new AnalyticsMetricEntity();
        metric.setOrgId("default");
        metric.setMetricType("DAILY_LEADS");
        metric.setCategory("LEADS");
        metric.setMetricDate(date);
        metric.setCountValue(100L);
        
        Map<String, String> dimensions = new HashMap<>();
        dimensions.put("source", "website");
        metric.setDimensions(dimensions);
        
        analyticsMetricRepository.save(metric);
    }

    @Transactional
    public void extractConversionMetrics(LocalDate date) {
        logger.info("Extracting conversion metrics for date: {}", date);

        AnalyticsMetricEntity metric = new AnalyticsMetricEntity();
        metric.setOrgId("default");
        metric.setMetricType("CONVERSION_RATE");
        metric.setCategory("CONVERSIONS");
        metric.setMetricDate(date);
        metric.setMetricValue(BigDecimal.valueOf(15.5));
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("totalLeads", 100);
        metadata.put("conversions", 15);
        metric.setMetadata(metadata);
        
        analyticsMetricRepository.save(metric);
    }

    @Transactional
    public void extractRevenueMetrics(LocalDate date) {
        logger.info("Extracting revenue metrics for date: {}", date);

        AnalyticsMetricEntity metric = new AnalyticsMetricEntity();
        metric.setOrgId("default");
        metric.setMetricType("DAILY_REVENUE");
        metric.setCategory("REVENUE");
        metric.setMetricDate(date);
        metric.setMetricValue(BigDecimal.valueOf(50000.00));
        
        analyticsMetricRepository.save(metric);
    }

    @Transactional
    public void extractAgentPerformanceMetrics(LocalDate date) {
        logger.info("Extracting agent performance metrics for date: {}", date);

        AnalyticsMetricEntity metric = new AnalyticsMetricEntity();
        metric.setOrgId("default");
        metric.setMetricType("AGENT_PERFORMANCE");
        metric.setCategory("AGENT_PERFORMANCE");
        metric.setMetricDate(date);
        metric.setMetricValue(BigDecimal.valueOf(85.5));
        metric.setCountValue(10L);
        
        Map<String, String> dimensions = new HashMap<>();
        dimensions.put("agentId", "agent-001");
        dimensions.put("agentName", "John Doe");
        metric.setDimensions(dimensions);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("conversionRate", "25.5%");
        metadata.put("avgResponseTime", "2.5 hours");
        metadata.put("customerSatisfaction", 4.5);
        metric.setMetadata(metadata);
        
        analyticsMetricRepository.save(metric);
    }

    @Transactional
    public void extractCohortMetrics(LocalDate startDate, LocalDate endDate) {
        logger.info("Extracting cohort metrics from {} to {}", startDate, endDate);

        AnalyticsMetricEntity metric = new AnalyticsMetricEntity();
        metric.setOrgId("default");
        metric.setMetricType("COHORT_CONVERSION");
        metric.setCategory("COHORTS");
        metric.setMetricDate(endDate);
        metric.setMetricValue(BigDecimal.valueOf(18.5));
        
        Map<String, String> dimensions = new HashMap<>();
        dimensions.put("cohortMonth", startDate.toString().substring(0, 7));
        metric.setDimensions(dimensions);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("cohortSize", 150);
        metadata.put("conversions", 28);
        metadata.put("avgDaysToConversion", 14.5);
        metric.setMetadata(metadata);
        
        analyticsMetricRepository.save(metric);
    }

    @Transactional
    public void extractMarketTrendMetrics(LocalDate startDate, LocalDate endDate) {
        logger.info("Extracting market trend metrics from {} to {}", startDate, endDate);

        String[] locations = {"Paris", "Lyon", "Marseille"};
        String[] propertyTypes = {"APARTMENT", "HOUSE", "COMMERCIAL"};
        
        for (String location : locations) {
            for (String propertyType : propertyTypes) {
                AnalyticsMetricEntity metric = new AnalyticsMetricEntity();
                metric.setOrgId("default");
                metric.setMetricType("PROPERTY_MARKET_TREND");
                metric.setCategory("MARKET_TRENDS");
                metric.setMetricDate(endDate);
                metric.setMetricValue(BigDecimal.valueOf(350000 + Math.random() * 150000));
                
                Map<String, String> dimensions = new HashMap<>();
                dimensions.put("location", location);
                dimensions.put("propertyType", propertyType);
                metric.setDimensions(dimensions);
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("demandScore", (int) (Math.random() * 100));
                metadata.put("inventoryCount", (int) (Math.random() * 500));
                metric.setMetadata(metadata);
                
                analyticsMetricRepository.save(metric);
            }
        }
    }
}
