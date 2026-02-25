package com.example.backend.dto;

import com.example.backend.entity.ConsentEventEntity;
import org.springframework.stereotype.Component;

@Component
public class ConsentEventMapper {

    public ConsentEventResponse toResponse(ConsentEventEntity entity) {
        if (entity == null) {
            return null;
        }

        ConsentEventResponse response = new ConsentEventResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setDossierId(entity.getDossierId());
        response.setConsentementId(entity.getConsentementId());
        response.setEventType(entity.getEventType());
        response.setChannel(entity.getChannel() != null ? entity.getChannel().name() : null);
        response.setConsentType(entity.getConsentType() != null ? entity.getConsentType().name() : null);
        response.setOldStatus(entity.getOldStatus() != null ? entity.getOldStatus().name() : null);
        response.setNewStatus(entity.getNewStatus() != null ? entity.getNewStatus().name() : null);
        response.setMetadata(entity.getMetadata());
        response.setCreatedAt(entity.getCreatedAt());
        response.setCreatedBy(entity.getCreatedBy());

        return response;
    }
}
