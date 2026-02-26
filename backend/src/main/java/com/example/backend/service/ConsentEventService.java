package com.example.backend.service;

import com.example.backend.entity.ConsentEventEntity;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.repository.ConsentEventRepository;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentEventService {

    private static final Logger logger = LoggerFactory.getLogger(ConsentEventService.class);

    private final ConsentEventRepository consentEventRepository;

    public ConsentEventService(ConsentEventRepository consentEventRepository) {
        this.consentEventRepository = consentEventRepository;
    }

    @Transactional
    public ConsentEventEntity emitEvent(
            ConsentementEntity consent,
            String eventType,
            ConsentementStatus oldStatus,
            Map<String, Object> additionalMetadata) {

        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            orgId = consent.getOrgId();
        }

        ConsentEventEntity event = new ConsentEventEntity();
        event.setOrgId(orgId);
        event.setDossierId(consent.getDossier().getId());
        event.setConsentementId(consent.getId());
        event.setEventType(eventType);
        event.setChannel(consent.getChannel());
        event.setConsentType(consent.getConsentType());
        event.setOldStatus(oldStatus);
        event.setNewStatus(consent.getStatus());

        Map<String, Object> metadata = new HashMap<>();
        if (additionalMetadata != null) {
            metadata.putAll(additionalMetadata);
        }
        metadata.put(
                "expiresAt",
                consent.getExpiresAt() != null ? consent.getExpiresAt().toString() : null);
        if (consent.getMeta() != null) {
            metadata.put("consentMeta", consent.getMeta());
        }

        event.setMetadata(metadata);
        event.setCreatedAt(LocalDateTime.now());
        event.setCreatedBy(consent.getCreatedBy() != null ? consent.getCreatedBy() : orgId);

        ConsentEventEntity saved = consentEventRepository.save(event);

        logger.info(
                "Emitted consent event: type={}, consentId={}, dossierId={}, oldStatus={}, newStatus={}",
                eventType,
                consent.getId(),
                consent.getDossier().getId(),
                oldStatus,
                consent.getStatus());

        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> reconstructConsentState(Long consentementId) {
        List<ConsentEventEntity> events =
                consentEventRepository.findByConsentementIdOrderByCreatedAtAsc(consentementId);

        if (events.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, Object> reconstructedState = new HashMap<>();
        List<Map<String, Object>> timeline = new ArrayList<>();

        ConsentEventEntity firstEvent = events.get(0);
        reconstructedState.put("consentementId", consentementId);
        reconstructedState.put("orgId", firstEvent.getOrgId());
        reconstructedState.put("dossierId", firstEvent.getDossierId());
        reconstructedState.put("channel", firstEvent.getChannel().name());
        reconstructedState.put("consentType", firstEvent.getConsentType().name());

        ConsentementStatus currentStatus = null;
        LocalDateTime lastEventTime = null;
        String lastEventType = null;
        int totalTransitions = 0;

        for (ConsentEventEntity event : events) {
            Map<String, Object> eventSnapshot = new HashMap<>();
            eventSnapshot.put("eventId", event.getId());
            eventSnapshot.put("eventType", event.getEventType());
            eventSnapshot.put("timestamp", event.getCreatedAt().toString());
            eventSnapshot.put(
                    "oldStatus", event.getOldStatus() != null ? event.getOldStatus().name() : null);
            eventSnapshot.put("newStatus", event.getNewStatus().name());
            eventSnapshot.put("createdBy", event.getCreatedBy());
            if (event.getMetadata() != null) {
                eventSnapshot.put("metadata", event.getMetadata());
            }

            timeline.add(eventSnapshot);

            currentStatus = event.getNewStatus();
            lastEventTime = event.getCreatedAt();
            lastEventType = event.getEventType();
            totalTransitions++;
        }

        reconstructedState.put(
                "currentStatus", currentStatus != null ? currentStatus.name() : null);
        reconstructedState.put(
                "lastEventTime", lastEventTime != null ? lastEventTime.toString() : null);
        reconstructedState.put("lastEventType", lastEventType);
        reconstructedState.put("totalTransitions", totalTransitions);
        reconstructedState.put("timeline", timeline);

        ConsentEventEntity lastEvent = events.get(events.size() - 1);
        if (lastEvent.getMetadata() != null && lastEvent.getMetadata().containsKey("expiresAt")) {
            reconstructedState.put("expiresAt", lastEvent.getMetadata().get("expiresAt"));
        }

        logger.debug(
                "Reconstructed consent state for consentementId={}: {} transitions",
                consentementId,
                totalTransitions);

        return reconstructedState;
    }

    @Transactional(readOnly = true)
    public List<ConsentEventEntity> getConsentHistory(Long consentementId) {
        return consentEventRepository.findByConsentementIdOrderByCreatedAtAsc(consentementId);
    }

    @Transactional(readOnly = true)
    public List<ConsentEventEntity> getDossierConsentHistory(Long dossierId) {
        return consentEventRepository.findByDossierIdOrderByCreatedAtDesc(dossierId);
    }

    @Transactional(readOnly = true)
    public long countEventsByDossier(Long dossierId) {
        return consentEventRepository.countByDossierId(dossierId);
    }
}
