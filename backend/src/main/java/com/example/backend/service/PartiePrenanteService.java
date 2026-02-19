package com.example.backend.service;

import com.example.backend.dto.PartiePrenanteCreateRequest;
import com.example.backend.dto.PartiePrenanteMapper;
import com.example.backend.dto.PartiePrenanteResponse;
import com.example.backend.dto.PartiePrenanteUpdateRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.PartiePrenanteRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartiePrenanteService {

    private final PartiePrenanteRepository partiePrenanteRepository;
    private final DossierRepository dossierRepository;
    private final PartiePrenanteMapper partiePrenanteMapper;

    public PartiePrenanteService(
            PartiePrenanteRepository partiePrenanteRepository,
            DossierRepository dossierRepository,
            PartiePrenanteMapper partiePrenanteMapper) {
        this.partiePrenanteRepository = partiePrenanteRepository;
        this.dossierRepository = dossierRepository;
        this.partiePrenanteMapper = partiePrenanteMapper;
    }

    @Transactional
    public PartiePrenanteResponse create(PartiePrenanteCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        validateNameFields(request);

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

        PartiePrenanteEntity entity = partiePrenanteMapper.toEntity(request);
        entity.setOrgId(orgId);
        entity.setDossier(dossier);

        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        if (entity.getName() == null
                && entity.getFirstName() != null
                && entity.getLastName() != null) {
            entity.setName(entity.getFirstName() + " " + entity.getLastName());
        }

        PartiePrenanteEntity saved = partiePrenanteRepository.save(entity);
        return partiePrenanteMapper.toResponse(saved);
    }

    private void validateNameFields(PartiePrenanteCreateRequest request) {
        boolean hasName = request.getName() != null && !request.getName().trim().isEmpty();
        boolean hasFirstName =
                request.getFirstName() != null && !request.getFirstName().trim().isEmpty();
        boolean hasLastName =
                request.getLastName() != null && !request.getLastName().trim().isEmpty();

        if (!hasName && !(hasFirstName && hasLastName)) {
            throw new IllegalArgumentException(
                    "Either name or both firstName and lastName must be provided");
        }
    }

    @Transactional
    public PartiePrenanteResponse update(Long id, PartiePrenanteUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        PartiePrenanteEntity entity =
                partiePrenanteRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Partie prenante not found with id: " + id));

        if (!orgId.equals(entity.getOrgId())) {
            throw new EntityNotFoundException("Partie prenante not found with id: " + id);
        }

        partiePrenanteMapper.updateEntity(entity, request);
        entity.setUpdatedAt(LocalDateTime.now());
        PartiePrenanteEntity updated = partiePrenanteRepository.save(entity);
        return partiePrenanteMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        PartiePrenanteEntity entity =
                partiePrenanteRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Partie prenante not found with id: " + id));

        if (!orgId.equals(entity.getOrgId())) {
            throw new EntityNotFoundException("Partie prenante not found with id: " + id);
        }

        partiePrenanteRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public PartiePrenanteResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        PartiePrenanteEntity entity =
                partiePrenanteRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Partie prenante not found with id: " + id));

        if (!orgId.equals(entity.getOrgId())) {
            throw new EntityNotFoundException("Partie prenante not found with id: " + id);
        }

        return partiePrenanteMapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<PartiePrenanteResponse> listByDossier(Long dossierId) {
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

        List<PartiePrenanteEntity> entities = partiePrenanteRepository.findByDossierId(dossierId);
        return entities.stream().map(partiePrenanteMapper::toResponse).collect(Collectors.toList());
    }
}
