package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class LeadScoreResponse {
    private Long id;
    private Long dossierId;
    private Integer totalScore;
    private Integer sourceScore;
    private Integer responseTimeScore;
    private Integer engagementScore;
    private Integer propertyMatchScore;
    private Map<String, Object> scoreBreakdown;
    private LocalDateTime lastCalculatedAt;

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

    public Integer getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }

    public Integer getSourceScore() {
        return sourceScore;
    }

    public void setSourceScore(Integer sourceScore) {
        this.sourceScore = sourceScore;
    }

    public Integer getResponseTimeScore() {
        return responseTimeScore;
    }

    public void setResponseTimeScore(Integer responseTimeScore) {
        this.responseTimeScore = responseTimeScore;
    }

    public Integer getEngagementScore() {
        return engagementScore;
    }

    public void setEngagementScore(Integer engagementScore) {
        this.engagementScore = engagementScore;
    }

    public Integer getPropertyMatchScore() {
        return propertyMatchScore;
    }

    public void setPropertyMatchScore(Integer propertyMatchScore) {
        this.propertyMatchScore = propertyMatchScore;
    }

    public Map<String, Object> getScoreBreakdown() {
        return scoreBreakdown;
    }

    public void setScoreBreakdown(Map<String, Object> scoreBreakdown) {
        this.scoreBreakdown = scoreBreakdown;
    }

    public LocalDateTime getLastCalculatedAt() {
        return lastCalculatedAt;
    }

    public void setLastCalculatedAt(LocalDateTime lastCalculatedAt) {
        this.lastCalculatedAt = lastCalculatedAt;
    }
}
