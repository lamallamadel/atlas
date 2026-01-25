package com.example.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class RevenueForecastResponse {
    private BigDecimal totalPipelineValue;
    private BigDecimal forecastedRevenue;
    private Double averageConversionRate;
    private Integer totalOpportunities;
    private List<PipelineStageValue> pipelineByStage;
    private List<SourceForecast> forecastBySource;
    private RevenueForecastProjection projection30Days;
    private RevenueForecastProjection projection60Days;
    private RevenueForecastProjection projection90Days;

    public BigDecimal getTotalPipelineValue() {
        return totalPipelineValue;
    }

    public void setTotalPipelineValue(BigDecimal totalPipelineValue) {
        this.totalPipelineValue = totalPipelineValue;
    }

    public BigDecimal getForecastedRevenue() {
        return forecastedRevenue;
    }

    public void setForecastedRevenue(BigDecimal forecastedRevenue) {
        this.forecastedRevenue = forecastedRevenue;
    }

    public Double getAverageConversionRate() {
        return averageConversionRate;
    }

    public void setAverageConversionRate(Double averageConversionRate) {
        this.averageConversionRate = averageConversionRate;
    }

    public Integer getTotalOpportunities() {
        return totalOpportunities;
    }

    public void setTotalOpportunities(Integer totalOpportunities) {
        this.totalOpportunities = totalOpportunities;
    }

    public List<PipelineStageValue> getPipelineByStage() {
        return pipelineByStage;
    }

    public void setPipelineByStage(List<PipelineStageValue> pipelineByStage) {
        this.pipelineByStage = pipelineByStage;
    }

    public List<SourceForecast> getForecastBySource() {
        return forecastBySource;
    }

    public void setForecastBySource(List<SourceForecast> forecastBySource) {
        this.forecastBySource = forecastBySource;
    }

    public RevenueForecastProjection getProjection30Days() {
        return projection30Days;
    }

    public void setProjection30Days(RevenueForecastProjection projection30Days) {
        this.projection30Days = projection30Days;
    }

    public RevenueForecastProjection getProjection60Days() {
        return projection60Days;
    }

    public void setProjection60Days(RevenueForecastProjection projection60Days) {
        this.projection60Days = projection60Days;
    }

    public RevenueForecastProjection getProjection90Days() {
        return projection90Days;
    }

    public void setProjection90Days(RevenueForecastProjection projection90Days) {
        this.projection90Days = projection90Days;
    }

    public static class RevenueForecastProjection {
        private Integer days;
        private BigDecimal estimatedRevenue;
        private BigDecimal conservativeRevenue;
        private BigDecimal optimisticRevenue;
        private Integer expectedClosedDeals;

        public RevenueForecastProjection() {
        }

        public RevenueForecastProjection(Integer days, BigDecimal estimatedRevenue, 
                                        BigDecimal conservativeRevenue, BigDecimal optimisticRevenue, 
                                        Integer expectedClosedDeals) {
            this.days = days;
            this.estimatedRevenue = estimatedRevenue;
            this.conservativeRevenue = conservativeRevenue;
            this.optimisticRevenue = optimisticRevenue;
            this.expectedClosedDeals = expectedClosedDeals;
        }

        public Integer getDays() {
            return days;
        }

        public void setDays(Integer days) {
            this.days = days;
        }

        public BigDecimal getEstimatedRevenue() {
            return estimatedRevenue;
        }

        public void setEstimatedRevenue(BigDecimal estimatedRevenue) {
            this.estimatedRevenue = estimatedRevenue;
        }

        public BigDecimal getConservativeRevenue() {
            return conservativeRevenue;
        }

        public void setConservativeRevenue(BigDecimal conservativeRevenue) {
            this.conservativeRevenue = conservativeRevenue;
        }

        public BigDecimal getOptimisticRevenue() {
            return optimisticRevenue;
        }

        public void setOptimisticRevenue(BigDecimal optimisticRevenue) {
            this.optimisticRevenue = optimisticRevenue;
        }

        public Integer getExpectedClosedDeals() {
            return expectedClosedDeals;
        }

        public void setExpectedClosedDeals(Integer expectedClosedDeals) {
            this.expectedClosedDeals = expectedClosedDeals;
        }
    }

    public static class PipelineStageValue {
        private String stage;
        private Long count;
        private BigDecimal totalValue;
        private BigDecimal weightedValue;
        private Double weightPercentage;

        public PipelineStageValue() {
        }

        public PipelineStageValue(String stage, Long count, BigDecimal totalValue, Double weightPercentage) {
            this.stage = stage;
            this.count = count;
            this.totalValue = totalValue;
            this.weightPercentage = weightPercentage;
            this.weightedValue = totalValue.multiply(BigDecimal.valueOf(weightPercentage / 100.0));
        }

        public String getStage() {
            return stage;
        }

        public void setStage(String stage) {
            this.stage = stage;
        }

        public Long getCount() {
            return count;
        }

        public void setCount(Long count) {
            this.count = count;
        }

        public BigDecimal getTotalValue() {
            return totalValue;
        }

        public void setTotalValue(BigDecimal totalValue) {
            this.totalValue = totalValue;
        }

        public BigDecimal getWeightedValue() {
            return weightedValue;
        }

        public void setWeightedValue(BigDecimal weightedValue) {
            this.weightedValue = weightedValue;
        }

        public Double getWeightPercentage() {
            return weightPercentage;
        }

        public void setWeightPercentage(Double weightPercentage) {
            this.weightPercentage = weightPercentage;
        }
    }

    public static class SourceForecast {
        private String source;
        private Long opportunityCount;
        private BigDecimal totalValue;
        private Double historicalConversionRate;
        private BigDecimal forecastedRevenue;

        public SourceForecast() {
        }

        public SourceForecast(String source, Long opportunityCount, BigDecimal totalValue, Double historicalConversionRate) {
            this.source = source;
            this.opportunityCount = opportunityCount;
            this.totalValue = totalValue;
            this.historicalConversionRate = historicalConversionRate;
            this.forecastedRevenue = totalValue.multiply(BigDecimal.valueOf(historicalConversionRate / 100.0));
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public Long getOpportunityCount() {
            return opportunityCount;
        }

        public void setOpportunityCount(Long opportunityCount) {
            this.opportunityCount = opportunityCount;
        }

        public BigDecimal getTotalValue() {
            return totalValue;
        }

        public void setTotalValue(BigDecimal totalValue) {
            this.totalValue = totalValue;
        }

        public Double getHistoricalConversionRate() {
            return historicalConversionRate;
        }

        public void setHistoricalConversionRate(Double historicalConversionRate) {
            this.historicalConversionRate = historicalConversionRate;
        }

        public BigDecimal getForecastedRevenue() {
            return forecastedRevenue;
        }

        public void setForecastedRevenue(BigDecimal forecastedRevenue) {
            this.forecastedRevenue = forecastedRevenue;
        }
    }
}
