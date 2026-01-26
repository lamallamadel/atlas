package com.example.backend.dto;

import java.time.Instant;
import java.util.Map;

public class CollaborationEditDto {
    private String userId;
    private String username;
    private Long dossierId;
    private String fieldName;
    private Object newValue;
    private Object oldValue;
    private Integer version;
    private String editId;
    private Instant timestamp;
    private Map<String, Object> metadata;

    public CollaborationEditDto() {
    }

    public CollaborationEditDto(String userId, String username, Long dossierId, String fieldName, Object newValue, Object oldValue, Integer version) {
        this.userId = userId;
        this.username = username;
        this.dossierId = dossierId;
        this.fieldName = fieldName;
        this.newValue = newValue;
        this.oldValue = oldValue;
        this.version = version;
        this.editId = java.util.UUID.randomUUID().toString();
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

    public Object getNewValue() {
        return newValue;
    }

    public void setNewValue(Object newValue) {
        this.newValue = newValue;
    }

    public Object getOldValue() {
        return oldValue;
    }

    public void setOldValue(Object oldValue) {
        this.oldValue = oldValue;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public String getEditId() {
        return editId;
    }

    public void setEditId(String editId) {
        this.editId = editId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
