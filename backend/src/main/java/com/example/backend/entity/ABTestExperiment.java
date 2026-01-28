package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "ab_test_experiment")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class ABTestExperiment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "experiment_name", nullable = false, length = 255)
    private String experimentName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "control_method", nullable = false, length = 50)
    private String controlMethod;

    @Column(name = "treatment_method", nullable = false, length = 50)
    private String treatmentMethod;

    @Column(name = "traffic_split")
    private Double trafficSplit = 0.5;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "control_metrics", columnDefinition = "jsonb")
    private Map<String, Object> controlMetrics = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "treatment_metrics", columnDefinition = "jsonb")
    private Map<String, Object> treatmentMetrics = new HashMap<>();

    @Column(name = "winner", length = 50)
    private String winner;

    @Column(name = "confidence_level")
    private Double confidenceLevel;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getExperimentName() {
        return experimentName;
    }

    public void setExperimentName(String experimentName) {
        this.experimentName = experimentName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getControlMethod() {
        return controlMethod;
    }

    public void setControlMethod(String controlMethod) {
        this.controlMethod = controlMethod;
    }

    public String getTreatmentMethod() {
        return treatmentMethod;
    }

    public void setTreatmentMethod(String treatmentMethod) {
        this.treatmentMethod = treatmentMethod;
    }

    public Double getTrafficSplit() {
        return trafficSplit;
    }

    public void setTrafficSplit(Double trafficSplit) {
        this.trafficSplit = trafficSplit;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public Map<String, Object> getControlMetrics() {
        return controlMetrics;
    }

    public void setControlMetrics(Map<String, Object> controlMetrics) {
        this.controlMetrics = controlMetrics;
    }

    public Map<String, Object> getTreatmentMetrics() {
        return treatmentMetrics;
    }

    public void setTreatmentMetrics(Map<String, Object> treatmentMetrics) {
        this.treatmentMetrics = treatmentMetrics;
    }

    public String getWinner() {
        return winner;
    }

    public void setWinner(String winner) {
        this.winner = winner;
    }

    public Double getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(Double confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }
}
