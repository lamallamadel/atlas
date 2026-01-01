package com.example.backend.dto;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import org.springframework.stereotype.Component;

@Component
public class AnnonceMapper {

    public Annonce toEntity(AnnonceCreateRequest request) {
        Annonce annonce = new Annonce();
        annonce.setOrgId(request.getOrgId());
        annonce.setTitle(request.getTitle());
        annonce.setDescription(request.getDescription());
        annonce.setCategory(request.getCategory());
        annonce.setCity(request.getCity());
        annonce.setPrice(request.getPrice());
        annonce.setCurrency(request.getCurrency());
        annonce.setStatus(AnnonceStatus.DRAFT);
        return annonce;
    }

    public void updateEntity(Annonce annonce, AnnonceUpdateRequest request) {
        if (request.getTitle() != null) {
            annonce.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            annonce.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            annonce.setCategory(request.getCategory());
        }
        if (request.getCity() != null) {
            annonce.setCity(request.getCity());
        }
        if (request.getPrice() != null) {
            annonce.setPrice(request.getPrice());
        }
        if (request.getCurrency() != null) {
            annonce.setCurrency(request.getCurrency());
        }
        if (request.getStatus() != null) {
            annonce.setStatus(request.getStatus());
        }
    }

    public AnnonceResponse toResponse(Annonce annonce) {
        AnnonceResponse response = new AnnonceResponse();
        response.setId(annonce.getId());
        response.setOrgId(annonce.getOrgId());
        response.setTitle(annonce.getTitle());
        response.setDescription(annonce.getDescription());
        response.setCategory(annonce.getCategory());
        response.setCity(annonce.getCity());
        response.setPrice(annonce.getPrice());
        response.setCurrency(annonce.getCurrency());
        response.setStatus(annonce.getStatus());
        response.setCreatedAt(annonce.getCreatedAt());
        response.setUpdatedAt(annonce.getUpdatedAt());
        response.setCreatedBy(annonce.getCreatedBy());
        response.setUpdatedBy(annonce.getUpdatedBy());
        return response;
    }
}
