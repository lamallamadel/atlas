package com.example.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "api_usage", indexes = {
    @Index(name = "idx_api_usage_api_key_date", columnList = "api_key_id, usage_date"),
    @Index(name = "idx_api_usage_org_date", columnList = "org_id, usage_date")
})
public class ApiUsageEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "api_key_id", nullable = false)
    private Long apiKeyId;

    @NotNull
    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @NotBlank
    @Column(name = "endpoint", nullable = false, length = 500)
    private String endpoint;

    @Column(name = "request_count")
    private Long requestCount = 0L;

    @Column(name = "success_count")
    private Long successCount = 0L;

    @Column(name = "error_count")
    private Long errorCount = 0L;

    @Column(name = "avg_response_time_ms")
    private Double avgResponseTimeMs;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getApiKeyId() {
        return apiKeyId;
    }

    public void setApiKeyId(Long apiKeyId) {
        this.apiKeyId = apiKeyId;
    }

    public LocalDate getUsageDate() {
        return usageDate;
    }

    public void setUsageDate(LocalDate usageDate) {
        this.usageDate = usageDate;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public Long getRequestCount() {
        return requestCount;
    }

    public void setRequestCount(Long requestCount) {
        this.requestCount = requestCount;
    }

    public Long getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Long successCount) {
        this.successCount = successCount;
    }

    public Long getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Long errorCount) {
        this.errorCount = errorCount;
    }

    public Double getAvgResponseTimeMs() {
        return avgResponseTimeMs;
    }

    public void setAvgResponseTimeMs(Double avgResponseTimeMs) {
        this.avgResponseTimeMs = avgResponseTimeMs;
    }
}
