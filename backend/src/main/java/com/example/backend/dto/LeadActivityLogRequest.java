package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LeadActivityLogRequest {

    @NotBlank private String activityType;

    private String description;

    @NotNull private Integer scoreImpact;

    public String getActivityType() {
        return activityType;
    }

    public void setActivityType(String activityType) {
        this.activityType = activityType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getScoreImpact() {
        return scoreImpact;
    }

    public void setScoreImpact(Integer scoreImpact) {
        this.scoreImpact = scoreImpact;
    }
}
