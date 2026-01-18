package com.example.backend.service;

import com.example.backend.dto.AuditEventResponse;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.util.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

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

        Page<AuditEventEntity> auditEvents = auditEventRepository.findByOrgIdAndEntityTypeAndEntityId(orgId, entityType,
                entityId, pageable);

        return auditEvents.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditEventResponse> listByDossier(Long dossierId, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<AuditEventEntity> auditEvents = auditEventRepository.findByOrgIdAndDossierId(orgId, dossierId, pageable);

        return auditEvents.map(this::toResponse);
    }

    @Transactional
    public void logEvent(String entityType, Long entityId, String action, String details) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        AuditEntityType auditEntityType = parseEntityType(entityType);
        AuditAction auditAction = parseAction(action);

        if (auditEntityType == null || auditAction == null) {
            return;
        }

        String userId = extractUserId();

        AuditEventEntity auditEvent = new AuditEventEntity();
        auditEvent.setEntityType(auditEntityType);
        auditEvent.setEntityId(entityId);
        auditEvent.setAction(auditAction);
        auditEvent.setUserId(userId);
        auditEvent.setOrgId(orgId);

        Map<String, Object> diff = new LinkedHashMap<>();
        diff.put("details", details);
        auditEvent.setDiff(diff);

        LocalDateTime now = LocalDateTime.now();
        auditEvent.setCreatedAt(now);
        auditEvent.setUpdatedAt(now);

        auditEventRepository.save(auditEvent);
    }

    private AuditEntityType parseEntityType(String entityType) {
        try {
            return AuditEntityType.valueOf(entityType);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private AuditAction parseAction(String action) {
        try {
            return AuditAction.valueOf(action);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String extractUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof Jwt jwt) {
                String sub = jwt.getSubject();
                if (sub != null) return sub;
            }
            return authentication.getName();
        }
        return null;
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
