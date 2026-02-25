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
@Table(name = "ml_prediction")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class MLPrediction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @Column(name = "prediction", nullable = false)
    private Integer prediction;

    @Column(name = "conversion_probability")
    private Double conversionProbability;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "recommended_action", length = 50)
    private String recommendedAction;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feature_contributions", columnDefinition = "jsonb")
    private Map<String, Object> featureContributions = new HashMap<>();

    @Column(name = "predicted_at")
    private LocalDateTime predictedAt;

    @Column(name = "actual_outcome")
    private Integer actualOutcome;

    @Column(name = "outcome_recorded_at")
    private LocalDateTime outcomeRecordedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public Integer getPrediction() {
        return prediction;
    }

    public void setPrediction(Integer prediction) {
        this.prediction = prediction;
    }

    public Double getConversionProbability() {
        return conversionProbability;
    }

    public void setConversionProbability(Double conversionProbability) {
        this.conversionProbability = conversionProbability;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public Map<String, Object> getFeatureContributions() {
        return featureContributions;
    }

    public void setFeatureContributions(Map<String, Object> featureContributions) {
        this.featureContributions = featureContributions;
    }

    public LocalDateTime getPredictedAt() {
        return predictedAt;
    }

    public void setPredictedAt(LocalDateTime predictedAt) {
        this.predictedAt = predictedAt;
    }

    public Integer getActualOutcome() {
        return actualOutcome;
    }

    public void setActualOutcome(Integer actualOutcome) {
        this.actualOutcome = actualOutcome;
    }

    public LocalDateTime getOutcomeRecordedAt() {
        return outcomeRecordedAt;
    }

    public void setOutcomeRecordedAt(LocalDateTime outcomeRecordedAt) {
        this.outcomeRecordedAt = outcomeRecordedAt;
    }
}
