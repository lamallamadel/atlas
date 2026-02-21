package com.example.backend.dto;

import com.example.backend.entity.enums.TemplateCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

@Schema(description = "Request body for creating or updating a WhatsApp template")
public class WhatsAppTemplateRequest {

    @Schema(
            description = "Template name (lowercase, numbers, underscores only)",
            example = "order_confirmation",
            required = true)
    @NotBlank(message = "Template name is required")
    @Size(max = 512, message = "Template name must not exceed 512 characters")
    @Pattern(
            regexp = "^[a-z0-9_]+$",
            message = "Template name can only contain lowercase letters, numbers, and underscores")
    private String name;

    @Schema(description = "Language code (ISO 639-1 format)", example = "en", required = true)
    @NotBlank(message = "Language is required")
    @Pattern(
            regexp = "^[a-z]{2}(_[A-Z]{2})?$",
            message = "Invalid language code format. Expected format: 'en' or 'en_US'")
    private String language;

    @Schema(description = "Template category", example = "TRANSACTIONAL", required = true)
    @NotNull(message = "Category is required")
    private TemplateCategory category;

    @Schema(description = "Template components (header, body, footer, buttons)", required = true)
    @NotNull(message = "Components are required")
    private List<Map<String, Object>> components;

    @Schema(description = "Template variables", nullable = true)
    private List<TemplateVariableRequest> variables;

    @Schema(description = "Template description", nullable = true)
    private String description;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public TemplateCategory getCategory() {
        return category;
    }

    public void setCategory(TemplateCategory category) {
        this.category = category;
    }

    public List<Map<String, Object>> getComponents() {
        return components;
    }

    public void setComponents(List<Map<String, Object>> components) {
        this.components = components;
    }

    public List<TemplateVariableRequest> getVariables() {
        return variables;
    }

    public void setVariables(List<TemplateVariableRequest> variables) {
        this.variables = variables;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
