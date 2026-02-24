package com.example.backend.entity;

import com.example.backend.entity.enums.WorkflowStepStatus;
import com.example.backend.entity.enums.WorkflowStepType;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "workflow_step")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WorkflowStepEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "workflow_id", nullable = false)
    private Long workflowId;

    @Column(name = "step_name", nullable = false, length = 255)
    private String stepName;

    @Column(name = "step_description", columnDefinition = "TEXT")
    private String stepDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "step_type", nullable = false, length = 50)
    private WorkflowStepType stepType;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private WorkflowStepStatus status = WorkflowStepStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "assigned_approvers")
    private List<String> assignedApprovers;

    @Column(name = "approvals_required")
    private Integer approvalsRequired;

    @Column(name = "approvals_received")
    private Integer approvalsReceived = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step_config")
    private Map<String, Object> stepConfig;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "condition_rules")
    private Map<String, Object> conditionRules;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "is_parallel", nullable = false)
    private Boolean isParallel = false;

    @Column(name = "requires_all_approvers", nullable = false)
    private Boolean requiresAllApprovers = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", insertable = false, updatable = false)
    private DocumentWorkflowEntity workflow;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWorkflowId() {
        return workflowId;
    }

    public void setWorkflowId(Long workflowId) {
        this.workflowId = workflowId;
    }

    public String getStepName() {
        return stepName;
    }

    public void setStepName(String stepName) {
        this.stepName = stepName;
    }

    public String getStepDescription() {
        return stepDescription;
    }

    public void setStepDescription(String stepDescription) {
        this.stepDescription = stepDescription;
    }

    public WorkflowStepType getStepType() {
        return stepType;
    }

    public void setStepType(WorkflowStepType stepType) {
        this.stepType = stepType;
    }

    public Integer getStepOrder() {
        return stepOrder;
    }

    public void setStepOrder(Integer stepOrder) {
        this.stepOrder = stepOrder;
    }

    public WorkflowStepStatus getStatus() {
        return status;
    }

    public void setStatus(WorkflowStepStatus status) {
        this.status = status;
    }

    public List<String> getAssignedApprovers() {
        return assignedApprovers;
    }

    public void setAssignedApprovers(List<String> assignedApprovers) {
        this.assignedApprovers = assignedApprovers;
    }

    public Integer getApprovalsRequired() {
        return approvalsRequired;
    }

    public void setApprovalsRequired(Integer approvalsRequired) {
        this.approvalsRequired = approvalsRequired;
    }

    public Integer getApprovalsReceived() {
        return approvalsReceived;
    }

    public void setApprovalsReceived(Integer approvalsReceived) {
        this.approvalsReceived = approvalsReceived;
    }

    public Map<String, Object> getStepConfig() {
        return stepConfig;
    }

    public void setStepConfig(Map<String, Object> stepConfig) {
        this.stepConfig = stepConfig;
    }

    public Map<String, Object> getConditionRules() {
        return conditionRules;
    }

    public void setConditionRules(Map<String, Object> conditionRules) {
        this.conditionRules = conditionRules;
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

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public Boolean getIsParallel() {
        return isParallel;
    }

    public void setIsParallel(Boolean isParallel) {
        this.isParallel = isParallel;
    }

    public Boolean getRequiresAllApprovers() {
        return requiresAllApprovers;
    }

    public void setRequiresAllApprovers(Boolean requiresAllApprovers) {
        this.requiresAllApprovers = requiresAllApprovers;
    }

    public DocumentWorkflowEntity getWorkflow() {
        return workflow;
    }

    public void setWorkflow(DocumentWorkflowEntity workflow) {
        this.workflow = workflow;
    }
}
