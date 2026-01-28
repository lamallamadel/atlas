package com.example.backend.entity;

import com.example.backend.entity.enums.WorkflowStepStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_approval")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WorkflowApprovalEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "workflow_id", nullable = false)
    private Long workflowId;

    @Column(name = "step_id", nullable = false)
    private Long stepId;

    @Column(name = "approver_id", nullable = false, length = 255)
    private String approverId;

    @Column(name = "approver_name", length = 255)
    private String approverName;

    @Column(name = "approver_email", length = 255)
    private String approverEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", length = 50)
    private WorkflowStepStatus decision;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @Column(name = "reminder_sent_at")
    private LocalDateTime reminderSentAt;

    @Column(name = "reminder_count")
    private Integer reminderCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", insertable = false, updatable = false)
    private DocumentWorkflowEntity workflow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", insertable = false, updatable = false)
    private WorkflowStepEntity step;

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

    public Long getStepId() {
        return stepId;
    }

    public void setStepId(Long stepId) {
        this.stepId = stepId;
    }

    public String getApproverId() {
        return approverId;
    }

    public void setApproverId(String approverId) {
        this.approverId = approverId;
    }

    public String getApproverName() {
        return approverName;
    }

    public void setApproverName(String approverName) {
        this.approverName = approverName;
    }

    public String getApproverEmail() {
        return approverEmail;
    }

    public void setApproverEmail(String approverEmail) {
        this.approverEmail = approverEmail;
    }

    public WorkflowStepStatus getDecision() {
        return decision;
    }

    public void setDecision(WorkflowStepStatus decision) {
        this.decision = decision;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }

    public LocalDateTime getNotifiedAt() {
        return notifiedAt;
    }

    public void setNotifiedAt(LocalDateTime notifiedAt) {
        this.notifiedAt = notifiedAt;
    }

    public LocalDateTime getReminderSentAt() {
        return reminderSentAt;
    }

    public void setReminderSentAt(LocalDateTime reminderSentAt) {
        this.reminderSentAt = reminderSentAt;
    }

    public Integer getReminderCount() {
        return reminderCount;
    }

    public void setReminderCount(Integer reminderCount) {
        this.reminderCount = reminderCount;
    }

    public DocumentWorkflowEntity getWorkflow() {
        return workflow;
    }

    public void setWorkflow(DocumentWorkflowEntity workflow) {
        this.workflow = workflow;
    }

    public WorkflowStepEntity getStep() {
        return step;
    }

    public void setStep(WorkflowStepEntity step) {
        this.step = step;
    }
}
