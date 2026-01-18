package com.example.backend.dto;

import com.example.backend.entity.WorkflowTransition;
import org.springframework.stereotype.Component;

@Component
public class WorkflowTransitionMapper {

    public WorkflowTransitionResponse toResponse(WorkflowTransition entity) {
        WorkflowTransitionResponse response = new WorkflowTransitionResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setDossierId(entity.getDossierId());
        response.setCaseType(entity.getCaseType());
        response.setFromStatus(entity.getFromStatus());
        response.setToStatus(entity.getToStatus());
        response.setIsAllowed(entity.getIsAllowed());
        response.setValidationErrorsJson(entity.getValidationErrorsJson());
        response.setUserId(entity.getUserId());
        response.setReason(entity.getReason());
        response.setTransitionedAt(entity.getTransitionedAt());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }
}
