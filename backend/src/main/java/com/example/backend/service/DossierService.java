package com.example.backend.service;

import com.example.backend.dto.BulkOperationResponse;
import com.example.backend.dto.DossierBulkAssignRequest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierLeadPatchRequest;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import com.example.backend.observability.MetricsService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DossierService {

    private final DossierRepository dossierRepository;
    private final DossierMapper dossierMapper;
    private final AnnonceRepository annonceRepository;
    private final DossierStatusTransitionService transitionService;
    private final SearchService searchService;
    private final MetricsService metricsService;

    public DossierService(DossierRepository dossierRepository, DossierMapper dossierMapper,
                         AnnonceRepository annonceRepository, DossierStatusTransitionService transitionService,
                         SearchService searchService, MetricsService metricsService) {
        this.dossierRepository = dossierRepository;
        this.dossierMapper = dossierMapper;
        this.annonceRepository = annonceRepository;
        this.transitionService = transitionService;
        this.searchService = searchService;
        this.metricsService = metricsService;
    }

    @Transactional
    public DossierResponse create(DossierCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        if (request.getAnnonceId() != null) {
            Annonce annonce = annonceRepository.findById(request.getAnnonceId())
                    .orElseThrow(() -> new EntityNotFoundException("Annonce not found with id: " + request.getAnnonceId()));

            if (!orgId.equals(annonce.getOrgId())) {
                throw new EntityNotFoundException("Annonce not found with id: " + request.getAnnonceId());
            }

            if (annonce.getStatus() == AnnonceStatus.ARCHIVED) {
                throw new IllegalArgumentException("Cannot create dossier with ARCHIVED annonce");
            }

            if (annonce.getStatus() == AnnonceStatus.DRAFT) {
                throw new IllegalArgumentException("Cannot create dossier with DRAFT annonce");
            }
        }

        Dossier dossier = dossierMapper.toEntity(request);
        dossier.setOrgId(orgId);

        LocalDateTime now = LocalDateTime.now();
        dossier.setCreatedAt(now);
        dossier.setUpdatedAt(now);

        if (dossier.getParties() != null && !dossier.getParties().isEmpty()) {
            dossier.getParties().forEach(party -> {
                party.setOrgId(orgId);
                party.setCreatedAt(now);
                party.setUpdatedAt(now);
                if (party.getName() == null && party.getFirstName() != null && party.getLastName() != null) {
                    party.setName(party.getFirstName() + " " + party.getLastName());
                }
            });
        }

        Dossier saved = dossierRepository.save(dossier);

        // Observability: business metric
        metricsService.incrementDossierCreated(request.getSource().getValue());

        transitionService.recordTransition(saved, DossierStatus.DRAFT, saved.getStatus(), null, "Initial dossier creation");

        searchService.indexDossier(saved);

        return dossierMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DossierResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        return dossierMapper.toResponse(dossier);
    }

    @Transactional(readOnly = true)
    public Page<DossierResponse> list(DossierStatus status, String leadPhone, Long annonceId, Pageable pageable) {
        Specification<Dossier> spec = Specification.where(null);

        if (status != null) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (leadPhone != null && !leadPhone.trim().isEmpty()) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("leadPhone"), leadPhone));
        }

        if (annonceId != null) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("annonceId"), annonceId));
        }

        Page<Dossier> dossiers = dossierRepository.findAll(spec, pageable);
        return dossiers.map(dossierMapper::toResponse);
    }

    @Transactional
    public DossierResponse patchStatus(Long id, DossierStatusPatchRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        DossierStatus currentStatus = dossier.getStatus();
        DossierStatus newStatus = request.getStatus();

        transitionService.validateTransition(currentStatus, newStatus);

        dossier.setStatus(newStatus);
        
        if (request.getStatusCode() != null) {
            dossier.setStatusCode(request.getStatusCode());
        }
        if (request.getLossReason() != null) {
            dossier.setLossReason(request.getLossReason());
        }
        if (request.getWonReason() != null) {
            dossier.setWonReason(request.getWonReason());
        }
        
        dossier.setUpdatedAt(LocalDateTime.now());
        Dossier updated = dossierRepository.save(dossier);

        transitionService.recordTransition(dossier, currentStatus, newStatus, request.getUserId(), request.getReason());

        searchService.indexDossier(updated);

        return dossierMapper.toResponse(updated);
    }

    @Transactional
    public DossierResponse patchLead(Long id, DossierLeadPatchRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        dossier.setLeadName(request.getLeadName());
        dossier.setLeadPhone(request.getLeadPhone());
        dossier.setUpdatedAt(LocalDateTime.now());
        Dossier updated = dossierRepository.save(dossier);
        searchService.indexDossier(updated);
        return dossierMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<DossierResponse> checkForDuplicates(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return List.of();
        }

        List<DossierStatus> excludedStatuses = Arrays.asList(DossierStatus.WON, DossierStatus.LOST);
        List<Dossier> leadPhoneDuplicates = dossierRepository.findByLeadPhoneAndStatusNotIn(phone, excludedStatuses);
        List<Dossier> partyPhoneDuplicates = dossierRepository.findByPartiesPhoneAndStatusNotIn(phone, excludedStatuses);

        List<Dossier> allDuplicates = new ArrayList<>();
        allDuplicates.addAll(leadPhoneDuplicates);

        for (Dossier partyDuplicate : partyPhoneDuplicates) {
            if (!allDuplicates.stream().anyMatch(d -> d.getId().equals(partyDuplicate.getId()))) {
                allDuplicates.add(partyDuplicate);
            }
        }

        return allDuplicates.stream()
                .map(dossierMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BulkOperationResponse bulkAssign(DossierBulkAssignRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        int successCount = 0;
        int failureCount = 0;
        List<BulkOperationResponse.BulkOperationError> errors = new ArrayList<>();

        for (Long id : request.getIds()) {
            try {
                Dossier dossier = dossierRepository.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));

                if (!orgId.equals(dossier.getOrgId())) {
                    throw new EntityNotFoundException("Dossier not found with id: " + id);
                }

                DossierStatus currentStatus = dossier.getStatus();
                DossierStatus newStatus = request.getStatus();

                transitionService.validateTransition(currentStatus, newStatus);

                dossier.setStatus(newStatus);
                dossier.setUpdatedAt(LocalDateTime.now());
                dossierRepository.save(dossier);

                transitionService.recordTransition(dossier, currentStatus, newStatus,
                        request.getUserId(), request.getReason());

                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add(new BulkOperationResponse.BulkOperationError(id, e.getMessage()));
            }
        }


        return new BulkOperationResponse(successCount, failureCount, errors);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        dossierRepository.delete(dossier);
        searchService.deleteDossierIndex(id);
    }
}
