package com.example.backend.dto;

import com.example.backend.entity.TemplateVariable;
import com.example.backend.entity.WhatsAppTemplate;
import com.example.backend.entity.WhatsAppTemplateVersion;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class WhatsAppTemplateMapper {

    public static WhatsAppTemplateResponse toResponse(WhatsAppTemplate entity) {
        if (entity == null) {
            return null;
        }

        WhatsAppTemplateResponse response = new WhatsAppTemplateResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setName(entity.getName());
        response.setLanguage(entity.getLanguage());
        response.setCategory(entity.getCategory());
        response.setStatus(entity.getStatus());
        response.setWhatsAppTemplateId(entity.getWhatsAppTemplateId());
        response.setComponents(entity.getComponents());
        response.setDescription(entity.getDescription());
        response.setRejectionReason(entity.getRejectionReason());
        response.setCurrentVersion(entity.getCurrentVersion());
        response.setMetaSubmissionId(entity.getMetaSubmissionId());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setCreatedBy(entity.getCreatedBy());
        response.setUpdatedBy(entity.getUpdatedBy());

        if (entity.getVariables() != null && !entity.getVariables().isEmpty()) {
            response.setVariables(entity.getVariables().stream()
                    .map(WhatsAppTemplateMapper::toVariableResponse)
                    .collect(Collectors.toList()));
        }

        return response;
    }

    public static WhatsAppTemplate toEntity(WhatsAppTemplateRequest request) {
        if (request == null) {
            return null;
        }

        WhatsAppTemplate entity = new WhatsAppTemplate();
        entity.setName(request.getName());
        entity.setLanguage(request.getLanguage());
        entity.setCategory(request.getCategory());
        entity.setComponents(request.getComponents());
        entity.setDescription(request.getDescription());

        if (request.getVariables() != null && !request.getVariables().isEmpty()) {
            List<TemplateVariable> variables = request.getVariables().stream()
                    .map(WhatsAppTemplateMapper::toVariableEntity)
                    .collect(Collectors.toList());
            entity.setVariables(variables);
        }

        return entity;
    }

    public static TemplateVariableResponse toVariableResponse(TemplateVariable entity) {
        if (entity == null) {
            return null;
        }

        TemplateVariableResponse response = new TemplateVariableResponse();
        response.setId(entity.getId());
        response.setVariableName(entity.getVariableName());
        response.setComponentType(entity.getComponentType());
        response.setPosition(entity.getPosition());
        response.setExampleValue(entity.getExampleValue());
        response.setDescription(entity.getDescription());
        response.setIsRequired(entity.getIsRequired());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        return response;
    }

    public static TemplateVariable toVariableEntity(TemplateVariableRequest request) {
        if (request == null) {
            return null;
        }

        TemplateVariable entity = new TemplateVariable();
        entity.setVariableName(request.getVariableName());
        entity.setComponentType(request.getComponentType());
        entity.setPosition(request.getPosition());
        entity.setExampleValue(request.getExampleValue());
        entity.setDescription(request.getDescription());
        entity.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : true);

        return entity;
    }

    public static List<WhatsAppTemplateResponse> toResponseList(List<WhatsAppTemplate> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(WhatsAppTemplateMapper::toResponse)
                .collect(Collectors.toList());
    }

    public static TemplateVersionResponse toVersionResponse(WhatsAppTemplateVersion entity) {
        if (entity == null) {
            return null;
        }

        TemplateVersionResponse response = new TemplateVersionResponse();
        response.setId(entity.getId());
        response.setTemplateId(entity.getTemplate() != null ? entity.getTemplate().getId() : null);
        response.setVersionNumber(entity.getVersionNumber());
        response.setComponents(entity.getComponents());
        response.setVariablesSnapshot(entity.getVariablesSnapshot());
        response.setDescription(entity.getDescription());
        response.setChangeSummary(entity.getChangeSummary());
        response.setIsActive(entity.getIsActive());
        response.setCreatedAt(entity.getCreatedAt());
        response.setCreatedBy(entity.getCreatedBy());

        return response;
    }
}
