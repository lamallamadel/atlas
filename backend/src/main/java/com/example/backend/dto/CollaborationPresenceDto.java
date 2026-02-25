package com.example.backend.dto;

import java.time.Instant;

public class CollaborationPresenceDto {
    private String userId;
    private String username;
    private Long dossierId;
    private String action;
    private Instant timestamp;

    public CollaborationPresenceDto() {}

    public CollaborationPresenceDto(String userId, String username, Long dossierId, String action) {
        this.userId = userId;
        this.username = username;
        this.dossierId = dossierId;
        this.action = action;
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

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
