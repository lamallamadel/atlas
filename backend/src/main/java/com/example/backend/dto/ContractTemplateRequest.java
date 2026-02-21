package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ContractTemplateRequest {

    @NotBlank(message = "Template name is required")
    private String templateName;

    @NotBlank(message = "Template type is required")
    private String templateType;

    private String description;

    private String signatureFields;

    private Boolean isActive = true;

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateType() {
        return templateType;
    }

    public void setTemplateType(String templateType) {
        this.templateType = templateType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSignatureFields() {
        return signatureFields;
    }

    public void setSignatureFields(String signatureFields) {
        this.signatureFields = signatureFields;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
