package com.example.backend.dto;

import com.example.backend.entity.FilterPresetEntity;
import org.springframework.stereotype.Component;

@Component
public class FilterPresetMapper {

    public FilterPresetResponse toResponse(FilterPresetEntity entity) {
        if (entity == null) {
            return null;
        }

        FilterPresetResponse response = new FilterPresetResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setFilterType(entity.getFilterType());
        response.setDescription(entity.getDescription());
        response.setFilterConfig(entity.getFilterConfig());
        response.setIsShared(entity.getIsShared());
        response.setIsPredefined(entity.getIsPredefined());
        response.setCreatedBy(entity.getCreatedBy());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        return response;
    }

    public FilterPresetEntity toEntity(FilterPresetRequest request) {
        if (request == null) {
            return null;
        }

        FilterPresetEntity entity = new FilterPresetEntity();
        entity.setName(request.getName());
        entity.setFilterType(request.getFilterType());
        entity.setDescription(request.getDescription());
        entity.setFilterConfig(request.getFilterConfig());
        entity.setIsShared(request.getIsShared() != null ? request.getIsShared() : false);
        entity.setIsPredefined(false);

        return entity;
    }

    public void updateEntity(FilterPresetEntity entity, FilterPresetRequest request) {
        if (entity == null || request == null) {
            return;
        }

        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setFilterConfig(request.getFilterConfig());
        entity.setIsShared(request.getIsShared() != null ? request.getIsShared() : false);
    }
}
