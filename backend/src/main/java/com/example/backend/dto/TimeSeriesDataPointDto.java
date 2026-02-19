package com.example.backend.dto;

import java.time.LocalDate;

public class TimeSeriesDataPointDto {
    private LocalDate date;
    private Long value;

    public TimeSeriesDataPointDto() {}

    public TimeSeriesDataPointDto(LocalDate date, Long value) {
        this.date = date;
        this.value = value;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Long getValue() {
        return value;
    }

    public void setValue(Long value) {
        this.value = value;
    }
}
