package com.example.backend.service;

import com.example.backend.dto.FilterPresetMapper;
import com.example.backend.dto.FilterPresetRequest;
import com.example.backend.dto.FilterPresetResponse;
import com.example.backend.entity.FilterPresetEntity;
import com.example.backend.repository.FilterPresetRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FilterPresetService {

    private final FilterPresetRepository filterPresetRepository;
    private final FilterPresetMapper filterPresetMapper;

    public FilterPresetService(
            FilterPresetRepository filterPresetRepository,
            FilterPresetMapper filterPresetMapper) {
        this.filterPresetRepository = filterPresetRepository;
        this.filterPresetMapper = filterPresetMapper;
    }

    public FilterPresetResponse create(FilterPresetRequest request) {
        FilterPresetEntity entity = filterPresetMapper.toEntity(request);
        entity.setOrgId(getCurrentOrgId());
        entity.setCreatedBy(getCurrentUserId());
        
        FilterPresetEntity saved = filterPresetRepository.save(entity);
        return filterPresetMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public FilterPresetResponse getById(Long id) {
        FilterPresetEntity entity = filterPresetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Filter preset not found with id: " + id));
        
        return filterPresetMapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<FilterPresetResponse> getAccessiblePresets(String filterType) {
        String orgId = getCurrentOrgId();
        String userId = getCurrentUserId();
        
        List<FilterPresetEntity> presets = filterPresetRepository
                .findAccessibleByFilterTypeAndOrgId(filterType, orgId, userId);
        
        return presets.stream()
                .map(filterPresetMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FilterPresetResponse> getPredefinedPresets(String filterType) {
        String orgId = getCurrentOrgId();
        
        List<FilterPresetEntity> presets = filterPresetRepository
                .findPredefinedByFilterType(filterType, orgId);
        
        return presets.stream()
                .map(filterPresetMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FilterPresetResponse> getUserPresets(String filterType) {
        String orgId = getCurrentOrgId();
        String userId = getCurrentUserId();
        
        List<FilterPresetEntity> presets = filterPresetRepository
                .findByFilterTypeAndCreatedBy(filterType, userId, orgId);
        
        return presets.stream()
                .map(filterPresetMapper::toResponse)
                .collect(Collectors.toList());
    }

    public FilterPresetResponse update(Long id, FilterPresetRequest request) {
        FilterPresetEntity entity = filterPresetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Filter preset not found with id: " + id));
        
        if (entity.getIsPredefined()) {
            throw new IllegalStateException("Cannot update predefined filter preset");
        }
        
        String currentUserId = getCurrentUserId();
        if (!entity.getCreatedBy().equals(currentUserId)) {
            throw new IllegalStateException("Cannot update filter preset created by another user");
        }
        
        filterPresetMapper.updateEntity(entity, request);
        FilterPresetEntity updated = filterPresetRepository.save(entity);
        
        return filterPresetMapper.toResponse(updated);
    }

    public void delete(Long id) {
        FilterPresetEntity entity = filterPresetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Filter preset not found with id: " + id));
        
        if (entity.getIsPredefined()) {
            throw new IllegalStateException("Cannot delete predefined filter preset");
        }
        
        String currentUserId = getCurrentUserId();
        if (!entity.getCreatedBy().equals(currentUserId)) {
            throw new IllegalStateException("Cannot delete filter preset created by another user");
        }
        
        filterPresetRepository.delete(entity);
    }

    private String getCurrentOrgId() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        return orgId;
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "system";
        }
        return authentication.getName();
    }
}
