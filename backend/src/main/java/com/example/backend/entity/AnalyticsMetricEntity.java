package com.example.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.Type;

@Entity
@Table(
        name = "analytics_metric",
        indexes = {
            @Index(
                    name = "idx_analytics_metric_org_type_date",
                    columnList = "org_id, metric_type, metric_date"),
            @Index(name = "idx_analytics_metric_date", columnList = "metric_date"),
            @Index(name = "idx_analytics_metric_category", columnList = "category")
        })
public class AnalyticsMetricEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 255)
    private String orgId;

    @Column(name = "metric_type", nullable = false, length = 100)
    private String metricType;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "metric_value", precision = 20, scale = 4)
    private BigDecimal metricValue;

    @Column(name = "count_value")
    private Long countValue;

    @Type(JsonType.class)
    @Column(name = "dimensions", columnDefinition = "jsonb")
    private Map<String, String> dimensions;

    @Type(JsonType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getMetricType() {
        return metricType;
    }

    public void setMetricType(String metricType) {
        this.metricType = metricType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getMetricDate() {
        return metricDate;
    }

    public void setMetricDate(LocalDate metricDate) {
        this.metricDate = metricDate;
    }

    public BigDecimal getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(BigDecimal metricValue) {
        this.metricValue = metricValue;
    }

    public Long getCountValue() {
        return countValue;
    }

    public void setCountValue(Long countValue) {
        this.countValue = countValue;
    }

    public Map<String, String> getDimensions() {
        return dimensions;
    }

    public void setDimensions(Map<String, String> dimensions) {
        this.dimensions = dimensions;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
