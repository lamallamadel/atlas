package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request body for creating a new template version")
public class TemplateVersionRequest {

    @Schema(description = "Summary of changes in this version", example = "Updated button text and added new variable")
    @NotBlank(message = "Change summary is required")
    private String changeSummary;

    public String getChangeSummary() {
        return changeSummary;
    }

    public void setChangeSummary(String changeSummary) {
        this.changeSummary = changeSummary;
    }
}
