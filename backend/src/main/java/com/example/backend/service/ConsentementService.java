package com.example.backend.service;

import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.ConsentementMapper;
import com.example.backend.dto.ConsentementResponse;
import com.example.backend.dto.ConsentementUpdateRequest;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
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

    private final ConsentementRepository consentementRepository;
    private final DossierRepository dossierRepository;
    private final ConsentementMapper consentementMapper;
    private final ActivityService activityService;

    public ConsentementService(
            ConsentementRepository consentementRepository,
            DossierRepository dossierRepository,
            ConsentementMapper consentementMapper,
            ActivityService activityService) {
        this.consentementRepository = consentementRepository;
        this.dossierRepository = dossierRepository;
        this.consentementMapper = consentementMapper;
        this.activityService = activityService;
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
        } else if (previousStatus == ConsentementStatus.GRANTED
                && updated.getStatus() == ConsentementStatus.REVOKED) {
            logConsentRevokedActivity(updated, previousStatus);
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
}
