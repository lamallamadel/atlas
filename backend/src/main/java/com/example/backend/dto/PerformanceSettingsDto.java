package com.example.backend.dto;

import jakarta.validation.constraints.Min;

public class PerformanceSettingsDto {

    private Boolean cacheEnabled;

    @Min(1)
    private Integer batchSize;

    @Min(1)
    private Integer asyncPoolSize;

    @Min(1)
    private Long maxFileUploadSize;

    public PerformanceSettingsDto() {}

    public PerformanceSettingsDto(
            Boolean cacheEnabled,
            Integer batchSize,
            Integer asyncPoolSize,
            Long maxFileUploadSize) {
        this.cacheEnabled = cacheEnabled;
        this.batchSize = batchSize;
        this.asyncPoolSize = asyncPoolSize;
        this.maxFileUploadSize = maxFileUploadSize;
    }

    public Boolean getCacheEnabled() {
        return cacheEnabled;
    }

    public void setCacheEnabled(Boolean cacheEnabled) {
        this.cacheEnabled = cacheEnabled;
    }

    public Integer getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(Integer batchSize) {
        this.batchSize = batchSize;
    }

    public Integer getAsyncPoolSize() {
        return asyncPoolSize;
    }

    public void setAsyncPoolSize(Integer asyncPoolSize) {
        this.asyncPoolSize = asyncPoolSize;
    }

    public Long getMaxFileUploadSize() {
        return maxFileUploadSize;
    }

    public void setMaxFileUploadSize(Long maxFileUploadSize) {
        this.maxFileUploadSize = maxFileUploadSize;
    }
}
