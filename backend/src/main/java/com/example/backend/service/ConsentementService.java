package com.example.backend.service;

import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.ConsentementMapper;
import com.example.backend.dto.ConsentementResponse;
import com.example.backend.dto.ConsentementUpdateRequest;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentementService {

    private static final Logger logger = LoggerFactory.getLogger(ConsentementService.class);

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ConsentementRepository consentementRepository;
    private final DossierRepository dossierRepository;
    private final ConsentementMapper consentementMapper;
    private final ActivityService activityService;
    private final OutboundMessageService outboundMessageService;
    private final ConsentEventService consentEventService;

    public ConsentementService(
            ConsentementRepository consentementRepository,
            DossierRepository dossierRepository,
            ConsentementMapper consentementMapper,
            ActivityService activityService,
            OutboundMessageService outboundMessageService,
            ConsentEventService consentEventService) {
        this.consentementRepository = consentementRepository;
        this.dossierRepository = dossierRepository;
        this.consentementMapper = consentementMapper;
        this.activityService = activityService;
        this.outboundMessageService = outboundMessageService;
        this.consentEventService = consentEventService;
    }

    @Transactional
    public ConsentementResponse create(ConsentementCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(request.getDossierId())
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: "
                                                        + request.getDossierId()));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException(
                    "Dossier not found with id: " + request.getDossierId());
        }

        ConsentementEntity consentement = consentementMapper.toEntity(request);
        consentement.setOrgId(orgId);
        consentement.setDossier(dossier);

        LocalDateTime now = LocalDateTime.now();
        consentement.setCreatedAt(now);
        consentement.setUpdatedAt(now);

        Map<String, Object> meta =
                consentement.getMeta() != null
                        ? new HashMap<>(consentement.getMeta())
                        : new HashMap<>();
        meta.put("previousStatus", null);
        meta.put("changedBy", orgId);
        meta.put("changedAt", now.toString());
        consentement.setMeta(meta);

        ConsentementEntity saved = consentementRepository.save(consentement);

        if (saved.getStatus() == ConsentementStatus.GRANTED) {
            logConsentGrantedActivity(saved);
            consentEventService.emitEvent(saved, "GRANTED", null, null);
        } else if (saved.getStatus() == ConsentementStatus.DENIED) {
            consentEventService.emitEvent(saved, "DENIED", null, null);
        } else if (saved.getStatus() == ConsentementStatus.PENDING) {
            consentEventService.emitEvent(saved, "PENDING", null, null);
        }

        return consentementMapper.toResponse(saved);
    }

    @Transactional
    public ConsentementResponse update(Long id, ConsentementUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ConsentementEntity consentement =
                consentementRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Consentement not found with id: " + id));

        if (!orgId.equals(consentement.getOrgId())) {
            throw new EntityNotFoundException("Consentement not found with id: " + id);
        }

        ConsentementStatus previousStatus = consentement.getStatus();

        consentement.setChannel(request.getChannel());
        consentement.setStatus(request.getStatus());

        Map<String, Object> meta =
                consentement.getMeta() != null
                        ? new HashMap<>(consentement.getMeta())
                        : new HashMap<>();
        if (request.getMeta() != null) {
            meta.putAll(request.getMeta());
        }
        meta.put("previousStatus", previousStatus.toString());
        meta.put("changedBy", orgId);
        meta.put("changedAt", LocalDateTime.now().toString());
        consentement.setMeta(meta);

        consentement.setUpdatedAt(LocalDateTime.now());
        ConsentementEntity updated = consentementRepository.save(consentement);

        if (previousStatus != ConsentementStatus.GRANTED
                && updated.getStatus() == ConsentementStatus.GRANTED) {
            logConsentGrantedActivity(updated);
            consentEventService.emitEvent(updated, "GRANTED", previousStatus, null);
        } else if (previousStatus == ConsentementStatus.GRANTED
                && updated.getStatus() == ConsentementStatus.REVOKED) {
            logConsentRevokedActivity(updated, previousStatus);
            consentEventService.emitEvent(updated, "REVOKED", previousStatus, null);
        } else if (updated.getStatus() == ConsentementStatus.EXPIRED) {
            consentEventService.emitEvent(updated, "EXPIRED", previousStatus, null);
        } else if (previousStatus != updated.getStatus()) {
            consentEventService.emitEvent(updated, "STATUS_CHANGED", previousStatus, null);
        }

        return consentementMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public ConsentementResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ConsentementEntity consentement =
                consentementRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Consentement not found with id: " + id));

        if (!orgId.equals(consentement.getOrgId())) {
            throw new EntityNotFoundException("Consentement not found with id: " + id);
        }

        return consentementMapper.toResponse(consentement);
    }

    @Transactional(readOnly = true)
    public List<ConsentementResponse> listByDossier(Long dossierId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        List<ConsentementEntity> consentements = consentementRepository.findByDossierId(dossierId);
        return consentements.stream()
                .map(consentementMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConsentementResponse> listByDossierAndChannel(
            Long dossierId, com.example.backend.entity.enums.ConsentementChannel channel) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        List<ConsentementEntity> consentements;
        if (channel != null) {
            consentements =
                    consentementRepository.findByDossierIdAndChannelOrderByUpdatedAtDesc(
                            dossierId, channel);
        } else {
            consentements = consentementRepository.findByDossierIdOrderByUpdatedAtDesc(dossierId);
        }

        return consentements.stream()
                .map(consentementMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ConsentementResponse> listByDossierAndChannelPaginated(
            Long dossierId,
            com.example.backend.entity.enums.ConsentementChannel channel,
            int page,
            int size) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));

        Page<ConsentementEntity> consentements;
        if (channel != null) {
            consentements =
                    consentementRepository.findByDossierIdAndChannel(dossierId, channel, pageable);
        } else {
            consentements = consentementRepository.findByDossierId(dossierId, pageable);
        }

        return consentements.map(consentementMapper::toResponse);
    }

    private void logConsentGrantedActivity(ConsentementEntity consentement) {
        if (activityService != null && consentement.getDossier() != null) {
            try {
                String description =
                        String.format(
                                "Consent granted for %s via %s",
                                consentement.getConsentType(), consentement.getChannel());

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("consentementId", consentement.getId());
                metadata.put("channel", consentement.getChannel().name());
                metadata.put("consentType", consentement.getConsentType().name());
                metadata.put("status", consentement.getStatus().name());
                if (consentement.getMeta() != null) {
                    metadata.put("consentMeta", consentement.getMeta());
                }
                metadata.put("timestamp", LocalDateTime.now().toString());

                activityService.logActivity(
                        consentement.getDossier().getId(),
                        ActivityType.CONSENT_GRANTED,
                        description,
                        metadata);
            } catch (Exception e) {
                logger.warn(
                        "Failed to log CONSENT_GRANTED activity for consentement {}: {}",
                        consentement.getId(),
                        e.getMessage(),
                        e);
            }
        }
    }

    private void logConsentRevokedActivity(
            ConsentementEntity consentement, ConsentementStatus previousStatus) {
        if (activityService != null && consentement.getDossier() != null) {
            try {
                String description =
                        String.format(
                                "Consent revoked for %s via %s",
                                consentement.getConsentType(), consentement.getChannel());

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("consentementId", consentement.getId());
                metadata.put("channel", consentement.getChannel().name());
                metadata.put("consentType", consentement.getConsentType().name());
                metadata.put("status", consentement.getStatus().name());
                metadata.put("previousStatus", previousStatus.name());
                if (consentement.getMeta() != null) {
                    metadata.put("consentMeta", consentement.getMeta());
                }
                metadata.put("timestamp", LocalDateTime.now().toString());

                activityService.logActivity(
                        consentement.getDossier().getId(),
                        ActivityType.CONSENT_REVOKED,
                        description,
                        metadata);
            } catch (Exception e) {
                logger.warn(
                        "Failed to log CONSENT_REVOKED activity for consentement {}: {}",
                        consentement.getId(),
                        e.getMessage(),
                        e);
            }
        }
    }

    @Transactional
    public ConsentementResponse renew(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ConsentementEntity consentement =
                consentementRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Consentement not found with id: " + id));

        if (!orgId.equals(consentement.getOrgId())) {
            throw new EntityNotFoundException("Consentement not found with id: " + id);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newExpiresAt = now.plusYears(1);

        LocalDateTime oldExpiresAt = consentement.getExpiresAt();
        consentement.setExpiresAt(newExpiresAt);
        consentement.setUpdatedAt(now);

        Map<String, Object> meta =
                consentement.getMeta() != null
                        ? new HashMap<>(consentement.getMeta())
                        : new HashMap<>();
        meta.put("previousExpiresAt", oldExpiresAt != null ? oldExpiresAt.toString() : null);
        meta.put("renewedAt", now.toString());
        meta.put("renewedBy", orgId);
        consentement.setMeta(meta);

        ConsentementEntity updated = consentementRepository.save(consentement);

        logConsentRenewedActivity(updated, oldExpiresAt);
        
        Map<String, Object> renewalMetadata = new HashMap<>();
        renewalMetadata.put("previousExpiresAt", oldExpiresAt != null ? oldExpiresAt.toString() : null);
        renewalMetadata.put("newExpiresAt", newExpiresAt.toString());
        consentEventService.emitEvent(updated, "RENEWED", updated.getStatus(), renewalMetadata);

        return consentementMapper.toResponse(updated);
    }

    private void logConsentRenewedActivity(
            ConsentementEntity consentement, LocalDateTime oldExpiresAt) {
        if (activityService != null && consentement.getDossier() != null) {
            try {
                String description =
                        String.format(
                                "Consent renewed for %s via %s until %s",
                                consentement.getConsentType(),
                                consentement.getChannel(),
                                consentement.getExpiresAt() != null
                                        ? consentement.getExpiresAt().format(DATE_FORMATTER)
                                        : "no expiration");

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("consentementId", consentement.getId());
                metadata.put("channel", consentement.getChannel().name());
                metadata.put("consentType", consentement.getConsentType().name());
                metadata.put("status", consentement.getStatus().name());
                metadata.put(
                        "previousExpiresAt",
                        oldExpiresAt != null ? oldExpiresAt.toString() : null);
                metadata.put(
                        "newExpiresAt",
                        consentement.getExpiresAt() != null
                                ? consentement.getExpiresAt().toString()
                                : null);
                if (consentement.getMeta() != null) {
                    metadata.put("consentMeta", consentement.getMeta());
                }
                metadata.put("timestamp", LocalDateTime.now().toString());

                activityService.logActivity(
                        consentement.getDossier().getId(),
                        ActivityType.CONSENT_RENEWED,
                        description,
                        metadata);
            } catch (Exception e) {
                logger.warn(
                        "Failed to log CONSENT_RENEWED activity for consentement {}: {}",
                        consentement.getId(),
                        e.getMessage(),
                        e);
            }
        }
    }

    public void sendExpirationReminder(ConsentementEntity consent) {
        if (consent.getDossier() == null) {
            logger.warn("Consent {} has no dossier. Skipping reminder.", consent.getId());
            return;
        }

        if (consent.getExpiresAt() == null) {
            logger.warn(
                    "Consent {} has no expiration date. Skipping reminder.", consent.getId());
            return;
        }

        Dossier dossier = consent.getDossier();
        String clientName = dossier.getLeadName();
        if (clientName == null || clientName.trim().isEmpty()) {
            clientName = "Client";
        }

        String expiryDate = consent.getExpiresAt().format(DATE_FORMATTER);
        String consentTypeLabel = getConsentTypeLabel(consent.getConsentType());
        String channelLabel = getChannelLabel(consent.getChannel());

        String messageContent =
                String.format(
                        "Bonjour %s, votre consentement pour %s via %s expire le %s. Veuillez le renouveler pour continuer à recevoir nos communications.",
                        clientName, consentTypeLabel, channelLabel, expiryDate);

        String recipientContact = getRecipientContact(dossier, consent);
        if (recipientContact == null || recipientContact.trim().isEmpty()) {
            logger.warn(
                    "Dossier {} has no contact for channel {}. Skipping reminder for consent {}.",
                    dossier.getId(),
                    consent.getChannel(),
                    consent.getId());
            return;
        }

        MessageChannel messageChannel = mapConsentChannelToMessageChannel(consent.getChannel());

        logger.info(
                "Sending expiration reminder for consent {} to {} via {}",
                consent.getId(),
                recipientContact,
                messageChannel);

        Map<String, Object> payload = new HashMap<>();
        payload.put("body", messageContent);

        try {
            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    messageChannel,
                    recipientContact,
                    null,
                    "Rappel d'expiration de consentement",
                    payload,
                    "consent_expiration_reminder_" + consent.getId(),
                    ConsentementType.MARKETING);

            logger.info("Expiration reminder queued for consent {}", consent.getId());
        } catch (Exception e) {
            logger.error(
                    "Failed to queue expiration reminder for consent {}: {}",
                    consent.getId(),
                    e.getMessage(),
                    e);
        }
    }

    private String getConsentTypeLabel(ConsentementType type) {
        return switch (type) {
            case MARKETING -> "communications marketing";
            case TRANSACTIONNEL -> "communications transactionnelles";
            case PROFILING -> "profilage";
            case GESTIONNEL -> "communications de gestion";
            case RECHERCHE -> "recherche";
        };
    }

    private String getChannelLabel(
            com.example.backend.entity.enums.ConsentementChannel channel) {
        return switch (channel) {
            case EMAIL -> "email";
            case SMS -> "SMS";
            case WHATSAPP -> "WhatsApp";
            case PHONE -> "téléphone";
            case POSTAL_MAIL -> "courrier postal";
            case IN_PERSON -> "en personne";
        };
    }

    private String getRecipientContact(
            Dossier dossier, ConsentementEntity consent) {
        return switch (consent.getChannel()) {
            case EMAIL -> dossier.getLeadEmail();
            case SMS, WHATSAPP, PHONE -> dossier.getLeadPhone();
            case POSTAL_MAIL, IN_PERSON -> null;
        };
    }

    private MessageChannel mapConsentChannelToMessageChannel(
            com.example.backend.entity.enums.ConsentementChannel channel) {
        return switch (channel) {
            case EMAIL -> MessageChannel.EMAIL;
            case SMS -> MessageChannel.SMS;
            case WHATSAPP -> MessageChannel.WHATSAPP;
            case PHONE -> MessageChannel.PHONE;
            case POSTAL_MAIL, IN_PERSON ->
                    throw new IllegalArgumentException(
                            "Channel " + channel + " does not support digital messages");
        };
    }
}
