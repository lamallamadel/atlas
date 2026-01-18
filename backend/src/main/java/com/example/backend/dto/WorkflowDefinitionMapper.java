package com.example.backend.dto;

import com.example.backend.entity.WorkflowDefinition;
import org.springframework.stereotype.Component;

@Component
public class WorkflowDefinitionMapper {

    public WorkflowDefinitionResponse toResponse(WorkflowDefinition entity) {
        WorkflowDefinitionResponse response = new WorkflowDefinitionResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setCaseType(entity.getCaseType());
        response.setFromStatus(entity.getFromStatus());
        response.setToStatus(entity.getToStatus());
        response.setIsActive(entity.getIsActive());
        response.setConditionsJson(entity.getConditionsJson());
        response.setRequiredFieldsJson(entity.getRequiredFieldsJson());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setCreatedBy(entity.getCreatedBy());
        response.setUpdatedBy(entity.getUpdatedBy());
        return response;
    }

    public WorkflowDefinition toEntity(WorkflowDefinitionRequest request) {
        WorkflowDefinition entity = new WorkflowDefinition();
        entity.setCaseType(request.getCaseType());
        entity.setFromStatus(request.getFromStatus());
        entity.setToStatus(request.getToStatus());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setConditionsJson(request.getConditionsJson());
        entity.setRequiredFieldsJson(request.getRequiredFieldsJson());
        return entity;
    }

    public void updateEntity(WorkflowDefinition entity, WorkflowDefinitionRequest request) {
        if (request.getCaseType() != null) {
            entity.setCaseType(request.getCaseType());
        }
        if (request.getFromStatus() != null) {
            entity.setFromStatus(request.getFromStatus());
        }
        if (request.getToStatus() != null) {
            entity.setToStatus(request.getToStatus());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getConditionsJson() != null) {
            entity.setConditionsJson(request.getConditionsJson());
        }
        if (request.getRequiredFieldsJson() != null) {
            entity.setRequiredFieldsJson(request.getRequiredFieldsJson());
        }
    }
}
