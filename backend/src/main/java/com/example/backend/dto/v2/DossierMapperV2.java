package com.example.backend.dto.v2;

import com.example.backend.entity.Dossier;
import com.example.backend.repository.AnnonceRepository;
import java.time.ZoneOffset;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class DossierMapperV2 {

    private final PartiePrenanteMapperV2 partiePrenanteMapper;
    private final AnnonceRepository annonceRepository;

    public DossierMapperV2(
            PartiePrenanteMapperV2 partiePrenanteMapper, AnnonceRepository annonceRepository) {
        this.partiePrenanteMapper = partiePrenanteMapper;
        this.annonceRepository = annonceRepository;
    }

    public DossierResponseV2 toResponse(Dossier dossier) {
        DossierResponseV2 response = new DossierResponseV2();
        response.setId(dossier.getId());
        response.setOrgId(dossier.getOrgId());

        if (dossier.getAnnonceId() != null) {
            DossierResponseV2.AnnonceInfoV2 annonceInfo = new DossierResponseV2.AnnonceInfoV2();
            annonceInfo.setId(dossier.getAnnonceId());

            annonceRepository
                    .findById(dossier.getAnnonceId())
                    .ifPresent(
                            annonce -> {
                                annonceInfo.setTitle(annonce.getTitle());
                                annonceInfo.setCity(annonce.getCity());
                            });

            response.setAnnonce(annonceInfo);
        }

        DossierResponseV2.LeadInfoV2 leadInfo = new DossierResponseV2.LeadInfoV2();
        leadInfo.setPhone(dossier.getLeadPhone());
        leadInfo.setName(dossier.getLeadName());
        leadInfo.setSource(dossier.getLeadSource());
        response.setLead(leadInfo);

        response.setNotes(dossier.getNotes());
        response.setStatus(dossier.getStatus());
        response.setCaseType(dossier.getCaseType());
        response.setStatusCode(
                dossier.getStatusCode() != null
                        ? dossier.getStatusCode()
                        : (dossier.getStatus() != null ? dossier.getStatus().name() : null));
        response.setLossReason(dossier.getLossReason());
        response.setWonReason(dossier.getWonReason());
        response.setScore(dossier.getScore());
        response.setSource(dossier.getSource());

        if (dossier.getParties() != null) {
            response.setParties(
                    dossier.getParties().stream()
                            .map(partiePrenanteMapper::toResponse)
                            .collect(Collectors.toList()));
        }

        DossierResponseV2.AuditInfoV2 audit = new DossierResponseV2.AuditInfoV2();
        if (dossier.getCreatedAt() != null) {
            audit.setCreatedAt(dossier.getCreatedAt().atZone(ZoneOffset.UTC).toInstant());
        }
        if (dossier.getUpdatedAt() != null) {
            audit.setUpdatedAt(dossier.getUpdatedAt().atZone(ZoneOffset.UTC).toInstant());
        }
        audit.setCreatedBy(dossier.getCreatedBy());
        audit.setUpdatedBy(dossier.getUpdatedBy());
        response.setAudit(audit);

        return response;
    }
}
