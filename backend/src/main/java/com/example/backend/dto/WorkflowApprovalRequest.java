package com.example.backend.dto;

import com.example.backend.entity.enums.WorkflowStepStatus;
import jakarta.validation.constraints.NotNull;

public class WorkflowApprovalRequest {

    @NotNull
    private WorkflowStepStatus decision;

    private String comments;

    private String reason;

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
}
