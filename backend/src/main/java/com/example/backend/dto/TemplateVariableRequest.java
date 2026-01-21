package com.example.backend.dto;

import com.example.backend.entity.enums.ComponentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Request body for template variable")
public class TemplateVariableRequest {

    @Schema(description = "Variable name", example = "customer_name", required = true)
    @NotBlank(message = "Variable name is required")
    @Size(max = 255, message = "Variable name must not exceed 255 characters")
    private String variableName;

    @Schema(description = "Component type where variable is used", example = "BODY", required = true)
    @NotNull(message = "Component type is required")
    private ComponentType componentType;

    @Schema(description = "Variable position in component", example = "1", required = true)
    @NotNull(message = "Position is required")
    private Integer position;

    @Schema(description = "Example value for variable", example = "John Doe", nullable = true)
    @Size(max = 1024, message = "Example value must not exceed 1024 characters")
    private String exampleValue;

    @Schema(description = "Variable description", nullable = true)
    private String description;

    @Schema(description = "Is variable required", example = "true", defaultValue = "true")
    private Boolean isRequired = true;

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
}
