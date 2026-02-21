package com.example.backend.dto;

import com.example.backend.entity.SignatureRequestEntity;
import org.springframework.stereotype.Component;

@Component
public class SignatureRequestMapper {

    public SignatureRequestResponse toResponse(SignatureRequestEntity entity) {
        if (entity == null) {
            return null;
        }

        SignatureRequestResponse response = new SignatureRequestResponse();
        response.setId(entity.getId());
        response.setDossierId(entity.getDossierId());
        response.setTemplateId(entity.getTemplateId());
        response.setEnvelopeId(entity.getEnvelopeId());
        response.setStatus(entity.getStatus());
        response.setSigners(entity.getSigners());
        response.setSubject(entity.getSubject());
        response.setEmailMessage(entity.getEmailMessage());
        response.setSentAt(entity.getSentAt());
        response.setViewedAt(entity.getViewedAt());
        response.setSignedAt(entity.getSignedAt());
        response.setCompletedAt(entity.getCompletedAt());
        response.setDeclinedAt(entity.getDeclinedAt());
        response.setVoidedAt(entity.getVoidedAt());
        response.setDeclinedReason(entity.getDeclinedReason());
        response.setVoidedReason(entity.getVoidedReason());
        response.setSignedDocumentId(entity.getSignedDocumentId());
        response.setCertificatePath(entity.getCertificatePath());
        response.setAuditTrail(entity.getAuditTrail());
        response.setWorkflowTriggered(entity.getWorkflowTriggered());
        response.setExpiresAt(entity.getExpiresAt());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setCreatedBy(entity.getCreatedBy());

        return response;
    }
}
