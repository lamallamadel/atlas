package com.example.backend.dto;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.DossierSource;
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
        if ( request.getSource() == null ) request.setSource( DossierSource.UNKNOWN ) ;
        dossier.setAnnonceId(request.getAnnonceId());
        dossier.setLeadPhone(request.getLeadPhone());
        dossier.setLeadName(request.getLeadName());
        dossier.setLeadSource(request.getLeadSource());
        dossier.setNotes(request.getNotes());
        dossier.setStatus(DossierStatus.NEW);
        dossier.setSource(request.getSource() );
        dossier.setSource(request.getSource());
        
        dossier.setCaseType(request.getCaseType() != null ? request.getCaseType() : "CRM_LEAD_BUY");
        dossier.setStatusCode(request.getStatusCode() != null ? request.getStatusCode() : "NEW");
        dossier.setLossReason(request.getLossReason());
        dossier.setWonReason(request.getWonReason());

        if (request.getInitialParty() != null) {
            PartiePrenanteEntity party = partiePrenanteMapper.toEntity(request.getInitialParty());
            if (party.getName() == null && party.getFirstName() != null && party.getLastName() != null) {
                party.setName(party.getFirstName() + " " + party.getLastName());
            }
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
        response.setNotes(dossier.getNotes());
        response.setStatus(dossier.getStatus());
        response.setCaseType(dossier.getCaseType());
        response.setStatusCode(dossier.getStatusCode());
        response.setLossReason(dossier.getLossReason());
        response.setWonReason(dossier.getWonReason());
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
