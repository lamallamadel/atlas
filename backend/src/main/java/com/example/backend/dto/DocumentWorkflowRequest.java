package com.example.backend.dto;

import com.example.backend.entity.enums.DocumentWorkflowType;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class DocumentWorkflowRequest {

    @NotNull
    private Long documentId;

    private Long dossierId;

    private Long templateId;

    @NotNull
    private String workflowName;

    @NotNull
    private DocumentWorkflowType workflowType;

    private Map<String, Object> workflowConfig;

    private Map<String, Object> contextData;

    private Long propertyValue;

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getWorkflowName() {
        return workflowName;
    }

    public void setWorkflowName(String workflowName) {
        this.workflowName = workflowName;
    }

    public DocumentWorkflowType getWorkflowType() {
        return workflowType;
    }

    public void setWorkflowType(DocumentWorkflowType workflowType) {
        this.workflowType = workflowType;
    }

    public Map<String, Object> getWorkflowConfig() {
        return workflowConfig;
    }

    public void setWorkflowConfig(Map<String, Object> workflowConfig) {
        this.workflowConfig = workflowConfig;
    }

    public Map<String, Object> getContextData() {
        return contextData;
    }

    public void setContextData(Map<String, Object> contextData) {
        this.contextData = contextData;
    }

    public Long getPropertyValue() {
        return propertyValue;
    }

    public void setPropertyValue(Long propertyValue) {
        this.propertyValue = propertyValue;
    }
}
