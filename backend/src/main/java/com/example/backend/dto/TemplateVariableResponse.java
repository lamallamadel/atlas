package com.example.backend.dto;

import com.example.backend.entity.enums.ComponentType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Template variable response")
public class TemplateVariableResponse {

    @Schema(description = "Variable ID", example = "1")
    private Long id;

    @Schema(description = "Variable name", example = "customer_name")
    private String variableName;

    @Schema(description = "Component type", example = "BODY")
    private ComponentType componentType;

    @Schema(description = "Variable position", example = "1")
    private Integer position;

    @Schema(description = "Example value", example = "John Doe", nullable = true)
    private String exampleValue;

    @Schema(description = "Variable description", nullable = true)
    private String description;

    @Schema(description = "Is required", example = "true")
    private Boolean isRequired;

    @Schema(description = "Created at timestamp", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Updated at timestamp", example = "2024-01-01T12:00:00")
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVariableName() {
        return variableName;
    }

    public void setVariableName(String variableName) {
        this.variableName = variableName;
    }

    public ComponentType getComponentType() {
        return componentType;
    }

    public void setComponentType(ComponentType componentType) {
        this.componentType = componentType;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public String getExampleValue() {
        return exampleValue;
    }

    public void setExampleValue(String exampleValue) {
        this.exampleValue = exampleValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsRequired() {
        return isRequired;
    }

    public void setIsRequired(Boolean isRequired) {
        this.isRequired = isRequired;
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
}
