package com.example.backend.dto;

import java.util.List;

public class PipelineSummaryResponse {
    private List<PipelineStageMetricsDto> stageMetrics;
    private Long totalDossiers;
    private Double overallConversionRate;

    public List<PipelineStageMetricsDto> getStageMetrics() {
        return stageMetrics;
    }

    public void setStageMetrics(List<PipelineStageMetricsDto> stageMetrics) {
        this.stageMetrics = stageMetrics;
    }

    public Long getTotalDossiers() {
        return totalDossiers;
    }

    public void setTotalDossiers(Long totalDossiers) {
        this.totalDossiers = totalDossiers;
    }

    public Double getOverallConversionRate() {
        return overallConversionRate;
    }

    public void setOverallConversionRate(Double overallConversionRate) {
        this.overallConversionRate = overallConversionRate;
    }
}
