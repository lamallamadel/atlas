package com.example.backend.dto;

import java.time.Instant;

public class CollaborationCursorDto {
    private String userId;
    private String username;
    private Long dossierId;
    private String fieldName;
    private Integer cursorPosition;
    private String color;
    private Instant timestamp;

    public CollaborationCursorDto() {}

    public CollaborationCursorDto(
            String userId,
            String username,
            Long dossierId,
            String fieldName,
            Integer cursorPosition,
            String color) {
        this.userId = userId;
        this.username = username;
        this.dossierId = dossierId;
        this.fieldName = fieldName;
        this.cursorPosition = cursorPosition;
        this.color = color;
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

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public Integer getCursorPosition() {
        return cursorPosition;
    }

    public void setCursorPosition(Integer cursorPosition) {
        this.cursorPosition = cursorPosition;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
