package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public class TemplateTranslationRequest {

    @NotBlank(message = "Language code is required")
    @Pattern(
            regexp = "^[a-z]{2}_[A-Z]{2}$",
            message = "Language code must be in format: xx_XX (e.g., fr_FR, en_US, ar_MA)")
    private String languageCode;

    @NotNull(message = "Components are required")
    private List<Map<String, Object>> components;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private Boolean setRtlDirection;

    public TemplateTranslationRequest() {}

    public String getLanguageCode() {
        return languageCode;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }

    public List<Map<String, Object>> getComponents() {
        return components;
    }

    public void setComponents(List<Map<String, Object>> components) {
        this.components = components;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getSetRtlDirection() {
        return setRtlDirection;
    }

    public void setSetRtlDirection(Boolean setRtlDirection) {
        this.setRtlDirection = setRtlDirection;
    }
}
