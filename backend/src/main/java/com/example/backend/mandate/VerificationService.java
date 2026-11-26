package com.example.backend.mandate;

import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.owner.OwnerContext;
import com.example.backend.owner.PhoneNumbers;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.PropertyRepository;
import com.example.backend.service.AuditEventService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Badges de confiance (spec 13 § 7, lot C) : « Bien vérifié » (titre foncier déclaré, contrôlé à la
 * main) et « Propriétaire vérifié » (pièce d'identité contrôlée par l'équipe, jamais conservée).
 */
@Service
public class VerificationService {

    private final OwnerContext ownerContext;
    private final PropertyRepository properties;
    private final OrganizationRepository organizations;
    private final OrgScope orgScope;
    private final AuditEventService audit;

    public VerificationService(
            OwnerContext ownerContext,
            PropertyRepository properties,
            OrganizationRepository organizations,
            OrgScope orgScope,
            AuditEventService audit) {
        this.ownerContext = ownerContext;
        this.properties = properties;
        this.organizations = organizations;
        this.orgScope = orgScope;
        this.audit = audit;
    }

    public record PendingProperty(
            Long id,
            String title,
            String city,
            String district,
            String landTitleNumber,
            String ownerOrgId,
            String ownerName,
            String ownerPhone,
            boolean ownerVerified,
            LocalDateTime requestedAt) {}

    /**
     * Le propriétaire demande le badge « Bien vérifié » : un numéro de titre foncier est requis.
     */
    @Transactional
    public String requestPropertyVerification(Long propertyId) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        PropertyEntity p =
                properties
                        .findById(propertyId)
                        .filter(x -> orgId.equals(x.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Bien introuvable"));
        if (p.getLandTitleNumber() == null || p.getLandTitleNumber().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "LAND_TITLE_REQUIRED: indiquez le numéro du titre foncier du bien.");
        }
        if (!PropertyEntity.VERIFICATION_VERIFIED.equals(p.getVerificationStatus())) {
            p.setVerificationStatus(PropertyEntity.VERIFICATION_PENDING);
            p.setUpdatedAt(LocalDateTime.now());
            properties.save(p);
        }
        return p.getVerificationStatus();
    }

    @Transactional(readOnly = true)
    public List<PendingProperty> pendingProperties() {
        return orgScope.unfiltered(
                () ->
                        properties
                                .findByVerificationStatusOrderByUpdatedAtAsc(
                                        PropertyEntity.VERIFICATION_PENDING)
                                .stream()
                                .map(
                                        p -> {
                                            OrganizationEntity o =
                                                    organizations
                                                            .findByOrgId(p.getOrgId())
                                                            .orElse(null);
                                            return new PendingProperty(
                                                    p.getId(),
                                                    p.getTitle(),
                                                    p.getCity(),
                                                    p.getDistrict(),
                                                    p.getLandTitleNumber(),
                                                    p.getOrgId(),
                                                    o != null ? o.getDisplayName() : null,
                                                    o != null && o.getOwnerPhone() != null
                                                            ? PhoneNumbers.mask(o.getOwnerPhone())
                                                            : null,
                                                    o != null && o.isVerified(),
                                                    p.getUpdatedAt());
                                        })
                                .toList());
    }

    /** Décision de la plateforme sur le titre foncier déclaré. */
    @Transactional
    public void decideProperty(Long propertyId, boolean verified) {
        PropertyEntity p =
                properties
                        .findById(propertyId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Bien introuvable"));
        p.setVerificationStatus(
                verified
                        ? PropertyEntity.VERIFICATION_VERIFIED
                        : PropertyEntity.VERIFICATION_REJECTED);
        p.setUpdatedAt(LocalDateTime.now());
        properties.save(p);
        orgScope.run(
                p.getOrgId(),
                () ->
                        audit.logEvent(
                                "ORGANIZATION",
                                organizations
                                        .findByOrgId(p.getOrgId())
                                        .map(OrganizationEntity::getId)
                                        .orElse(null),
                                verified ? "APPROVED" : "REJECTED",
                                "Titre foncier du bien n°"
                                        + p.getId()
                                        + (verified ? " vérifié" : " refusé")));
    }

    /** Badge « Propriétaire vérifié » après contrôle de la pièce d'identité (non conservée). */
    @Transactional
    public void setOwnerVerified(String orgId, boolean verified) {
        OrganizationEntity o =
                organizations
                        .findByOrgId(orgId)
                        .filter(OrganizationEntity::isOwner)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Propriétaire introuvable"));
        o.setVerified(verified);
        organizations.save(o);
    }
}
