package com.example.backend.dto;

import java.time.Instant;

public class CollaborationActivityDto {
    private String userId;
    private String username;
    private Long dossierId;
    private String activityType;
    private String description;
    private Object data;
    private Instant timestamp;

    public CollaborationActivityDto() {}

    public CollaborationActivityDto(
            String userId,
            String username,
            Long dossierId,
            String activityType,
            String description,
            Object data) {
        this.userId = userId;
        this.username = username;
        this.dossierId = dossierId;
        this.activityType = activityType;
        this.description = description;
        this.data = data;
        this.timestamp = Instant.now();
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

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

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
