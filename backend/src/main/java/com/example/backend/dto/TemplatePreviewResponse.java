package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;

@Schema(description = "Template preview with rendered content")
public class TemplatePreviewResponse {

    @Schema(description = "Template ID", example = "1")
    private Long templateId;

    @Schema(description = "Template name", example = "order_confirmation")
    private String name;

    @Schema(description = "Language code", example = "en")
    private String language;

    @Schema(description = "Rendered components with variable substitution")
    private List<Map<String, Object>> renderedComponents;

    @Schema(description = "Original components")
    private List<Map<String, Object>> originalComponents;

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

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

    public List<Map<String, Object>> getRenderedComponents() {
        return renderedComponents;
    }

    public void setRenderedComponents(List<Map<String, Object>> renderedComponents) {
        this.renderedComponents = renderedComponents;
    }

    public List<Map<String, Object>> getOriginalComponents() {
        return originalComponents;
    }

    public void setOriginalComponents(List<Map<String, Object>> originalComponents) {
        this.originalComponents = originalComponents;
    }
}
