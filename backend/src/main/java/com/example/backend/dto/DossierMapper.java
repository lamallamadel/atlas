package com.example.backend.dto;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class DossierMapper {

    private final PartiePrenanteMapper partiePrenanteMapper;
    private final AnnonceRepository annonceRepository;

    public DossierMapper(PartiePrenanteMapper partiePrenanteMapper, AnnonceRepository annonceRepository) {
        this.partiePrenanteMapper = partiePrenanteMapper;
        this.annonceRepository = annonceRepository;
    }

    public Dossier toEntity(DossierCreateRequest request) {
        Dossier dossier = new Dossier();
        dossier.setAnnonceId(request.getAnnonceId());
        dossier.setLeadPhone(request.getLeadPhone());
        dossier.setLeadName(request.getLeadName());
        dossier.setLeadSource(request.getLeadSource());
        dossier.setStatus(DossierStatus.NEW);
        dossier.setScore(request.getScore());
        dossier.setSource(request.getSource());

        if (request.getInitialParty() != null) {
            PartiePrenanteEntity party = partiePrenanteMapper.toEntity(request.getInitialParty());
            dossier.addParty(party);
        }

        return dossier;
    }

    public DossierResponse toResponse(Dossier dossier) {
        DossierResponse response = new DossierResponse();
        response.setId(dossier.getId());
        response.setOrgId(dossier.getOrgId());
        response.setAnnonceId(dossier.getAnnonceId());
        
        if (dossier.getAnnonceId() != null) {
            annonceRepository.findById(dossier.getAnnonceId())
                .ifPresent(annonce -> response.setAnnonceTitle(annonce.getTitle()));
        }
        
        response.setLeadPhone(dossier.getLeadPhone());
        response.setLeadName(dossier.getLeadName());
        response.setLeadSource(dossier.getLeadSource());
        response.setStatus(dossier.getStatus());
        response.setScore(dossier.getScore());
        response.setSource(dossier.getSource());
        response.setCreatedAt(dossier.getCreatedAt());
        response.setUpdatedAt(dossier.getUpdatedAt());
        response.setCreatedBy(dossier.getCreatedBy());
        response.setUpdatedBy(dossier.getUpdatedBy());

        if (dossier.getParties() != null) {
            response.setParties(
                dossier.getParties().stream()
                    .map(partiePrenanteMapper::toResponse)
                    .collect(Collectors.toList())
            );
        }

        return response;
    }
}
