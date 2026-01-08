package com.example.backend.dto;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import org.springframework.stereotype.Component;

@Component
public class AnnonceMapper {

    public Annonce toEntity(AnnonceCreateRequest request) {
        Annonce annonce = new Annonce();
        annonce.setTitle(request.getTitle());
        annonce.setDescription(request.getDescription());
        annonce.setCategory(request.getCategory());
        annonce.setType(request.getType());
        annonce.setAddress(request.getAddress());
        annonce.setSurface(request.getSurface());
        annonce.setCity(request.getCity());
        annonce.setPrice(request.getPrice());
        annonce.setCurrency(request.getCurrency());
        annonce.setPhotos(request.getPhotos());
        annonce.setRulesJson(request.getRulesJson());
        annonce.setMeta(request.getMeta());
        annonce.setStatus(request.getStatus() != null ? request.getStatus() : AnnonceStatus.DRAFT);
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
        if (request.getType() != null) {
            annonce.setType(request.getType());
        }
        if (request.getAddress() != null) {
            annonce.setAddress(request.getAddress());
        }
        if (request.getSurface() != null) {
            annonce.setSurface(request.getSurface());
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
        if (request.getPhotos() != null) {
            annonce.setPhotos(request.getPhotos());
        }
        if (request.getRulesJson() != null) {
            annonce.setRulesJson(request.getRulesJson());
        }
        if (request.getMeta() != null) {
            annonce.setMeta(request.getMeta());
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
        response.setType(annonce.getType());
        response.setAddress(annonce.getAddress());
        response.setSurface(annonce.getSurface());
        response.setCity(annonce.getCity());
        response.setPrice(annonce.getPrice());
        response.setCurrency(annonce.getCurrency());
        response.setStatus(annonce.getStatus());
        response.setPhotos(annonce.getPhotos());
        response.setRulesJson(annonce.getRulesJson());
        response.setMeta(annonce.getMeta());
        response.setCreatedAt(annonce.getCreatedAt());
        response.setUpdatedAt(annonce.getUpdatedAt());
        response.setCreatedBy(annonce.getCreatedBy());
        response.setUpdatedBy(annonce.getUpdatedBy());
        return response;
    }
}
