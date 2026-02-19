package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Workflow definition response representation")
public class WorkflowDefinitionResponse {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Case type code", example = "CRM_LEAD_BUY")
    private String caseType;

    @Schema(description = "From status", example = "NEW")
    private String fromStatus;

    @Schema(description = "To status", example = "QUALIFIED")
    private String toStatus;

    @Schema(description = "Whether this transition is active", example = "true")
    private Boolean isActive;

    @Schema(description = "JSON object defining conditions for this transition", nullable = true)
    private Map<String, Object> conditionsJson;

    @Schema(
            description = "JSON object defining required fields for this transition",
            nullable = true)
    private Map<String, Object> requiredFieldsJson;

    @Schema(description = "Timestamp when created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when last updated", example = "2024-01-01T12:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "User who created", nullable = true)
    private String createdBy;

    @Schema(description = "User who last updated", nullable = true)
    private String updatedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String caseType) {
        this.caseType = caseType;
    }

    public String getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(String fromStatus) {
        this.fromStatus = fromStatus;
    }

    public String getToStatus() {
        return toStatus;
    }

    public void setToStatus(String toStatus) {
        this.toStatus = toStatus;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Map<String, Object> getConditionsJson() {
        return conditionsJson;
    }

    public void setConditionsJson(Map<String, Object> conditionsJson) {
        this.conditionsJson = conditionsJson;
    }

    public Map<String, Object> getRequiredFieldsJson() {
        return requiredFieldsJson;
    }

    public void setRequiredFieldsJson(Map<String, Object> requiredFieldsJson) {
        this.requiredFieldsJson = requiredFieldsJson;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
