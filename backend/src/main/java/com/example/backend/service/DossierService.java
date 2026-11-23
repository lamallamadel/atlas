package com.example.backend.service;

import com.example.backend.dto.BulkOperationResponse;
import com.example.backend.dto.DossierBulkAssignRequest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierLeadPatchRequest;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.dto.PartiePrenanteCreateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.observability.MetricsService;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import com.example.backend.workflow.DossierStatusCodes;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DossierService {

    private final DossierRepository dossierRepository;
    private final ActivityRepository activityRepository;
    private final DossierMapper dossierMapper;
    private final AnnonceRepository annonceRepository;
    private final DossierStatusTransitionService transitionService;
    @Nullable private final SearchService searchService;
    private final MetricsService metricsService;
    private final WorkflowValidationService workflowValidationService;
    private final PartiePrenanteService partiePrenanteService;
    private final jakarta.persistence.EntityManager entityManager;
    private final DossierStatusCodeValidationService statusCodeValidationService;
    private final com.example.backend.brain.BrainClientService brainClientService;
    private final LocaleDetectionService localeDetectionService;

    public DossierService(
            DossierRepository dossierRepository,
            ActivityRepository activityRepository,
            DossierMapper dossierMapper,
            AnnonceRepository annonceRepository,
            DossierStatusTransitionService transitionService,
            @Autowired(required = false) @Nullable SearchService searchService,
            MetricsService metricsService,
            WorkflowValidationService workflowValidationService,
            PartiePrenanteService partiePrenanteService,
            jakarta.persistence.EntityManager entityManager,
            DossierStatusCodeValidationService statusCodeValidationService,
            @Autowired(required = false) @Nullable
                    com.example.backend.brain.BrainClientService brainClientService,
            LocaleDetectionService localeDetectionService) {
        this.dossierRepository = dossierRepository;
        this.activityRepository = activityRepository;
        this.dossierMapper = dossierMapper;
        this.annonceRepository = annonceRepository;
        this.transitionService = transitionService;
        this.searchService = searchService;
        this.metricsService = metricsService;
        this.workflowValidationService = workflowValidationService;
        this.partiePrenanteService = partiePrenanteService;
        this.entityManager = entityManager;
        this.statusCodeValidationService = statusCodeValidationService;
        this.brainClientService = brainClientService;
        this.localeDetectionService = localeDetectionService;
    }

    @Transactional
    public DossierResponse create(DossierCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        if (request.getAnnonceId() != null) {
            Annonce annonce =
                    annonceRepository
                            .findById(request.getAnnonceId())
                            .orElseThrow(
                                    () ->
                                            new EntityNotFoundException(
                                                    "Annonce not found with id: "
                                                            + request.getAnnonceId()));

            if (!orgId.equals(annonce.getOrgId())) {
                throw new EntityNotFoundException(
                        "Annonce not found with id: " + request.getAnnonceId());
            }

            if (annonce.getStatus() == AnnonceStatus.ARCHIVED) {
                throw new IllegalArgumentException("Cannot create dossier with ARCHIVED annonce");
            }
            if (annonce.getStatus() == AnnonceStatus.DRAFT) {
                throw new IllegalArgumentException("Cannot create dossier with DRAFT annonce");
            }
        }

        Dossier dossier = dossierMapper.toEntityWithoutParties(request);
        dossier.setOrgId(orgId);
        // Créé par un utilisateur : le dossier lui revient. Créé par le système (portail, vitrine)
        // :
        // il reste à attribuer.
        DossierAssignmentService.assignToCreator(dossier);

        if (dossier.getCaseType() != null && !dossier.getCaseType().isBlank()) {
            statusCodeValidationService.validateCaseType(dossier.getCaseType());
            statusCodeValidationService.validateStatusCodeForCaseType(
                    dossier.getCaseType(), dossier.getStatusCode());
        }

        if (dossier.getLocale() == null || dossier.getLocale().trim().isEmpty()) {
            String detectedLocale =
                    localeDetectionService.detectLocaleFromPhone(dossier.getLeadPhone());
            dossier.setLocale(detectedLocale);
        }

        LocalDateTime now = LocalDateTime.now();
        dossier.setCreatedAt(now);
        dossier.setUpdatedAt(now);

        Dossier saved = dossierRepository.save(dossier);

        if (request.getInitialParty() != null) {
            PartiePrenanteCreateRequest partyRequest = new PartiePrenanteCreateRequest();
            partyRequest.setDossierId(saved.getId());
            partyRequest.setRole(
                    request.getInitialParty().getRole() != null
                            ? request.getInitialParty().getRole().name()
                            : null);
            partyRequest.setName(request.getInitialParty().getName());
            partyRequest.setFirstName(request.getInitialParty().getFirstName());
            partyRequest.setLastName(request.getInitialParty().getLastName());
            partyRequest.setEmail(request.getInitialParty().getEmail());
            partyRequest.setPhone(request.getInitialParty().getPhone());
            partyRequest.setAddress(request.getInitialParty().getAddress());
            partyRequest.setMeta(request.getInitialParty().getMeta());

            partiePrenanteService.create(partyRequest);

            entityManager.flush();
            entityManager.clear();

            final Long savedId = saved.getId();
            saved =
                    dossierRepository
                            .findByIdWithParties(savedId)
                            .orElseThrow(
                                    () ->
                                            new EntityNotFoundException(
                                                    "Dossier not found with id: " + savedId));
        }

        if (saved.getSource() != null) {
            metricsService.incrementDossierCreated(saved.getSource().getValue());
        }

        transitionService.recordTransition(
                saved, null, saved.getStatus(), null, "Initial dossier creation");

        if (searchService != null) {
            searchService.indexDossier(saved);
        }

        return dossierMapper.toResponse(saved);
    }

    @Cacheable(
            value = "dossier",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional(readOnly = true)
    public DossierResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findByIdWithRelations(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        return dossierMapper.toResponse(dossier);
    }

    /** Motif LIKE « contient », en minuscules, caractères spéciaux échappés. */
    static String containsPattern(String raw) {
        return "%"
                + raw.trim()
                        .toLowerCase(java.util.Locale.ROOT)
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_")
                + "%";
    }

    @Transactional(readOnly = true)
    public Page<DossierResponse> list(
            DossierStatus status, String leadPhone, Long annonceId, Pageable pageable) {
        return list(status, leadPhone, annonceId, null, null, pageable);
    }

    /**
     * Liste filtrée. {@code leadSource} : contient, sans tenir compte de la casse ; {@code q} :
     * recherche dans le nom ou le téléphone du prospect (contient, sans tenir compte de la casse).
     */
    @Transactional(readOnly = true)
    public Page<DossierResponse> list(
            DossierStatus status,
            String leadPhone,
            Long annonceId,
            String leadSource,
            String q,
            Pageable pageable) {
        return list(status, leadPhone, annonceId, leadSource, q, null, pageable);
    }

    /**
     * Comme {@link #list(DossierStatus, String, Long, String, String, Pageable)}, avec l'agent :
     * {@code me} (l'utilisateur connecté), {@code unassigned} (à attribuer) ou un identifiant.
     */
    @Transactional(readOnly = true)
    public Page<DossierResponse> list(
            DossierStatus status,
            String leadPhone,
            Long annonceId,
            String leadSource,
            String q,
            String assignee,
            Pageable pageable) {
        Specification<Dossier> spec =
                (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (assignee != null && !assignee.isBlank()) {
            if ("unassigned".equalsIgnoreCase(assignee)) {
                spec = spec.and((root, query, cb) -> cb.isNull(root.get("assignedTo")));
            } else {
                String who =
                        "me".equalsIgnoreCase(assignee)
                                ? com.example.backend.util.CurrentUser.id().orElse("")
                                : assignee;
                spec = spec.and((root, query, cb) -> cb.equal(root.get("assignedTo"), who));
            }
        }

        if (status != null) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (leadPhone != null && !leadPhone.trim().isEmpty()) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("leadPhone"), leadPhone));
        }

        if (annonceId != null) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("annonceId"), annonceId));
        }

        if (leadSource != null && !leadSource.isBlank()) {
            String source = containsPattern(leadSource);
            spec =
                    spec.and(
                            (root, query, cb) ->
                                    cb.like(cb.lower(root.get("leadSource")), source, '\\'));
        }

        if (q != null && !q.isBlank()) {
            String like = containsPattern(q);
            spec =
                    spec.and(
                            (root, query, cb) ->
                                    cb.or(
                                            cb.like(cb.lower(root.get("leadName")), like, '\\'),
                                            cb.like(root.get("leadPhone"), like, '\\')));
        }

        Page<Dossier> dossiers = dossierRepository.findAll(spec, pageable);
        return dossiers.map(dossierMapper::toResponse);
    }

    @CacheEvict(
            value = "dossier",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public DossierResponse patchStatus(Long id, DossierStatusPatchRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        DossierStatus currentStatus = dossier.getStatus();
        DossierStatus newStatus = request.getStatus();

        transitionService.validateTransition(currentStatus, newStatus);

        // Les raisons de clôture sont posées avant la validation : un workflow peut les exiger.
        if (request.getLossReason() != null) {
            dossier.setLossReason(request.getLossReason());
        }
        if (request.getWonReason() != null) {
            dossier.setWonReason(request.getWonReason());
        }

        String targetCode =
                request.getStatusCode() != null
                        ? DossierStatusCodes.normalize(request.getStatusCode())
                        : DossierStatusCodes.toCode(newStatus);

        // ADR 0004 : tout dossier suit le workflow de son type (CRM_LEAD par défaut).
        workflowValidationService.validateAndRecordTransition(
                dossier,
                DossierStatusCodes.toCode(currentStatus),
                targetCode,
                request.getUserId(),
                request.getReason());

        dossier.setStatus(newStatus);

        if (request.getStatusCode() != null) {
            statusCodeValidationService.validateStatusCodeForCaseType(
                    dossier.getCaseType(), targetCode);
            dossier.setStatusCode(targetCode);
        }

        dossier.setUpdatedAt(LocalDateTime.now());
        Dossier updated = dossierRepository.save(dossier);

        transitionService.recordTransition(
                dossier, currentStatus, newStatus, request.getUserId(), request.getReason());

        if (searchService != null) {
            searchService.indexDossier(updated);
        }

        return dossierMapper.toResponse(updated);
    }

    @CacheEvict(
            value = "dossier",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public DossierResponse patchLead(Long id, DossierLeadPatchRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        dossier.setLeadName(request.getLeadName());
        dossier.setLeadPhone(request.getLeadPhone());
        dossier.setUpdatedAt(LocalDateTime.now());
        Dossier updated = dossierRepository.save(dossier);
        if (searchService != null) {
            searchService.indexDossier(updated);
        }
        return dossierMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<DossierResponse> checkForDuplicates(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return List.of();
        }

        List<DossierStatus> excludedStatuses = Arrays.asList(DossierStatus.WON, DossierStatus.LOST);
        List<Dossier> leadPhoneDuplicates =
                dossierRepository.findByLeadPhoneAndStatusNotIn(phone, excludedStatuses);
        List<Dossier> partyPhoneDuplicates =
                dossierRepository.findByPartiesPhoneAndStatusNotIn(phone, excludedStatuses);

        List<Dossier> allDuplicates = new ArrayList<>();
        allDuplicates.addAll(leadPhoneDuplicates);

        for (Dossier partyDuplicate : partyPhoneDuplicates) {
            if (!allDuplicates.stream().anyMatch(d -> d.getId().equals(partyDuplicate.getId()))) {
                allDuplicates.add(partyDuplicate);
            }
        }

        return allDuplicates.stream().map(dossierMapper::toResponse).collect(Collectors.toList());
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
                Dossier dossier =
                        dossierRepository
                                .findById(id)
                                .orElseThrow(
                                        () ->
                                                new EntityNotFoundException(
                                                        "Dossier not found with id: " + id));

                if (!orgId.equals(dossier.getOrgId())) {
                    throw new EntityNotFoundException("Dossier not found with id: " + id);
                }

                DossierStatus currentStatus = dossier.getStatus();
                DossierStatus newStatus = request.getStatus();

                transitionService.validateTransition(currentStatus, newStatus);

                workflowValidationService.validateAndRecordTransition(
                        dossier,
                        DossierStatusCodes.toCode(currentStatus),
                        DossierStatusCodes.toCode(newStatus),
                        request.getUserId(),
                        request.getReason());

                dossier.setStatus(newStatus);
                dossier.setUpdatedAt(LocalDateTime.now());
                dossierRepository.save(dossier);

                transitionService.recordTransition(
                        dossier,
                        currentStatus,
                        newStatus,
                        request.getUserId(),
                        request.getReason());

                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add(new BulkOperationResponse.BulkOperationError(id, e.getMessage()));
            }
        }

        return new BulkOperationResponse(successCount, failureCount, errors);
    }

    @CacheEvict(
            value = "dossier",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        activityRepository.deleteByDossier_Id(id);
        dossierRepository.delete(dossier);
        if (searchService != null) {
            searchService.deleteDossierIndex(id);
        }
    }

    @Transactional(readOnly = true)
    public Dossier findEntityById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findByIdWithRelations(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + id));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }

        return dossier;
    }

    @Transactional(readOnly = true)
    public Page<Dossier> findAll(
            DossierStatus status, String leadPhone, Long annonceId, Pageable pageable) {
        Specification<Dossier> spec =
                (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (status != null) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (leadPhone != null && !leadPhone.trim().isEmpty()) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("leadPhone"), leadPhone));
        }

        if (annonceId != null) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("annonceId"), annonceId));
        }

        return dossierRepository.findAll(spec, pageable);
    }
}
