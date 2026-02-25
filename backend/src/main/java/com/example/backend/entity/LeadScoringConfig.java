package com.example.backend.entity;

import jakarta.persistence.*;
import java.util.HashMap;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "lead_scoring_config")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class LeadScoringConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "config_name", nullable = false, length = 255)
    private String configName;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "auto_qualification_threshold")
    private Integer autoQualificationThreshold = 70;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "source_weights", columnDefinition = "jsonb")
    private Map<String, Integer> sourceWeights = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "engagement_weights", columnDefinition = "jsonb")
    private Map<String, Integer> engagementWeights = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "property_match_weights", columnDefinition = "jsonb")
    private Map<String, Integer> propertyMatchWeights = new HashMap<>();

    @Column(name = "response_time_weight")
    private Integer responseTimeWeight = 20;

    @Column(name = "fast_response_minutes")
    private Integer fastResponseMinutes = 60;

    @Column(name = "medium_response_minutes")
    private Integer mediumResponseMinutes = 240;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConfigName() {
        return configName;
    }

    public void setConfigName(String configName) {
        this.configName = configName;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getAutoQualificationThreshold() {
        return autoQualificationThreshold;
    }

    public void setAutoQualificationThreshold(Integer autoQualificationThreshold) {
        this.autoQualificationThreshold = autoQualificationThreshold;
    }

    public Map<String, Integer> getSourceWeights() {
        return sourceWeights;
    }

    public void setSourceWeights(Map<String, Integer> sourceWeights) {
        this.sourceWeights = sourceWeights;
    }

    public Map<String, Integer> getEngagementWeights() {
        return engagementWeights;
    }

    public void setEngagementWeights(Map<String, Integer> engagementWeights) {
        this.engagementWeights = engagementWeights;
    }

    public Map<String, Integer> getPropertyMatchWeights() {
        return propertyMatchWeights;
    }

    public void setPropertyMatchWeights(Map<String, Integer> propertyMatchWeights) {
        this.propertyMatchWeights = propertyMatchWeights;
    }

    public Integer getResponseTimeWeight() {
        return responseTimeWeight;
    }

    public void setResponseTimeWeight(Integer responseTimeWeight) {
        this.responseTimeWeight = responseTimeWeight;
    }

    public Integer getFastResponseMinutes() {
        return fastResponseMinutes;
    }

    public void setFastResponseMinutes(Integer fastResponseMinutes) {
        this.fastResponseMinutes = fastResponseMinutes;
    }

    public Integer getMediumResponseMinutes() {
        return mediumResponseMinutes;
    }

    public void setMediumResponseMinutes(Integer mediumResponseMinutes) {
        this.mediumResponseMinutes = mediumResponseMinutes;
    }
}
