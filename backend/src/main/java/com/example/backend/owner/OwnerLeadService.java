package com.example.backend.owner;

import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.repository.DossierRepository;
import com.example.backend.service.DossierService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Contacts reçus par le propriétaire sur ses annonces (UC-P4) : ce sont des dossiers {@code
 * CRM_LEAD_BUY} / {@code CRM_LEAD_RENT} de son organisation, montrés avec des statuts simplifiés.
 * Les transitions restent celles du workflow (ADR 0004).
 */
@Service
public class OwnerLeadService {

    /** Statuts proposés au propriétaire, dans l'ordre du parcours. */
    public static final Map<String, String> STATUS_LABELS = new LinkedHashMap<>();

    static {
        STATUS_LABELS.put("CRM_NEW", "Nouveau");
        STATUS_LABELS.put("CRM_QUALIFYING", "En contact");
        STATUS_LABELS.put("CRM_QUALIFIED", "En contact");
        STATUS_LABELS.put("CRM_VISIT_PLANNED", "Visite prévue");
        STATUS_LABELS.put("CRM_CLOSED_WON", "Conclu");
        STATUS_LABELS.put("CRM_CLOSED_LOST", "Sans suite");
    }

    private static final List<String> OWNER_TARGETS =
            List.of("CRM_QUALIFYING", "CRM_VISIT_PLANNED", "CRM_CLOSED_WON", "CRM_CLOSED_LOST");

    private final OwnerContext ownerContext;
    private final DossierRepository dossiers;
    private final DossierService dossierService;

    public OwnerLeadService(
            OwnerContext ownerContext, DossierRepository dossiers, DossierService dossierService) {
        this.ownerContext = ownerContext;
        this.dossiers = dossiers;
        this.dossierService = dossierService;
    }

    public record StatusOption(String code, String label) {}

    public record OwnerLead(
            Long id,
            Long annonceId,
            String name,
            String phone,
            String email,
            String message,
            String statusCode,
            String statusLabel,
            List<StatusOption> next,
            LocalDateTime createdAt) {}

    @Transactional(readOnly = true)
    public List<OwnerLead> list() {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return dossiers.findAll().stream()
                .filter(d -> orgId.equals(d.getOrgId()))
                .sorted(
                        Comparator.comparing(
                                Dossier::getCreatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toLead)
                .toList();
    }

    @Transactional
    public OwnerLead changeStatus(Long id, String statusCode) {
        Dossier dossier = require(id);
        if (!OWNER_TARGETS.contains(statusCode)
                || !next(dossier).stream().anyMatch(o -> o.code().equals(statusCode))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "TRANSITION_NOT_ALLOWED: ce changement de statut n'est pas possible.");
        }
        DossierStatusPatchRequest patch = new DossierStatusPatchRequest();
        patch.setStatusCode(statusCode);
        dossierService.patchStatus(id, patch);
        return toLead(require(id));
    }

    private Dossier require(Long id) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return dossiers.findById(id)
                .filter(d -> orgId.equals(d.getOrgId()))
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Contact introuvable"));
    }

    private List<StatusOption> next(Dossier d) {
        List<String> allowed =
                dossierService.transitions(d.getId()).transitions().stream()
                        // Une transition qui exige une saisie (rendez-vous, raison) reste au Pro.
                        .filter(t -> t.requires() == null || t.requires().isEmpty())
                        .map(t -> t.statusCode())
                        .toList();
        return OWNER_TARGETS.stream()
                .filter(allowed::contains)
                .map(code -> new StatusOption(code, STATUS_LABELS.get(code)))
                .toList();
    }

    private OwnerLead toLead(Dossier d) {
        String code = d.getStatusCode();
        return new OwnerLead(
                d.getId(),
                d.getAnnonceId(),
                d.getLeadName(),
                d.getLeadPhone(),
                d.getLeadEmail(),
                d.getNotes(),
                code,
                STATUS_LABELS.getOrDefault(code, code),
                next(d),
                d.getCreatedAt());
    }
}
