package com.example.backend.service;

import com.example.backend.dto.BulkOperationResponse;
import com.example.backend.dto.DossierBulkAssignRequest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierLeadPatchRequest;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.dto.DossierTransitionsResponse;
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
import com.example.backend.workflow.DossierWorkflow;
import com.example.backend.workflow.DossierWorkflowCatalog;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
        }
        applyInitialState(dossier);
        if (dossier.getCaseType() != null && !dossier.getCaseType().isBlank()) {
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

    // Pas de cache pour un agent restreint : le dossier d'un collègue ne doit pas lui être servi,
    // ni le sien remis en cache sous la clé de l'agence.
    @Cacheable(
            value = "dossier",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()",
            condition = "!T(com.example.backend.security.DossierScope).isRestricted()")
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
        return list(status, leadPhone, annonceId, leadSource, q, assignee, null, pageable);
    }

    /** Comme ci-dessus, limité à un type de dossier (ex. {@code CRM_LEAD_B2B_DEMO}). */
    @Transactional(readOnly = true)
    public Page<DossierResponse> list(
            DossierStatus status,
            String leadPhone,
            Long annonceId,
            String leadSource,
            String q,
            String assignee,
            String caseType,
            Pageable pageable) {
        Specification<Dossier> spec =
                (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (caseType != null && !caseType.isBlank()) {
            String type = caseType.trim();
            spec = spec.and((root, query, cb) -> cb.equal(root.get("caseType"), type));
        }

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

        // Les raisons de clôture sont posées avant la validation : un workflow peut les exiger.
        if (request.getLossReason() != null) {
            dossier.setLossReason(request.getLossReason());
        }
        if (request.getWonReason() != null) {
            dossier.setWonReason(request.getWonReason());
        }

        String targetCode =
                request.getStatusCode() != null && !request.getStatusCode().isBlank()
                        ? DossierStatusCodes.normalize(request.getStatusCode())
                        : DossierStatusCodes.toCode(request.getStatus());
        if (targetCode == null) {
            throw new IllegalArgumentException("STATUS_REQUIRED: indiquez statusCode (ou status).");
        }

        Dossier updated =
                applyTransition(dossier, targetCode, request.getUserId(), request.getReason());

        if (searchService != null) {
            searchService.indexDossier(updated);
        }

        return dossierMapper.toResponse(updated);
    }

    /**
     * Changement de statut (ADR 0004, phase B) : validé par le workflow du type de dossier, écrit
     * dans {@code status_code} ; l'enum {@code status} en est la projection, pour les écrans et
     * rapports qui le lisent encore.
     */
    private Dossier applyTransition(
            Dossier dossier, String targetCode, String userId, String reason) {
        DossierStatus fromStatus = dossier.getStatus();
        String fromCode = currentCode(dossier);

        // Pipeline historique : mêmes règles que le workflow système, gardées pour leurs messages.
        if (DossierStatusCodes.toEnum(fromCode).isPresent()
                && DossierStatusCodes.toEnum(targetCode).isPresent()
                && isSystemWorkflow(dossier)) {
            transitionService.validateTransition(
                    fromStatus, DossierStatusCodes.toEnum(targetCode).get());
        }

        DossierWorkflow workflow =
                workflowValidationService.validateAndRecordTransition(
                        dossier, fromCode, targetCode, userId, reason);
        statusCodeValidationService.validateStatusCodeForCaseType(
                dossier.getCaseType(), targetCode);
        validateLossReason(dossier, workflow, targetCode);

        DossierStatus projected =
                DossierStatusCodes.project(targetCode, workflow.state(targetCode).orElse(null));
        dossier.setStatus(projected);
        dossier.setStatusCode(targetCode);
        dossier.setUpdatedAt(LocalDateTime.now());
        Dossier saved = dossierRepository.save(dossier);

        transitionService.recordTransition(
                saved, fromStatus, projected, fromCode, targetCode, userId, reason);
        return saved;
    }

    private List<DossierStatusCodeValidationService.Option> lossReasons(String caseType) {
        return statusCodeValidationService.options(
                DossierWorkflowCatalog.lossReasonCategory(
                        DossierStatusCodes.effectiveCaseType(caseType)));
    }

    /**
     * Une raison de perte exigée par l'état cible doit appartenir au référentiel du type de dossier
     * (ex. {@code B2B_LOST_*} pour une démo B2B).
     */
    private void validateLossReason(Dossier dossier, DossierWorkflow workflow, String targetCode) {
        boolean required =
                workflow.state(targetCode)
                        .map(st -> st.requires().contains("lossReason"))
                        .orElse(false);
        String reason = dossier.getLossReason();
        if (!required || reason == null || reason.isBlank()) {
            return;
        }
        List<DossierStatusCodeValidationService.Option> allowed =
                lossReasons(dossier.getCaseType());
        if (!allowed.isEmpty() && allowed.stream().noneMatch(o -> o.code().equals(reason))) {
            throw new IllegalArgumentException(
                    "INVALID_LOSS_REASON: raison de perte inconnue pour ce type de dossier : "
                            + reason);
        }
    }

    private boolean isSystemWorkflow(Dossier dossier) {
        return workflowValidationService
                .workflowOf(dossier.getCaseType())
                .map(w -> DossierWorkflow.SOURCE_SYSTEM.equals(w.source()))
                .orElse(true);
    }

    private static String currentCode(Dossier dossier) {
        String code = DossierStatusCodes.normalize(dossier.getStatusCode());
        return code == null || code.isBlank()
                ? DossierStatusCodes.toCode(dossier.getStatus())
                : code;
    }

    /**
     * Statut courant et transitions possibles depuis celui-ci (ADR 0004) : l'écran n'affiche que
     * ces actions. Les transitions réservées à d'autres rôles sont omises.
     */
    @Transactional(readOnly = true)
    public DossierTransitionsResponse transitions(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        Dossier dossier =
                dossierRepository
                        .findById(id)
                        .filter(d -> orgId.equals(d.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + id));
        String caseType = DossierStatusCodes.effectiveCaseType(dossier.getCaseType());
        String current = currentCode(dossier);
        Optional<DossierWorkflow> workflow = workflowValidationService.workflowOf(caseType);

        List<DossierTransitionsResponse.Option> options = new ArrayList<>();
        Optional<DossierWorkflow.State> currentState = workflow.flatMap(w -> w.state(current));
        if (workflow.isPresent()) {
            DossierWorkflow w = workflow.get();
            for (String target : w.targetsFrom(current)) {
                DossierWorkflow.Transition rule = w.transition(current, target).orElseThrow();
                if (!WorkflowValidationService.isAllowedForCurrentUser(rule)) {
                    continue;
                }
                Optional<DossierWorkflow.State> state = w.state(target);
                Set<String> requires = new LinkedHashSet<>(rule.requiredFields());
                state.ifPresent(st -> requires.addAll(st.requires()));
                List<DossierTransitionsResponse.Reason> reasons =
                        requires.contains("lossReason")
                                ? lossReasons(caseType).stream()
                                        .map(
                                                o ->
                                                        new DossierTransitionsResponse.Reason(
                                                                o.code(), o.label()))
                                        .toList()
                                : List.of();
                options.add(
                        new DossierTransitionsResponse.Option(
                                target,
                                statusCodeValidationService.label("CASE_STATUS", target),
                                state.map(st -> st.stage().name()).orElse(null),
                                List.copyOf(requires),
                                reasons));
            }
        }
        return new DossierTransitionsResponse(
                caseType,
                current,
                statusCodeValidationService.label("CASE_STATUS", current),
                currentState.map(st -> st.stage().name()).orElse(null),
                options);
    }

    /**
     * Un dossier démarre dans l'état initial du workflow de son type quand son statut n'en fait pas
     * partie (ex. {@code B2B_NEW} pour une demande de démo, au lieu de {@code CRM_NEW}).
     */
    private void applyInitialState(Dossier dossier) {
        workflowValidationService
                .workflowOf(dossier.getCaseType())
                .filter(w -> w.initialState() != null)
                .filter(w -> !w.hasState(currentCode(dossier)))
                .ifPresent(
                        w -> {
                            String initial = w.initialState();
                            dossier.setStatus(
                                    DossierStatusCodes.project(
                                            initial, w.state(initial).orElse(null)));
                            dossier.setStatusCode(initial);
                        });
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

                applyTransition(
                        dossier,
                        DossierStatusCodes.toCode(request.getStatus()),
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
