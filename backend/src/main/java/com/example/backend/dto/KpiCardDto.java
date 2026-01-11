package com.example.backend.dto;

public class KpiCardDto {
    private Long value;
    private String trend;

    public KpiCardDto() {
    }

    public KpiCardDto(Long value, String trend) {
        this.value = value;
        this.trend = trend;
    }

    public Long getValue() {
        return value;
    }

    public void setValue(Long value) {
        this.value = value;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }
}
