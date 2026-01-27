package com.example.backend.dto;

import com.example.backend.entity.NotificationEntity;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(NotificationEntity entity) {
        if (entity == null) {
            return null;
        }

        NotificationResponse response = new NotificationResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setDossierId(entity.getDossierId());
        response.setType(entity.getType());
        response.setStatus(entity.getStatus());
        response.setTemplateId(entity.getTemplateId());
        response.setVariables(entity.getVariables());
        response.setRecipient(entity.getRecipient());
        response.setSubject(entity.getSubject());
        response.setErrorMessage(entity.getErrorMessage());
        response.setRetryCount(entity.getRetryCount());
        response.setMaxRetries(entity.getMaxRetries());
        response.setSentAt(entity.getSentAt());
        response.setReadAt(entity.getReadAt());
        response.setMessage(entity.getMessage());
        response.setActionUrl(entity.getActionUrl());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        return response;
    }
}
