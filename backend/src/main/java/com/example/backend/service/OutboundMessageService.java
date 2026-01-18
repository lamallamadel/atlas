package com.example.backend.service;

import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OutboundMessageService {
    
    private static final Logger logger = LoggerFactory.getLogger(OutboundMessageService.class);
    
    private final OutboundMessageRepository outboundMessageRepository;
    private final ConsentementRepository consentementRepository;
    private final DossierRepository dossierRepository;
    private final AuditEventService auditEventService;
    
    public OutboundMessageService(
            OutboundMessageRepository outboundMessageRepository,
            ConsentementRepository consentementRepository,
            DossierRepository dossierRepository,
            AuditEventService auditEventService) {
        this.outboundMessageRepository = outboundMessageRepository;
        this.consentementRepository = consentementRepository;
        this.dossierRepository = dossierRepository;
        this.auditEventService = auditEventService;
    }
    
    @Transactional
    public OutboundMessageEntity createOutboundMessage(
            Long dossierId,
            MessageChannel channel,
            String to,
            String templateCode,
            String subject,
            java.util.Map<String, Object> payloadJson,
            String idempotencyKey) {
        
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        
        if (idempotencyKey == null || idempotencyKey.isEmpty()) {
            idempotencyKey = UUID.randomUUID().toString();
        }
        
        Optional<OutboundMessageEntity> existing = outboundMessageRepository
            .findByOrgIdAndIdempotencyKey(orgId, idempotencyKey);
        
        if (existing.isPresent()) {
            logger.info("Returning existing outbound message for idempotency key: {}", idempotencyKey);
            return existing.get();
        }
        
        if (dossierId != null) {
            Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));
            
            if (!orgId.equals(dossier.getOrgId())) {
                throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
            }
            
            validateConsent(dossierId, channel);
        }
        
        OutboundMessageEntity message = new OutboundMessageEntity();
        message.setOrgId(orgId);
        message.setDossierId(dossierId);
        message.setChannel(channel);
        message.setDirection("OUTBOUND");
        message.setTo(to);
        message.setTemplateCode(templateCode);
        message.setSubject(subject);
        message.setPayloadJson(payloadJson);
        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setIdempotencyKey(idempotencyKey);
        message.setAttemptCount(0);
        message.setMaxAttempts(5);
        
        LocalDateTime now = LocalDateTime.now();
        message.setCreatedAt(now);
        message.setUpdatedAt(now);
        
        OutboundMessageEntity saved = outboundMessageRepository.save(message);
        
        logger.info("Created outbound message: id={}, orgId={}, dossierId={}, channel={}, to={}", 
            saved.getId(), orgId, dossierId, channel, to);
        
        if (auditEventService != null) {
            try {
                auditEventService.logEvent(
                    "OUTBOUND_MESSAGE",
                    saved.getId(),
                    "CREATED",
                    String.format("Outbound message created: channel=%s, to=%s, template=%s", 
                        channel, to, templateCode)
                );
            } catch (Exception e) {
                logger.warn("Failed to log audit event for outbound message creation", e);
            }
        }
        
        return saved;
    }
    
    private void validateConsent(Long dossierId, MessageChannel channel) {
        ConsentementChannel consentChannel = mapMessageChannelToConsentChannel(channel);
        
        List<ConsentementEntity> consents = consentementRepository
            .findByDossierIdAndChannelOrderByUpdatedAtDesc(dossierId, consentChannel);
        
        if (consents.isEmpty()) {
            logger.warn("No consent found for dossier {} and channel {}", dossierId, channel);
            
            if (auditEventService != null) {
                try {
                    auditEventService.logEvent(
                        "DOSSIER",
                        dossierId,
                        "BLOCKED_BY_POLICY",
                        String.format("Outbound message blocked: no consent for channel %s", channel)
                    );
                } catch (Exception e) {
                    logger.warn("Failed to log audit event for blocked message", e);
                }
            }
            
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                String.format("Consent required: No consent found for channel %s. Message blocked by policy.", channel)
            );
        }
        
        ConsentementEntity latestConsent = consents.get(0);
        
        if (latestConsent.getStatus() != ConsentementStatus.GRANTED) {
            logger.warn("Consent not granted for dossier {} and channel {}. Status: {}", 
                dossierId, channel, latestConsent.getStatus());
            
            if (auditEventService != null) {
                try {
                    auditEventService.logEvent(
                        "DOSSIER",
                        dossierId,
                        "BLOCKED_BY_POLICY",
                        String.format("Outbound message blocked: consent status is %s for channel %s", 
                            latestConsent.getStatus(), channel)
                    );
                } catch (Exception e) {
                    logger.warn("Failed to log audit event for blocked message", e);
                }
            }
            
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                String.format("Consent required: Consent status is %s for channel %s. Message blocked by policy.", 
                    latestConsent.getStatus(), channel)
            );
        }
        
        logger.debug("Consent validation passed for dossier {} and channel {}", dossierId, channel);
    }
    
    private ConsentementChannel mapMessageChannelToConsentChannel(MessageChannel channel) {
        return switch (channel) {
            case EMAIL -> ConsentementChannel.EMAIL;
            case SMS -> ConsentementChannel.SMS;
            case WHATSAPP -> ConsentementChannel.WHATSAPP;
            case PHONE -> ConsentementChannel.PHONE;
            default -> throw new IllegalArgumentException("Unsupported message channel for consent validation: " + channel);
        };
    }
    
    @Transactional(readOnly = true)
    public OutboundMessageEntity getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        
        OutboundMessageEntity message = outboundMessageRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Outbound message not found with id: " + id));
        
        if (!orgId.equals(message.getOrgId())) {
            throw new EntityNotFoundException("Outbound message not found with id: " + id);
        }
        
        return message;
    }
    
    @Transactional(readOnly = true)
    public List<OutboundMessageEntity> listByDossier(Long dossierId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));
        
        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }
        
        return outboundMessageRepository.findByDossierId(dossierId);
    }
    
    @Transactional(readOnly = true)
    public Page<OutboundMessageEntity> listByDossierPaginated(Long dossierId, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));
        
        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }
        
        return outboundMessageRepository.findByDossierId(dossierId, pageable);
    }
    
    @Transactional
    public OutboundMessageEntity updateStatus(Long id, OutboundMessageStatus status, String errorCode, String errorMessage) {
        OutboundMessageEntity message = outboundMessageRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Outbound message not found with id: " + id));
        
        message.setStatus(status);
        message.setErrorCode(errorCode);
        message.setErrorMessage(errorMessage);
        message.setUpdatedAt(LocalDateTime.now());
        
        return outboundMessageRepository.save(message);
    }
    
    @Transactional
    public OutboundMessageEntity updateProviderMessageId(Long id, String providerMessageId) {
        OutboundMessageEntity message = outboundMessageRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Outbound message not found with id: " + id));
        
        message.setProviderMessageId(providerMessageId);
        message.setUpdatedAt(LocalDateTime.now());
        
        return outboundMessageRepository.save(message);
    }
}
