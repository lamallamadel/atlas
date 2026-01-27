package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Schema(description = "Workflow definition response representation")
public class WorkflowDefinitionResponse {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Workflow name", example = "Sales Lead Workflow")
    private String name;

    @Schema(description = "Workflow description")
    private String description;

    @Schema(description = "Case type code", example = "SALE")
    private String caseType;

    @Schema(description = "Workflow version", example = "1")
    private Integer version;

    @Schema(description = "Whether this workflow is active", example = "true")
    private Boolean isActive;

    @Schema(description = "Whether this workflow is published", example = "false")
    private Boolean isPublished;

    @Schema(description = "Whether this is a template", example = "false")
    private Boolean isTemplate;

    @Schema(description = "Template category if this is a template")
    private String templateCategory;

    @Schema(description = "Parent version ID if this is a new version")
    private Long parentVersionId;

    @Schema(description = "States in the workflow")
    private List<Map<String, Object>> statesJson;

    @Schema(description = "Transitions in the workflow")
    private List<Map<String, Object>> transitionsJson;

    @Schema(description = "Workflow metadata")
    private Map<String, Object> metadataJson;

    @Schema(description = "Initial state code")
    private String initialState;

    @Schema(description = "Comma-separated list of final states")
    private String finalStates;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String caseType) {
        this.caseType = caseType;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }

    public Boolean getIsTemplate() {
        return isTemplate;
    }

    public void setIsTemplate(Boolean isTemplate) {
        this.isTemplate = isTemplate;
    }

    public String getTemplateCategory() {
        return templateCategory;
    }

    public void setTemplateCategory(String templateCategory) {
        this.templateCategory = templateCategory;
    }

    public Long getParentVersionId() {
        return parentVersionId;
    }

    public void setParentVersionId(Long parentVersionId) {
        this.parentVersionId = parentVersionId;
    }

    public List<Map<String, Object>> getStatesJson() {
        return statesJson;
    }

    public void setStatesJson(List<Map<String, Object>> statesJson) {
        this.statesJson = statesJson;
    }

    public List<Map<String, Object>> getTransitionsJson() {
        return transitionsJson;
    }

    public void setTransitionsJson(List<Map<String, Object>> transitionsJson) {
        this.transitionsJson = transitionsJson;
    }

    public Map<String, Object> getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(Map<String, Object> metadataJson) {
        this.metadataJson = metadataJson;
    }

    public String getInitialState() {
        return initialState;
    }

    public void setInitialState(String initialState) {
        this.initialState = initialState;
    }

    public String getFinalStates() {
        return finalStates;
    }

    public void setFinalStates(String finalStates) {
        this.finalStates = finalStates;
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
