package com.example.backend.entity;

import com.example.backend.entity.enums.DocumentWorkflowType;
import com.example.backend.entity.enums.WorkflowStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "document_workflow")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class DocumentWorkflowEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "dossier_id")
    private Long dossierId;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "workflow_name", nullable = false, length = 255)
    private String workflowName;

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_type", nullable = false, length = 50)
    private DocumentWorkflowType workflowType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private WorkflowStatus status = WorkflowStatus.DRAFT;

    @Column(name = "current_step_order")
    private Integer currentStepOrder;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "workflow_config")
    private Map<String, Object> workflowConfig;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "context_data")
    private Map<String, Object> contextData;

    @Column(name = "initiated_by", length = 255)
    private String initiatedBy;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "property_value")
    private Long propertyValue;

    @Column(name = "requires_additional_approval", nullable = false)
    private Boolean requiresAdditionalApproval = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", insertable = false, updatable = false)
    private DocumentEntity document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", insertable = false, updatable = false)
    private Dossier dossier;

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

    public DocumentEntity getDocument() {
        return document;
    }

    public void setDocument(DocumentEntity document) {
        this.document = document;
    }

    public Dossier getDossier() {
        return dossier;
    }

    public void setDossier(Dossier dossier) {
        this.dossier = dossier;
    }
}
