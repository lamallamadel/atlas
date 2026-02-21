package com.example.backend.dto;

import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Audit event response representation")
public class AuditEventResponse {

    @Schema(description = "Unique identifier of the audit event", example = "1")
    private Long id;

    @Schema(description = "Entity type", example = "DOSSIER")
    private AuditEntityType entityType;

    @Schema(description = "Entity ID", example = "123")
    private Long entityId;

    @Schema(description = "Action performed", example = "UPDATED")
    private AuditAction action;

    @Schema(description = "User ID who performed the action", example = "user-123")
    private String userId;

    @Schema(description = "Diff/changes JSON object")
    private Map<String, Object> diff;

    @Schema(
            description = "Timestamp when the audit event was created",
            example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    public AuditEventResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AuditEntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(AuditEntityType entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Map<String, Object> getDiff() {
        return diff;
    }

    public void setDiff(Map<String, Object> diff) {
        this.diff = diff;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
