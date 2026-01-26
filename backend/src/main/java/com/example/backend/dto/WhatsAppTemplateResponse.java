package com.example.backend.dto;

import com.example.backend.entity.enums.TemplateCategory;
import com.example.backend.entity.enums.TemplateStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Schema(description = "WhatsApp template response")
public class WhatsAppTemplateResponse {

    @Schema(description = "Template ID", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Template name", example = "order_confirmation")
    private String name;

    @Schema(description = "Language code", example = "en")
    private String language;

    @Schema(description = "Template category", example = "TRANSACTIONAL")
    private TemplateCategory category;

    @Schema(description = "Template status", example = "ACTIVE")
    private TemplateStatus status;

    @Schema(description = "WhatsApp Business API template ID", nullable = true)
    private String whatsAppTemplateId;

    @Schema(description = "Template components")
    private List<Map<String, Object>> components;

    @Schema(description = "Template variables")
    private List<TemplateVariableResponse> variables;

    @Schema(description = "Template description", nullable = true)
    private String description;

    @Schema(description = "Rejection reason (if rejected)", nullable = true)
    private String rejectionReason;

    @Schema(description = "Current version number", example = "1")
    private Integer currentVersion;

    @Schema(description = "Meta submission ID", nullable = true)
    private String metaSubmissionId;

    @Schema(description = "Created at timestamp", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Updated at timestamp", example = "2024-01-01T12:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "Created by user", nullable = true)
    private String createdBy;

    @Schema(description = "Updated by user", nullable = true)
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

    public TemplateStatus getStatus() {
        return status;
    }

    public void setStatus(TemplateStatus status) {
        this.status = status;
    }

    public String getWhatsAppTemplateId() {
        return whatsAppTemplateId;
    }

    public void setWhatsAppTemplateId(String whatsAppTemplateId) {
        this.whatsAppTemplateId = whatsAppTemplateId;
    }

    public List<Map<String, Object>> getComponents() {
        return components;
    }

    public void setComponents(List<Map<String, Object>> components) {
        this.components = components;
    }

    public List<TemplateVariableResponse> getVariables() {
        return variables;
    }

    public void setVariables(List<TemplateVariableResponse> variables) {
        this.variables = variables;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    public Integer getCurrentVersion() {
        return currentVersion;
    }

    public void setCurrentVersion(Integer currentVersion) {
        this.currentVersion = currentVersion;
    }

    public String getMetaSubmissionId() {
        return metaSubmissionId;
    }

    public void setMetaSubmissionId(String metaSubmissionId) {
        this.metaSubmissionId = metaSubmissionId;
    }
}
