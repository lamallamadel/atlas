package com.example.backend.service;

import com.example.backend.dto.ActivityCreateRequest;
import com.example.backend.dto.ActivityMapper;
import com.example.backend.dto.ActivityResponse;
import com.example.backend.dto.ActivityUpdateRequest;
import com.example.backend.entity.ActivityEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ActivityVisibility;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final DossierRepository dossierRepository;
    private final ActivityMapper activityMapper;

    public ActivityService(ActivityRepository activityRepository, 
                          DossierRepository dossierRepository,
                          ActivityMapper activityMapper) {
        this.activityRepository = activityRepository;
        this.dossierRepository = dossierRepository;
        this.activityMapper = activityMapper;
    }

    @Transactional
    public ActivityResponse create(ActivityCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(request.getDossierId())
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + request.getDossierId()));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + request.getDossierId());
        }

        ActivityEntity activity = new ActivityEntity();
        activity.setOrgId(orgId);
        activity.setType(request.getType());
        activity.setContent(request.getContent());
        activity.setDossier(dossier);
        activity.setVisibility(request.getVisibility());
        // createdBy is automatically set by JPA auditing

        ActivityEntity saved = activityRepository.save(activity);
        return activityMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ActivityResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ActivityEntity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + id));

        if (!orgId.equals(activity.getOrgId())) {
            throw new EntityNotFoundException("Activity not found with id: " + id);
        }

        return activityMapper.toResponse(activity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> list(Long dossierId, ActivityVisibility visibility, 
                                      LocalDateTime startDate, LocalDateTime endDate, 
                                      Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        if (dossierId != null) {
            Dossier dossier = dossierRepository.findById(dossierId)
                    .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));

            if (!orgId.equals(dossier.getOrgId())) {
                throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
            }

            Page<ActivityEntity> activities;
            
            if (visibility != null && startDate != null && endDate != null) {
                activities = activityRepository.findByDossierIdAndVisibilityAndCreatedAtBetween(
                    dossierId, visibility, startDate, endDate, pageable);
            } else if (visibility != null) {
                activities = activityRepository.findByDossierIdAndVisibility(
                    dossierId, visibility, pageable);
            } else if (startDate != null && endDate != null) {
                activities = activityRepository.findByDossierIdAndCreatedAtBetween(
                    dossierId, startDate, endDate, pageable);
            } else {
                activities = activityRepository.findByDossierIdOrderByCreatedAtDesc(
                    dossierId, pageable);
            }

            return activities.map(activityMapper::toResponse);
        }

        return Page.empty(pageable);
    }

    @Transactional
    public ActivityResponse update(Long id, ActivityUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ActivityEntity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + id));

        if (!orgId.equals(activity.getOrgId())) {
            throw new EntityNotFoundException("Activity not found with id: " + id);
        }

        if (request.getContent() != null) {
            activity.setContent(request.getContent());
        }

        if (request.getVisibility() != null) {
            activity.setVisibility(request.getVisibility());
        }

        ActivityEntity updated = activityRepository.save(activity);
        return activityMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ActivityEntity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + id));

        if (!orgId.equals(activity.getOrgId())) {
            throw new EntityNotFoundException("Activity not found with id: " + id);
        }

        activityRepository.delete(activity);
    }
}
