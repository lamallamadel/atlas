package com.example.backend.dto;

import com.example.backend.entity.ContractTemplateEntity;
import org.springframework.stereotype.Component;

@Component
public class ContractTemplateMapper {

    public ContractTemplateResponse toResponse(ContractTemplateEntity entity) {
        if (entity == null) {
            return null;
        }

        ContractTemplateResponse response = new ContractTemplateResponse();
        response.setId(entity.getId());
        response.setTemplateName(entity.getTemplateName());
        response.setTemplateType(entity.getTemplateType());
        response.setFileName(entity.getFileName());
        response.setStoragePath(entity.getStoragePath());
        response.setFileSize(entity.getFileSize());
        response.setDescription(entity.getDescription());
        response.setSignatureFields(entity.getSignatureFields());
        response.setIsActive(entity.getIsActive());
        response.setDocusignTemplateId(entity.getDocusignTemplateId());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setCreatedBy(entity.getCreatedBy());

        return response;
    }
}
