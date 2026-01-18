package com.example.backend.dto;

import com.example.backend.entity.OutboundMessageEntity;
import org.springframework.stereotype.Component;

@Component
public class OutboundMessageMapper {
    
    public OutboundMessageResponse toResponse(OutboundMessageEntity entity) {
        if (entity == null) {
            return null;
        }
        
        OutboundMessageResponse response = new OutboundMessageResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setDossierId(entity.getDossierId());
        response.setChannel(entity.getChannel());
        response.setDirection(entity.getDirection());
        response.setTo(entity.getTo());
        response.setTemplateCode(entity.getTemplateCode());
        response.setSubject(entity.getSubject());
        response.setPayloadJson(entity.getPayloadJson());
        response.setStatus(entity.getStatus());
        response.setProviderMessageId(entity.getProviderMessageId());
        response.setIdempotencyKey(entity.getIdempotencyKey());
        response.setAttemptCount(entity.getAttemptCount());
        response.setMaxAttempts(entity.getMaxAttempts());
        response.setErrorCode(entity.getErrorCode());
        response.setErrorMessage(entity.getErrorMessage());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        
        return response;
    }
}
