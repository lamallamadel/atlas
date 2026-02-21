package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class LeadScoringConfigResponse {
    private Long id;
    private String configName;
    private Boolean isActive;
    private Integer autoQualificationThreshold;
    private Map<String, Integer> sourceWeights;
    private Map<String, Integer> engagementWeights;
    private Map<String, Integer> propertyMatchWeights;
    private Integer responseTimeWeight;
    private Integer fastResponseMinutes;
    private Integer mediumResponseMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
