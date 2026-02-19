package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Workflow transition response representation")
public class WorkflowTransitionResponse {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Dossier ID", example = "1")
    private Long dossierId;

    @Schema(description = "Case type code", example = "CRM_LEAD_BUY")
    private String caseType;

    @Schema(description = "From status", example = "NEW")
    private String fromStatus;

    @Schema(description = "To status", example = "QUALIFIED")
    private String toStatus;

    @Schema(description = "Whether transition was allowed", example = "true")
    private Boolean isAllowed;

    @Schema(description = "Validation errors if transition was not allowed", nullable = true)
    private Map<String, Object> validationErrorsJson;

    @Schema(description = "User who triggered the transition", nullable = true)
    private String userId;

    @Schema(description = "Reason for the transition", nullable = true)
    private String reason;

    @Schema(description = "Timestamp when transition occurred", example = "2024-01-01T12:00:00")
    private LocalDateTime transitionedAt;

    @Schema(description = "Timestamp when created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

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

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
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

    public Boolean getIsAllowed() {
        return isAllowed;
    }

    public void setIsAllowed(Boolean isAllowed) {
        this.isAllowed = isAllowed;
    }

    public Map<String, Object> getValidationErrorsJson() {
        return validationErrorsJson;
    }

    public void setValidationErrorsJson(Map<String, Object> validationErrorsJson) {
        this.validationErrorsJson = validationErrorsJson;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getTransitionedAt() {
        return transitionedAt;
    }

    public void setTransitionedAt(LocalDateTime transitionedAt) {
        this.transitionedAt = transitionedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
