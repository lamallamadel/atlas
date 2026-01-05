package com.example.backend.service;

import com.example.backend.dto.AuditEventResponse;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.util.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditEventService {

    private final AuditEventRepository auditEventRepository;

    public AuditEventService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @Transactional(readOnly = true)
    public Page<AuditEventResponse> listByEntity(AuditEntityType entityType, Long entityId, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<AuditEventEntity> auditEvents = auditEventRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        return auditEvents.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditEventResponse> listByDossier(Long dossierId, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<AuditEventEntity> auditEvents = auditEventRepository.findByDossierId(dossierId, pageable);
        return auditEvents.map(this::toResponse);
    }

    private AuditEventResponse toResponse(AuditEventEntity entity) {
        AuditEventResponse response = new AuditEventResponse();
        response.setId(entity.getId());
        response.setEntityType(entity.getEntityType());
        response.setEntityId(entity.getEntityId());
        response.setAction(entity.getAction());
        response.setUserId(entity.getUserId());
        response.setDiff(entity.getDiff());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }
}
