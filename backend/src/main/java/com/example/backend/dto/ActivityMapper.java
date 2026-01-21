package com.example.backend.dto;

import com.example.backend.entity.ActivityEntity;
import org.springframework.stereotype.Component;

@Component
public class ActivityMapper {

    public ActivityResponse toResponse(ActivityEntity entity) {
        ActivityResponse response = new ActivityResponse();
        response.setId(entity.getId());
        response.setType(entity.getType());
        response.setContent(entity.getContent());
        response.setDossierId(entity.getDossier().getId());
        response.setVisibility(entity.getVisibility());
        response.setCreatedAt(entity.getCreatedAt());
        response.setCreatedBy(entity.getCreatedBy());
        response.setMetadata(entity.getMetadata());
        return response;
    }
}
