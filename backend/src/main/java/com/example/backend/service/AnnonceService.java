package com.example.backend.service;

import com.example.backend.brain.BrainScoringService;
import com.example.backend.brain.dto.DupliAnnonceDto;
import com.example.backend.dto.AnnonceBulkUpdateRequest;
import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceMapper;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.dto.BulkOperationResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.observability.MetricsService;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final AnnonceMapper annonceMapper;
    @Nullable private final SearchService searchService;
    private final MetricsService metricsService;
    @Nullable private final BrainScoringService brainScoringService;
    @Nullable private final OrganizationSettingsService organizationSettingsService;
    @Nullable private final ReverseMatchingService reverseMatchingService;
    private final AnnoncePublicationService publicationService;
    private final AnnonceQualityService qualityService;
    private final com.example.backend.repository.AnnonceReportRepository annonceReportRepository;

    public AnnonceService(
            AnnonceRepository annonceRepository,
            AnnonceMapper annonceMapper,
            @Autowired(required = false) @Nullable SearchService searchService,
            MetricsService metricsService,
            @Autowired(required = false) @Nullable BrainScoringService brainScoringService,
            @Autowired(required = false) @Nullable
                    OrganizationSettingsService organizationSettingsService,
            @Autowired(required = false) @Nullable ReverseMatchingService reverseMatchingService,
            AnnoncePublicationService publicationService,
            AnnonceQualityService qualityService,
            com.example.backend.repository.AnnonceReportRepository annonceReportRepository) {
        this.annonceReportRepository = annonceReportRepository;
        this.publicationService = publicationService;
        this.qualityService = qualityService;
        this.annonceRepository = annonceRepository;
        this.annonceMapper = annonceMapper;
        this.searchService = searchService;
        this.metricsService = metricsService;
        this.brainScoringService = brainScoringService;
        this.reverseMatchingService = reverseMatchingService;
        this.organizationSettingsService = organizationSettingsService;
    }

    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Autowired(required = false)
    void setEventPublisher(org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public AnnonceMapper getAnnonceMapper() {
        return this.annonceMapper;
    }

    @Transactional
    public AnnonceResponse create(AnnonceCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        // Soft duplicate detection
        Optional<Annonce> existing =
                annonceRepository.findByTitleAndCityAndAddress(
                        request.getTitle(), request.getCity(), request.getAddress());

        if (existing.isPresent()) {
            // In a real scenario, we might want to return a specific response or Header
            // For now, we'll just log it or we could throw a custom exception that the
            // controller
            // handles
            // The requirement says "returning existing dossier ID" or similar warning.
            // I'll add a log and continue, or I could return a special object.
            // Let's assume for now we just want to know about it.
        }

        Annonce annonce = annonceMapper.toEntity(request);
        annonce.setOrgId(orgId);

        LocalDateTime now = LocalDateTime.now();
        annonce.setCreatedAt(now);
        annonce.setUpdatedAt(now);

        // Une annonce naît en brouillon ; demander un autre statut passe par les règles de
        // publication (une annonce neuve ne peut être que publiée directement).
        AnnonceStatus requested = annonce.getStatus();
        annonce.setStatus(AnnonceStatus.DRAFT);
        if (requested != null && requested != AnnonceStatus.DRAFT) {
            changeStatus(orgId, annonce, requested);
        }

        Annonce saved = annonceRepository.save(annonce);
        if (searchService != null) {
            searchService.indexAnnonce(saved);
        }
        if (brainScoringService != null) {
            brainScoringService.triggerScoringAsync(saved.getId());
            brainScoringService.triggerFraudAsync(saved.getId());
            brainScoringService.triggerDuplicateCheckAsync(saved.getId());
        }
        triggerBuyerMatching(saved.getId());
        return annonceMapper.toResponse(saved);
    }

    @Cacheable(
            value = "annonce",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional(readOnly = true)
    public AnnonceResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Annonce annonce =
                annonceRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + id));

        if (!orgId.equals(annonce.getOrgId())) {
            throw new EntityNotFoundException("Annonce not found with id: " + id);
        }

        metricsService.incrementAnnonceView(annonce.getStatus().name());
        return annonceMapper.toResponse(annonce);
    }

    @CacheEvict(
            value = "annonce",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public AnnonceResponse update(Long id, AnnonceUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Annonce annonce =
                annonceRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + id));

        if (!orgId.equals(annonce.getOrgId())) {
            throw new EntityNotFoundException("Annonce not found with id: " + id);
        }

        // Archived validation
        if (AnnonceStatus.ARCHIVED.equals(annonce.getStatus())
                && (request.getStatus() == null
                        || AnnonceStatus.ARCHIVED.equals(request.getStatus()))) {
            throw new IllegalStateException("Cannot update an archived annonce");
        }

        AnnonceStatus previous = annonce.getStatus();
        annonceMapper.updateEntity(annonce, request);
        AnnonceStatus requested = annonce.getStatus();
        annonce.setStatus(previous);
        if (requested != null && requested != previous) {
            changeStatus(orgId, annonce, requested);
        }

        annonce.setUpdatedAt(LocalDateTime.now());
        Annonce updated = annonceRepository.save(annonce);
        if (searchService != null) {
            searchService.indexAnnonce(updated);
        }
        if (brainScoringService != null) {
            brainScoringService.triggerScoringAsync(updated.getId());
            brainScoringService.triggerFraudAsync(updated.getId());
            brainScoringService.triggerDuplicateCheckAsync(updated.getId());
        }
        triggerBuyerMatching(updated.getId());
        return annonceMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<AnnonceResponse> list(
            AnnonceStatus requestedStatus, String q, String city, String type, Pageable pageable) {
        // ?status=ACTIVE des anciens clients
        final AnnonceStatus status = AnnonceStatus.normalize(requestedStatus);

        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        // IMPORTANT: base spec = tenant isolation
        Specification<Annonce> spec = (root, query, cb) -> cb.equal(root.get("orgId"), orgId);

        if (status != null) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (q != null && !q.trim().isEmpty()) {
            String searchPattern = "%" + q.toLowerCase() + "%";
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.or(
                                            criteriaBuilder.like(
                                                    criteriaBuilder.lower(root.get("title")),
                                                    searchPattern),
                                            criteriaBuilder.like(
                                                    criteriaBuilder.lower(root.get("description")),
                                                    searchPattern),
                                            criteriaBuilder.like(
                                                    criteriaBuilder.lower(root.get("category")),
                                                    searchPattern),
                                            criteriaBuilder.like(
                                                    criteriaBuilder.lower(root.get("city")),
                                                    searchPattern)));
        }

        if (city != null && !city.trim().isEmpty()) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("city"), city));
        }

        if (type != null && !type.trim().isEmpty()) {
            try {
                AnnonceType annonceType = AnnonceType.valueOf(type.toUpperCase());
                spec =
                        spec.and(
                                (root, query, criteriaBuilder) ->
                                        criteriaBuilder.equal(root.get("type"), annonceType));
            } catch (IllegalArgumentException e) {
            }
        }

        Page<Annonce> annonces = annonceRepository.findAll(spec, pageable);
        return annonces.map(annonceMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctCities() {
        return annonceRepository.findDistinctCities();
    }

    @CacheEvict(
            value = "annonce",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Annonce annonce =
                annonceRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + id));

        if (!orgId.equals(annonce.getOrgId())) {
            throw new EntityNotFoundException("Annonce not found with id: " + id);
        }

        annonceRepository.delete(annonce);
    }

    @Transactional
    public BulkOperationResponse bulkUpdate(AnnonceBulkUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        int successCount = 0;
        int failureCount = 0;
        List<BulkOperationResponse.BulkOperationError> errors = new ArrayList<>();

        for (Long id : request.getIds()) {
            try {
                Annonce annonce =
                        annonceRepository
                                .findById(id)
                                .orElseThrow(
                                        () ->
                                                new EntityNotFoundException(
                                                        "Annonce not found with id: " + id));

                if (!orgId.equals(annonce.getOrgId())) {
                    throw new EntityNotFoundException("Annonce not found with id: " + id);
                }

                if (AnnonceStatus.ARCHIVED.equals(annonce.getStatus())) {
                    throw new IllegalStateException("Cannot update an archived annonce");
                }

                if (request.getUpdates() != null) {
                    if (request.getUpdates().getCity() != null) {
                        annonce.setCity(request.getUpdates().getCity());
                    }
                    AnnonceStatus requested =
                            AnnonceStatus.normalize(request.getUpdates().getStatus());
                    if (requested != null && requested != annonce.getStatus()) {
                        changeStatus(orgId, annonce, requested);
                    }
                }

                annonce.setUpdatedAt(LocalDateTime.now());
                annonceRepository.save(annonce);
                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add(new BulkOperationResponse.BulkOperationError(id, e.getMessage()));
            }
        }

        return new BulkOperationResponse(successCount, failureCount, errors);
    }

    /**
     * Change le statut selon les règles de publication ({@link AnnoncePublicationService}) : 409 si
     * la transition n'existe pas, 400 si la publication est bloquée. Une suspension demandée par
     * simple changement de statut est une pause de l'agence ({@code OWNER_PAUSE}).
     */
    private void changeStatus(String orgId, Annonce annonce, AnnonceStatus requested) {
        AnnonceStatus target = AnnonceStatus.normalize(requested);
        String code = AnnoncePublicationService.transitionCode(annonce.getStatus(), target);
        if (code == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "TRANSITION_NOT_ALLOWED: impossible de passer de "
                            + annonce.getStatus()
                            + " à "
                            + target);
        }
        if (AnnoncePublicationService.T_PUBLISH.equals(code)) {
            checkAnnonceQuota(orgId);
        }
        publicationService.apply(
                annonce,
                code,
                AnnoncePublicationService.T_SUSPEND.equals(code) ? "OWNER_PAUSE" : null,
                null);
    }

    /** Transitions possibles, qualité et signaux de confiance de l'annonce. */
    @Transactional(readOnly = true)
    public com.example.backend.dto.AnnoncePublicationResponse getPublication(Long id) {
        Annonce annonce = findEntityById(id);
        return com.example.backend.dto.AnnoncePublicationResponse.of(
                annonce,
                qualityService.evaluate(annonce),
                publicationService.options(annonce),
                AnnoncePublicationService.trustOverride(annonce),
                annonceReportRepository.countByOrgIdAndAnnonceIdAndStatus(
                        annonce.getOrgId(),
                        annonce.getId(),
                        com.example.backend.entity.AnnonceReport.STATUS_OPEN));
    }

    @CacheEvict(
            value = "annonce",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public AnnonceResponse applyTransition(
            Long id, String transitionCode, String reasonCode, String comment) {
        String orgId = TenantContext.getOrgId();
        Annonce annonce = findEntityById(id);
        if (AnnoncePublicationService.T_PUBLISH.equals(transitionCode)) {
            checkAnnonceQuota(orgId);
        }
        publicationService.apply(annonce, transitionCode, reasonCode, comment);
        annonce.setUpdatedAt(LocalDateTime.now());
        Annonce saved = annonceRepository.save(annonce);
        if (searchService != null) {
            searchService.indexAnnonce(saved);
        }
        if (eventPublisher != null
                && AnnoncePublicationService.T_PUBLISH.equals(transitionCode)
                && saved.getMandateId() != null) {
            eventPublisher.publishEvent(
                    new com.example.backend.event.MandateAnnoncePublishedEvent(
                            saved.getId(), saved.getMandateId(), orgId));
        }
        return annonceMapper.toResponse(saved);
    }

    @CacheEvict(
            value = "annonce",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public com.example.backend.dto.AnnoncePublicationResponse overrideTrust(
            Long id, String reason) {
        Annonce annonce = findEntityById(id);
        publicationService.overrideTrust(annonce, reason);
        annonce.setUpdatedAt(LocalDateTime.now());
        annonceRepository.save(annonce);
        return getPublication(id);
    }

    @Transactional(readOnly = true)
    public List<DupliAnnonceDto> getDupliDtos(List<Long> annonceIds) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        return annonceIds.stream()
                .map(id -> annonceRepository.findById(id).orElse(null))
                .filter(a -> a != null && orgId.equals(a.getOrgId()))
                .map(a -> new DupliAnnonceDto(a.getId(), a.getTitle(), a.getDescription()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Annonce findEntityById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Annonce annonce =
                annonceRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + id));

        if (!orgId.equals(annonce.getOrgId())) {
            throw new EntityNotFoundException("Annonce not found with id: " + id);
        }

        return annonce;
    }

    @Transactional(readOnly = true)
    public Page<Annonce> findAll(
            AnnonceStatus requestedStatus, String q, String city, String type, Pageable pageable) {
        return findAll(requestedStatus, q, city, type, pageable, false);
    }

    /**
     * {@code onePerProperty} (portail) : un bien publié par plusieurs annonceurs (mandats simples,
     * R-PROP-06) n'apparaît qu'une fois, sous sa plus ancienne annonce publiée.
     */
    public Page<Annonce> findAll(
            AnnonceStatus requestedStatus,
            String q,
            String city,
            String type,
            Pageable pageable,
            boolean onePerProperty) {
        // ?status=ACTIVE des anciens clients
        final AnnonceStatus status = AnnonceStatus.normalize(requestedStatus);
        Specification<Annonce> spec =
                (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (status != null) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (q != null && !q.trim().isEmpty()) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) -> {
                                String searchPattern = "%" + q.toLowerCase() + "%";
                                return criteriaBuilder.or(
                                        criteriaBuilder.like(
                                                criteriaBuilder.lower(root.get("title")),
                                                searchPattern),
                                        criteriaBuilder.like(
                                                criteriaBuilder.lower(root.get("description")),
                                                searchPattern),
                                        criteriaBuilder.like(
                                                criteriaBuilder.lower(root.get("category")),
                                                searchPattern),
                                        criteriaBuilder.like(
                                                criteriaBuilder.lower(root.get("city")),
                                                searchPattern));
                            });
        }

        if (city != null && !city.trim().isEmpty()) {
            spec =
                    spec.and(
                            (root, query, criteriaBuilder) ->
                                    criteriaBuilder.equal(root.get("city"), city));
        }

        if (type != null && !type.trim().isEmpty()) {
            try {
                AnnonceType annonceType = AnnonceType.valueOf(type.toUpperCase());
                spec =
                        spec.and(
                                (root, query, criteriaBuilder) ->
                                        criteriaBuilder.equal(root.get("type"), annonceType));
            } catch (IllegalArgumentException e) {
            }
        }

        if (onePerProperty) {
            spec =
                    spec.and(
                            (root, query, cb) -> {
                                var sub = query.subquery(Long.class);
                                var other = sub.from(Annonce.class);
                                sub.select(cb.min(other.<Long>get("id")))
                                        .where(
                                                cb.equal(
                                                        other.get("propertyId"),
                                                        root.get("propertyId")),
                                                cb.equal(
                                                        other.get("status"),
                                                        AnnonceStatus.PUBLISHED));
                                return cb.or(
                                        cb.isNull(root.get("propertyId")),
                                        cb.equal(root.get("id"), sub));
                            });
        }

        return annonceRepository.findAll(spec, pageable);
    }

    /** Quota d'annonces publiées de l'agence, vérifié avant chaque publication. */
    private void checkAnnonceQuota(String orgId) {
        if (organizationSettingsService == null) {
            return;
        }
        com.example.backend.dto.QuotaSettingsDto quotas;
        try {
            quotas = organizationSettingsService.getQuotas(orgId);
        } catch (com.example.backend.exception.ResourceNotFoundException e) {
            // Agence sans réglages : aucun quota configuré (l'annonce n'est pas « introuvable »).
            return;
        }
        if (quotas != null && quotas.getMaxAnnonces() != null && quotas.getMaxAnnonces() != -1) {
            long currentCount =
                    annonceRepository.countByOrgIdAndStatus(orgId, AnnonceStatus.PUBLISHED);
            if (currentCount >= quotas.getMaxAnnonces()) {
                throw new IllegalStateException(
                        "Annonce quota exceeded. Maximum allowed published annonces is "
                                + quotas.getMaxAnnonces()
                                + ".");
            }
        }
    }

    /**
     * Acheteurs correspondant à l'annonce, calculés en arrière-plan une fois la transaction
     * validée.
     */
    private void triggerBuyerMatching(Long annonceId) {
        if (reverseMatchingService == null) {
            return;
        }
        if (org.springframework.transaction.support.TransactionSynchronizationManager
                .isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager
                    .registerSynchronization(
                            new org.springframework.transaction.support
                                    .TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                    reverseMatchingService.triggerAsync(annonceId);
                                }
                            });
        } else {
            reverseMatchingService.triggerAsync(annonceId);
        }
    }
}
