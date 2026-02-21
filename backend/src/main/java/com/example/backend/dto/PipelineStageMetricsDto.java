package com.example.backend.dto;

public class PipelineStageMetricsDto {
    private String stage;
    private Long count;
    private Double percentage;

    public PipelineStageMetricsDto() {}

    public PipelineStageMetricsDto(String stage, Long count, Double percentage) {
        this.stage = stage;
        this.count = count;
        this.percentage = percentage;
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

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }
}
