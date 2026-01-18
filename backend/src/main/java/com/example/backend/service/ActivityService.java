package com.example.backend.service;

import com.example.backend.dto.ActivityCreateRequest;
import com.example.backend.dto.ActivityMapper;
import com.example.backend.dto.ActivityResponse;
import com.example.backend.dto.ActivityUpdateRequest;
import com.example.backend.entity.ActivityEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ActivityType;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final DossierRepository dossierRepository;
    private final ActivityMapper activityMapper;
    private final UserService userService;

    public ActivityService(ActivityRepository activityRepository, 
                          DossierRepository dossierRepository,
                          ActivityMapper activityMapper,
                          UserService userService) {
        this.activityRepository = activityRepository;
        this.dossierRepository = dossierRepository;
        this.activityMapper = activityMapper;
        this.userService = userService;
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

        LocalDateTime now = LocalDateTime.now();
        activity.setCreatedAt(now);
        activity.setUpdatedAt(now);

        ActivityEntity saved = activityRepository.save(activity);
        ActivityResponse response = activityMapper.toResponse(saved);
        response.setCreatedByName(userService.getUserDisplayName(saved.getCreatedBy()));
        return response;
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

        ActivityResponse response = activityMapper.toResponse(activity);
        response.setCreatedByName(userService.getUserDisplayName(activity.getCreatedBy()));
        return response;
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

            return enrichWithUserNames(activities);
        }

        return Page.empty(pageable);
    }

    private Page<ActivityResponse> enrichWithUserNames(Page<ActivityEntity> activities) {
        List<ActivityEntity> content = activities.getContent();
        
        if (content.isEmpty()) {
            return activities.map(activityMapper::toResponse);
        }

        List<String> userIds = content.stream()
                .map(ActivityEntity::getCreatedBy)
                .distinct()
                .collect(Collectors.toList());

        Map<String, String> displayNames = userService.getUserDisplayNames(userIds);

        return activities.map(activity -> {
            ActivityResponse response = activityMapper.toResponse(activity);
            String displayName = displayNames.get(activity.getCreatedBy());
            response.setCreatedByName(displayName != null ? displayName : userService.getUserDisplayName(activity.getCreatedBy()));
            return response;
        });
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

        activity.setUpdatedAt(LocalDateTime.now());
        ActivityEntity updated = activityRepository.save(activity);
        ActivityResponse response = activityMapper.toResponse(updated);
        response.setCreatedByName(userService.getUserDisplayName(updated.getCreatedBy()));
        return response;
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

    @Transactional
    public void logActivity(Long dossierId, String activityType, String description, Map<String, Object> metadata) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        ActivityEntity activity = new ActivityEntity();
        activity.setOrgId(orgId);
        activity.setType(ActivityType.valueOf(activityType));
        activity.setContent(description);
        activity.setDossier(dossier);
        activity.setVisibility(ActivityVisibility.INTERNAL);

        LocalDateTime now = LocalDateTime.now();
        activity.setCreatedAt(now);
        activity.setUpdatedAt(now);

        activityRepository.save(activity);
    }
}
