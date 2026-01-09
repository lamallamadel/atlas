package com.example.backend.dto;

import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.PartiePrenanteRole;
import org.springframework.stereotype.Component;

@Component
public class PartiePrenanteMapper {

    public PartiePrenanteEntity toEntity(PartiePrenanteCreateRequest request) {
        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setRole(PartiePrenanteRole.valueOf(request.getRole()));
        entity.setName(request.getName());
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setAddress(request.getAddress());
        entity.setMeta(request.getMeta());
        return entity;
    }

    /**
     * Convenience mapper used when a partie prenante is embedded in other requests
     * (e.g., dossier creation). In that case, the dossier association is handled by
     * the caller and no dossierId field is available/needed.
     */
    public PartiePrenanteEntity toEntity(PartiePrenanteRequest request) {
        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setRole(request.getRole());
        entity.setName(request.getName());
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setAddress(request.getAddress());
        entity.setMeta(request.getMeta());
        return entity;
    }

    public void updateEntity(PartiePrenanteEntity entity, PartiePrenanteUpdateRequest request) {
        if (request.getRole() != null) {
            entity.setRole(PartiePrenanteRole.valueOf(request.getRole()));
        }
        entity.setName(request.getName());
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setAddress(request.getAddress());
        entity.setMeta(request.getMeta());
    }

    public PartiePrenanteResponse toResponse(PartiePrenanteEntity entity) {
        PartiePrenanteResponse response = new PartiePrenanteResponse();
        response.setId(entity.getId());
        response.setDossierId(entity.getDossier() != null ? entity.getDossier().getId() : null);
        response.setRole(entity.getRole());
        response.setName(entity.getName());
        response.setFirstName(entity.getFirstName());
        response.setLastName(entity.getLastName());
        response.setEmail(entity.getEmail());
        response.setPhone(entity.getPhone());
        response.setAddress(entity.getAddress());
        response.setMeta(entity.getMeta());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
