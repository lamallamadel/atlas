package com.example.backend.dto;

public class TrendData {
    private Long currentValue;
    private Long previousValue;
    private Double percentageChange;

    public TrendData() {}

    public TrendData(Long currentValue, Long previousValue, Double percentageChange) {
        this.currentValue = currentValue;
        this.previousValue = previousValue;
        this.percentageChange = percentageChange;
    }

    public Long getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(Long currentValue) {
        this.currentValue = currentValue;
    }

    public Long getPreviousValue() {
        return previousValue;
    }

    public void setPreviousValue(Long previousValue) {
        this.previousValue = previousValue;
    }

    public Double getPercentageChange() {
        return percentageChange;
    }

    public void setPercentageChange(Double percentageChange) {
        this.percentageChange = percentageChange;
    }
}
