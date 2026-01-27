package com.example.backend.dto;

import com.example.backend.entity.WorkflowDefinition;
import org.springframework.stereotype.Component;

@Component
public class WorkflowDefinitionMapper {

    public WorkflowDefinitionResponse toResponse(WorkflowDefinition entity) {
        WorkflowDefinitionResponse response = new WorkflowDefinitionResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        response.setCaseType(entity.getCaseType());
        response.setVersion(entity.getVersion());
        response.setIsActive(entity.getIsActive());
        response.setIsPublished(entity.getIsPublished());
        response.setIsTemplate(entity.getIsTemplate());
        response.setTemplateCategory(entity.getTemplateCategory());
        response.setParentVersionId(entity.getParentVersionId());
        response.setStatesJson(entity.getStatesJson());
        response.setTransitionsJson(entity.getTransitionsJson());
        response.setMetadataJson(entity.getMetadataJson());
        response.setInitialState(entity.getInitialState());
        response.setFinalStates(entity.getFinalStates());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setCreatedBy(entity.getCreatedBy());
        response.setUpdatedBy(entity.getUpdatedBy());
        return response;
    }

    public WorkflowDefinition toEntity(WorkflowDefinitionRequest request) {
        WorkflowDefinition entity = new WorkflowDefinition();
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setCaseType(request.getCaseType());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : false);
        entity.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : false);
        entity.setIsTemplate(request.getIsTemplate() != null ? request.getIsTemplate() : false);
        entity.setTemplateCategory(request.getTemplateCategory());
        entity.setStatesJson(request.getStatesJson());
        entity.setTransitionsJson(request.getTransitionsJson());
        entity.setMetadataJson(request.getMetadataJson());
        entity.setInitialState(request.getInitialState());
        entity.setFinalStates(request.getFinalStates());
        return entity;
    }

    public void updateEntity(WorkflowDefinition entity, WorkflowDefinitionRequest request) {
        if (request.getName() != null) {
            entity.setName(request.getName());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getCaseType() != null) {
            entity.setCaseType(request.getCaseType());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getIsPublished() != null) {
            entity.setIsPublished(request.getIsPublished());
        }
        if (request.getIsTemplate() != null) {
            entity.setIsTemplate(request.getIsTemplate());
        }
        if (request.getTemplateCategory() != null) {
            entity.setTemplateCategory(request.getTemplateCategory());
        }
        if (request.getStatesJson() != null) {
            entity.setStatesJson(request.getStatesJson());
        }
        if (request.getTransitionsJson() != null) {
            entity.setTransitionsJson(request.getTransitionsJson());
        }
        if (request.getMetadataJson() != null) {
            entity.setMetadataJson(request.getMetadataJson());
        }
        if (request.getInitialState() != null) {
            entity.setInitialState(request.getInitialState());
        }
        if (request.getFinalStates() != null) {
            entity.setFinalStates(request.getFinalStates());
        }
    }
}
