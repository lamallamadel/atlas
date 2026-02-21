package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to create a new version of a workflow")
public class WorkflowVersionRequest {

    @Schema(description = "Parent workflow definition ID", example = "1", required = true)
    @NotNull(message = "Parent workflow definition ID is required")
    private Long parentWorkflowId;

    @Schema(description = "Version name/description", example = "Updated qualification rules")
    @NotBlank(message = "Version description is required")
    private String versionDescription;

    public Long getParentWorkflowId() {
        return parentWorkflowId;
    }

    public void setParentWorkflowId(Long parentWorkflowId) {
        this.parentWorkflowId = parentWorkflowId;
    }

    public String getVersionDescription() {
        return versionDescription;
    }

    public void setVersionDescription(String versionDescription) {
        this.versionDescription = versionDescription;
    }
}
