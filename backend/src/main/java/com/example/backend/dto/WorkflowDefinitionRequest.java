package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

@Schema(description = "Request body for creating or updating a workflow definition")
public class WorkflowDefinitionRequest {

    @Schema(description = "Case type code", example = "CRM_LEAD_BUY", required = true)
    @NotBlank(message = "Case type is required")
    @Size(max = 100, message = "Case type must not exceed 100 characters")
    private String caseType;

    @Schema(description = "From status", example = "NEW", required = true)
    @NotBlank(message = "From status is required")
    @Size(max = 50, message = "From status must not exceed 50 characters")
    private String fromStatus;

    @Schema(description = "To status", example = "QUALIFIED", required = true)
    @NotBlank(message = "To status is required")
    @Size(max = 50, message = "To status must not exceed 50 characters")
    private String toStatus;

    @Schema(description = "Whether this transition is active", example = "true")
    private Boolean isActive;

    @Schema(description = "JSON object defining conditions for this transition", nullable = true)
    private Map<String, Object> conditionsJson;

    @Schema(
            description = "JSON object defining required fields for this transition",
            nullable = true)
    private Map<String, Object> requiredFieldsJson;

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
}
