package com.example.backend.service;

import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.ConsentementMapper;
import com.example.backend.dto.ConsentementResponse;
import com.example.backend.dto.ConsentementUpdateRequest;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ConsentementService {

    private final ConsentementRepository consentementRepository;
    private final DossierRepository dossierRepository;
    private final ConsentementMapper consentementMapper;

    public ConsentementService(
            ConsentementRepository consentementRepository,
            DossierRepository dossierRepository,
            ConsentementMapper consentementMapper) {
        this.consentementRepository = consentementRepository;
        this.dossierRepository = dossierRepository;
        this.consentementMapper = consentementMapper;
    }

    @Transactional
    public ConsentementResponse create(ConsentementCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(request.getDossierId())
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + request.getDossierId()));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + request.getDossierId());
        }

        ConsentementEntity consentement = consentementMapper.toEntity(request);
        consentement.setOrgId(orgId);
        consentement.setDossier(dossier);

        Map<String, Object> meta = consentement.getMeta() != null ? new HashMap<>(consentement.getMeta()) : new HashMap<>();
        meta.put("previousStatus", null);
        meta.put("changedBy", orgId);
        meta.put("changedAt", LocalDateTime.now().toString());
        consentement.setMeta(meta);

        ConsentementEntity saved = consentementRepository.save(consentement);
        return consentementMapper.toResponse(saved);
    }

    @Transactional
    public ConsentementResponse update(Long id, ConsentementUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ConsentementEntity consentement = consentementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Consentement not found with id: " + id));

        if (!orgId.equals(consentement.getOrgId())) {
            throw new EntityNotFoundException("Consentement not found with id: " + id);
        }

        ConsentementStatus previousStatus = consentement.getStatus();

        consentement.setChannel(request.getChannel());
        consentement.setStatus(request.getStatus());

        Map<String, Object> meta = consentement.getMeta() != null ? new HashMap<>(consentement.getMeta()) : new HashMap<>();
        if (request.getMeta() != null) {
            meta.putAll(request.getMeta());
        }
        meta.put("previousStatus", previousStatus.toString());
        meta.put("changedBy", orgId);
        meta.put("changedAt", LocalDateTime.now().toString());
        consentement.setMeta(meta);

        ConsentementEntity updated = consentementRepository.save(consentement);
        return consentementMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public ConsentementResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ConsentementEntity consentement = consentementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Consentement not found with id: " + id));

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

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        List<ConsentementEntity> consentements = consentementRepository.findByDossierId(dossierId);
        return consentements.stream()
                .map(consentementMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConsentementResponse> listByDossierAndChannel(Long dossierId, com.example.backend.entity.enums.ConsentementChannel channel) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        List<ConsentementEntity> consentements;
        if (channel != null) {
            consentements = consentementRepository.findByDossierIdAndChannelOrderByUpdatedAtDesc(dossierId, channel);
        } else {
            consentements = consentementRepository.findByDossierIdOrderByUpdatedAtDesc(dossierId);
        }

        return consentements.stream()
                .map(consentementMapper::toResponse)
                .collect(Collectors.toList());
    }
}
