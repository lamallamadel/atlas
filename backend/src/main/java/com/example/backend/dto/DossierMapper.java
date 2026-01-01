package com.example.backend.dto;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import org.springframework.stereotype.Component;

@Component
public class DossierMapper {

    public Dossier toEntity(DossierCreateRequest request) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(request.getOrgId());
        dossier.setAnnonceId(request.getAnnonceId());
        dossier.setLeadPhone(request.getLeadPhone());
        dossier.setLeadName(request.getLeadName());
        dossier.setLeadSource(request.getLeadSource());
        dossier.setStatus(DossierStatus.NEW);
        return dossier;
    }

    public DossierResponse toResponse(Dossier dossier) {
        DossierResponse response = new DossierResponse();
        response.setId(dossier.getId());
        response.setOrgId(dossier.getOrgId());
        response.setAnnonceId(dossier.getAnnonceId());
        response.setLeadPhone(dossier.getLeadPhone());
        response.setLeadName(dossier.getLeadName());
        response.setLeadSource(dossier.getLeadSource());
        response.setStatus(dossier.getStatus());
        response.setCreatedAt(dossier.getCreatedAt());
        response.setUpdatedAt(dossier.getUpdatedAt());
        response.setCreatedBy(dossier.getCreatedBy());
        response.setUpdatedBy(dossier.getUpdatedBy());
        return response;
    }
}
