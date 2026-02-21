package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


import java.util.ArrayList;
import java.util.List;


import java.util.Map;

@Schema(description = "Request body for creating or updating a workflow definition")
public class WorkflowDefinitionRequest {

    @Schema(description = "Workflow name", example = "Sales Lead Workflow", required = true)
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Schema(description = "Workflow description", example = "Standard workflow for sales leads")
    private String description;

    @Schema(description = "Case type code", example = "SALE", required = true)
    @NotBlank(message = "Case type is required")
    @Size(max = 100, message = "Case type must not exceed 100 characters")
    private String caseType;

    @Schema(description = "Whether this workflow is active", example = "true")
    private Boolean isActive;

    @Schema(description = "Whether this workflow is published", example = "false")
    private Boolean isPublished;


    @Schema(description = "Whether this is a template", example = "false")
    private Boolean isTemplate;

    @Schema(description = "Template category if this is a template", example = "SALE")
    private String templateCategory;

    @Schema(description = "States in the workflow")
    private List<Map<String, Object>> statesJson = new ArrayList<>();

    @Schema(description = "Transitions in the workflow")
    private List<Map<String, Object>> transitionsJson = new ArrayList<>();

    @Schema(description = "Workflow metadata")
    private Map<String, Object> metadataJson;

    @Schema(description = "Initial state code", example = "NEW")
    private String initialState;

    @Schema(description = "Comma-separated list of final states", example = "WON,LOST")
    private String finalStates;

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
}
