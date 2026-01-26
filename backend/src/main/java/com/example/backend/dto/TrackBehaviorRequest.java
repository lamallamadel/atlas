package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class TrackBehaviorRequest {
    @NotBlank
    private String actionType;
    private String contextType;
    private Long contextId;

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getContextType() {
        return contextType;
    }

    public void setContextType(String contextType) {
        this.contextType = contextType;
    }

    public Long getContextId() {
        return contextId;
    }

    public void setContextId(Long contextId) {
        this.contextId = contextId;
    }
}
