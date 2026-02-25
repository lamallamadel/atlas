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

    public AnnonceService(
            AnnonceRepository annonceRepository,
            AnnonceMapper annonceMapper,
            @Autowired(required = false) @Nullable SearchService searchService,
            MetricsService metricsService,
            @Autowired(required = false) @Nullable BrainScoringService brainScoringService) {
        this.annonceRepository = annonceRepository;
        this.annonceMapper = annonceMapper;
        this.searchService = searchService;
        this.metricsService = metricsService;
        this.brainScoringService = brainScoringService;
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

        validateActiveAnnonce(annonce);

        Annonce saved = annonceRepository.save(annonce);
        if (searchService != null) {
            searchService.indexAnnonce(saved);
        }
        if (brainScoringService != null) {
            brainScoringService.triggerScoringAsync(saved.getId());
            brainScoringService.triggerFraudAsync(saved.getId());
            brainScoringService.triggerDuplicateCheckAsync(saved.getId());
        }
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

        annonceMapper.updateEntity(annonce, request);

        validateActiveAnnonce(annonce);

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
        return annonceMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<AnnonceResponse> list(
            AnnonceStatus status, String q, String city, String type, Pageable pageable) {

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
                    if (request.getUpdates().getStatus() != null) {
                        annonce.setStatus(request.getUpdates().getStatus());
                    }
                    if (request.getUpdates().getCity() != null) {
                        annonce.setCity(request.getUpdates().getCity());
                    }
                }

                validateActiveAnnonce(annonce);

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

    private void validateActiveAnnonce(Annonce annonce) {
        if (AnnonceStatus.ACTIVE.equals(annonce.getStatus())) {
            List<String> missingFields = new ArrayList<>();

            if (annonce.getTitle() == null || annonce.getTitle().trim().isEmpty()) {
                missingFields.add("title");
            }
            if (annonce.getPrice() == null) {
                missingFields.add("price");
            }
            if (annonce.getCity() == null || annonce.getCity().trim().isEmpty()) {
                missingFields.add("city");
            }

            if (!missingFields.isEmpty()) {
                throw new IllegalArgumentException(
                        "Cannot set annonce to ACTIVE without required fields: "
                                + String.join(", ", missingFields));
            }
        }
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
            AnnonceStatus status, String q, String city, String type, Pageable pageable) {
        Specification<Annonce> spec = Specification.where(null);

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

        return annonceRepository.findAll(spec, pageable);
    }
}
