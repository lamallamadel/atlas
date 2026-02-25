package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "ml_model_version")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class MLModelVersion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "version", nullable = false, length = 50)
    private String version;

    @Column(name = "model_type", nullable = false, length = 100)
    private String modelType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metrics", columnDefinition = "jsonb")
    private Map<String, Object> metrics = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hyperparameters", columnDefinition = "jsonb")
    private Map<String, Object> hyperparameters = new HashMap<>();

    @Column(name = "training_data_size")
    private Integer trainingDataSize;

    @Column(name = "trained_at")
    private LocalDateTime trainedAt;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getModelType() {
        return modelType;
    }

    public void setModelType(String modelType) {
        this.modelType = modelType;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Map<String, Object> getMetrics() {
        return metrics;
    }

    public void setMetrics(Map<String, Object> metrics) {
        this.metrics = metrics;
    }

    public Map<String, Object> getHyperparameters() {
        return hyperparameters;
    }

    public void setHyperparameters(Map<String, Object> hyperparameters) {
        this.hyperparameters = hyperparameters;
    }

    public Integer getTrainingDataSize() {
        return trainingDataSize;
    }

    public void setTrainingDataSize(Integer trainingDataSize) {
        this.trainingDataSize = trainingDataSize;
    }

    public LocalDateTime getTrainedAt() {
        return trainedAt;
    }

    public void setTrainedAt(LocalDateTime trainedAt) {
        this.trainedAt = trainedAt;
    }

    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }

    public void setActivatedAt(LocalDateTime activatedAt) {
        this.activatedAt = activatedAt;
    }

    public LocalDateTime getDeactivatedAt() {
        return deactivatedAt;
    }

    public void setDeactivatedAt(LocalDateTime deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
