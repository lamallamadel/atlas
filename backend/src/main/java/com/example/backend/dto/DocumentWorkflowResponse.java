package com.example.backend.dto;

import com.example.backend.entity.enums.DocumentWorkflowType;
import com.example.backend.entity.enums.WorkflowStatus;
import java.time.LocalDateTime;
import java.util.Map;

public class DocumentWorkflowResponse {

    private Long id;
    private Long documentId;
    private Long dossierId;
    private Long templateId;
    private String workflowName;
    private DocumentWorkflowType workflowType;
    private WorkflowStatus status;
    private Integer currentStepOrder;
    private Map<String, Object> workflowConfig;
    private Map<String, Object> contextData;
    private String initiatedBy;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private Long propertyValue;
    private Boolean requiresAdditionalApproval;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public WorkflowStatus getStatus() {
        return status;
    }

    public void setStatus(WorkflowStatus status) {
        this.status = status;
    }

    public Integer getCurrentStepOrder() {
        return currentStepOrder;
    }

    public void setCurrentStepOrder(Integer currentStepOrder) {
        this.currentStepOrder = currentStepOrder;
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

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public Long getPropertyValue() {
        return propertyValue;
    }

    public void setPropertyValue(Long propertyValue) {
        this.propertyValue = propertyValue;
    }

    public Boolean getRequiresAdditionalApproval() {
        return requiresAdditionalApproval;
    }

    public void setRequiresAdditionalApproval(Boolean requiresAdditionalApproval) {
        this.requiresAdditionalApproval = requiresAdditionalApproval;
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
