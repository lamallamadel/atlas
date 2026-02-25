package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Map;

@Schema(description = "Request body for template preview with sample data")
public class TemplatePreviewRequest {

    @Schema(description = "Sample variable values for preview", example = "{\"1\": \"John Doe\", \"2\": \"$99.99\"}")
    private Map<String, String> variables;

    public Map<String, String> getVariables() {
        return variables;
    }

    public void setVariables(Map<String, String> variables) {
        this.variables = variables;
    }
}
