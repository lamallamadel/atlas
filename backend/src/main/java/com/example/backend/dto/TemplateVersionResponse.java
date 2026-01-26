package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Schema(description = "Response containing template version details")
public class TemplateVersionResponse {

    @Schema(description = "Version ID")
    private Long id;

    @Schema(description = "Template ID")
    private Long templateId;

    @Schema(description = "Version number")
    private Integer versionNumber;

    @Schema(description = "Template components")
    private List<Map<String, Object>> components;

    @Schema(description = "Variables snapshot")
    private List<Map<String, Object>> variablesSnapshot;

    @Schema(description = "Version description")
    private String description;

    @Schema(description = "Change summary")
    private String changeSummary;

    @Schema(description = "Whether this version is active")
    private Boolean isActive;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Created by user")
    private String createdBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public List<Map<String, Object>> getComponents() {
        return components;
    }

    public void setComponents(List<Map<String, Object>> components) {
        this.components = components;
    }

    public List<Map<String, Object>> getVariablesSnapshot() {
        return variablesSnapshot;
    }

    public void setVariablesSnapshot(List<Map<String, Object>> variablesSnapshot) {
        this.variablesSnapshot = variablesSnapshot;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getChangeSummary() {
        return changeSummary;
    }

    public void setChangeSummary(String changeSummary) {
        this.changeSummary = changeSummary;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
