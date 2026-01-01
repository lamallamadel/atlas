package com.example.backend.dto;

import com.example.backend.entity.PartiePrenanteEntity;
import org.springframework.stereotype.Component;

@Component
public class PartiePrenanteMapper {

    public PartiePrenanteEntity toEntity(PartiePrenanteRequest request) {
        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setRole(request.getRole());
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setAddress(request.getAddress());
        return entity;
    }

    public PartiePrenanteResponse toResponse(PartiePrenanteEntity entity) {
        PartiePrenanteResponse response = new PartiePrenanteResponse();
        response.setId(entity.getId());
        response.setDossierId(entity.getDossier() != null ? entity.getDossier().getId() : null);
        response.setRole(entity.getRole());
        response.setFirstName(entity.getFirstName());
        response.setLastName(entity.getLastName());
        response.setEmail(entity.getEmail());
        response.setPhone(entity.getPhone());
        response.setAddress(entity.getAddress());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
