package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Workflow template response")
public class WorkflowTemplateResponse {

    @Schema(description = "Template ID", example = "1")
    private Long id;

    @Schema(description = "Template name", example = "Standard Sales Workflow")
    private String name;

    @Schema(description = "Template description")
    private String description;

    @Schema(description = "Template category", example = "SALE")
    private String category;

    @Schema(description = "Case type", example = "SALE")
    private String caseType;

    @Schema(description = "Number of states in the workflow", example = "5")
    private Integer stateCount;

    @Schema(description = "Number of transitions in the workflow", example = "8")
    private Integer transitionCount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String caseType) {
        this.caseType = caseType;
    }

    public Integer getStateCount() {
        return stateCount;
    }

    public void setStateCount(Integer stateCount) {
        this.stateCount = stateCount;
    }

    public Integer getTransitionCount() {
        return transitionCount;
    }

    public void setTransitionCount(Integer transitionCount) {
        this.transitionCount = transitionCount;
    }
}
