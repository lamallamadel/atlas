package com.example.backend.dto;

import com.example.backend.entity.ReferentialEntity;

public class ReferentialMapper {

    public static ReferentialResponse toResponse(ReferentialEntity entity) {
        if (entity == null) {
            return null;
        }

        ReferentialResponse response = new ReferentialResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setCategory(entity.getCategory());
        response.setCode(entity.getCode());
        response.setLabel(entity.getLabel());
        response.setDescription(entity.getDescription());
        response.setDisplayOrder(entity.getDisplayOrder());
        response.setIsActive(entity.getIsActive());
        response.setIsSystem(entity.getIsSystem());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setCreatedBy(entity.getCreatedBy());
        response.setUpdatedBy(entity.getUpdatedBy());
        response.setVersion(entity.getVersion());
        response.setLastChangeType(entity.getLastChangeType());

        return response;
    }

    public static ReferentialEntity toEntity(ReferentialRequest request) {
        if (request == null) {
            return null;
        }

        ReferentialEntity entity = new ReferentialEntity();
        entity.setCategory(request.getCategory());
        entity.setCode(request.getCode());
        entity.setLabel(request.getLabel());
        entity.setDescription(request.getDescription());
        entity.setDisplayOrder(request.getDisplayOrder());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setIsSystem(false);

        return entity;
    }

    public static void updateEntityFromRequest(ReferentialEntity entity, ReferentialRequest request) {
        if (entity == null || request == null) {
            return;
        }

        entity.setLabel(request.getLabel());
        entity.setDescription(request.getDescription());
        entity.setDisplayOrder(request.getDisplayOrder());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
    }
}
