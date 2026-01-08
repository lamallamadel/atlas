package com.example.backend.dto;

import com.example.backend.entity.ConsentementEntity;
import org.springframework.stereotype.Component;

@Component
public class ConsentementMapper {

    public ConsentementEntity toEntity(ConsentementCreateRequest request) {
        ConsentementEntity consentement = new ConsentementEntity();
        consentement.setChannel(request.getChannel());
        consentement.setConsentType(request.getConsentType());
        consentement.setStatus(request.getStatus());
        consentement.setMeta(request.getMeta());
        return consentement;
    }

    public ConsentementResponse toResponse(ConsentementEntity consentement) {
        ConsentementResponse response = new ConsentementResponse();
        response.setId(consentement.getId());
        response.setOrgId(consentement.getOrgId());
        response.setDossierId(consentement.getDossier() != null ? consentement.getDossier().getId() : null);
        response.setChannel(consentement.getChannel());
        response.setConsentType(consentement.getConsentType());
        response.setStatus(consentement.getStatus());
        response.setMeta(consentement.getMeta());
        response.setCreatedAt(consentement.getCreatedAt());
        response.setUpdatedAt(consentement.getUpdatedAt());
        return response;
    }
}
