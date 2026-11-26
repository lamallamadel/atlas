package com.example.backend.mandate;

import static com.example.backend.entity.MandateRequestEntity.MREQ_DIRECT;
import static com.example.backend.entity.MandateRequestEntity.MREQ_OPEN;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.MandateEntity;
import com.example.backend.entity.MandateInvitationEntity;
import com.example.backend.entity.MandateProposalEntity;
import com.example.backend.entity.MandateRequestEntity;
import com.example.backend.entity.MarketplaceMessageEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.mandate.MarketplaceViews.AgencyProposal;
import com.example.backend.mandate.MarketplaceViews.AgencyRequest;
import com.example.backend.mandate.MarketplaceViews.Mandate;
import com.example.backend.mandate.MarketplaceViews.Owner;
import com.example.backend.mandate.MarketplaceViews.OwnerProposal;
import com.example.backend.mandate.MarketplaceViews.OwnerRequest;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.MandateProposalRepository;
import com.example.backend.repository.MandateRepository;
import com.example.backend.repository.MandateRequestRepository;
import com.example.backend.repository.MarketplaceMessageRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.PropertyRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Construit les vues de la bourse ; décide de ce que chaque côté a le droit de voir. */
@Component
public class MandateViews {

    /** Délai sans nouvelle alerte de message tant que la précédente n'a pas été lue. */
    static final int ALERT_QUIET_MINUTES = 30;

    private final MandateRequestRepository requests;
    private final MandateProposalRepository proposals;
    private final MarketplaceMessageRepository messages;
    private final MandateRepository mandates;
    private final PropertyRepository properties;
    private final OrganizationRepository organizations;
    private final AnnonceRepository annonces;
    private final AgencyDirectoryService agencies;
    private final MarketplaceSettings settings;
    private final OrgScope orgScope;
    private final MandateMatchingService matching;
    private final com.example.backend.repository.MandateInvitationRepository invitations;

    public MandateViews(
            MandateRequestRepository requests,
            MandateProposalRepository proposals,
            MarketplaceMessageRepository messages,
            MandateRepository mandates,
            PropertyRepository properties,
            OrganizationRepository organizations,
            AnnonceRepository annonces,
            AgencyDirectoryService agencies,
            MarketplaceSettings settings,
            OrgScope orgScope,
            MandateMatchingService matching,
            com.example.backend.repository.MandateInvitationRepository invitations) {
        this.matching = matching;
        this.invitations = invitations;
        this.requests = requests;
        this.proposals = proposals;
        this.messages = messages;
        this.mandates = mandates;
        this.properties = properties;
        this.organizations = organizations;
        this.annonces = annonces;
        this.agencies = agencies;
        this.settings = settings;
        this.orgScope = orgScope;
    }

    // ---------------------------------------------------------------- propriétaire

    public OwnerRequest ownerRequest(MandateRequestEntity r) {
        List<MandateProposalEntity> list = proposals.findByRequestIdOrderByCreatedAtAsc(r.getId());
        Map<String, String> names =
                agencies.names(
                        new java.util.LinkedHashSet<>(
                                java.util.stream.Stream.concat(
                                                list.stream()
                                                        .map(MandateProposalEntity::getAgencyOrgId),
                                                r.getTargetAgencyOrgId() == null
                                                        ? java.util.stream.Stream.empty()
                                                        : java.util.stream.Stream.of(
                                                                r.getTargetAgencyOrgId()))
                                        .toList()));
        PropertyEntity property = properties.findById(r.getPropertyId()).orElse(null);
        List<OwnerProposal> proposalViews =
                list.stream()
                        .filter(p -> !MandateProposalEntity.MPROP_WITHDRAWN.equals(p.getStatus()))
                        .map(
                                p ->
                                        new OwnerProposal(
                                                p.getId(),
                                                p.getAgencyOrgId(),
                                                names.get(p.getAgencyOrgId()),
                                                p.getAgentName(),
                                                p.getMandateType(),
                                                p.getDurationMonths(),
                                                p.getCommissionKind(),
                                                p.getCommissionValue(),
                                                p.getCommissionPayer(),
                                                AgencyDirectoryService.split(p.getServices()),
                                                p.getEstimateMin(),
                                                p.getEstimateMax(),
                                                p.getMessage(),
                                                p.getStatus(),
                                                unread(
                                                        p.getId(),
                                                        MarketplaceMessageEntity.AGENCY,
                                                        p.getOwnerLastReadAt()),
                                                p.getCreatedAt(),
                                                agencies.rating(p.getAgencyOrgId()).average(),
                                                agencies.rating(p.getAgencyOrgId()).count()))
                        .toList();
        List<Mandate> mandateViews =
                list.stream()
                        .map(p -> mandates.findByProposalId(p.getId()).orElse(null))
                        .filter(java.util.Objects::nonNull)
                        .map(m -> mandate(m, false))
                        .toList();
        return new OwnerRequest(
                r.getId(),
                r.getPropertyId(),
                property != null ? property.getTitle() : null,
                r.getVisibility(),
                r.getTargetAgencyOrgId(),
                r.getTargetAgencyOrgId() == null ? null : names.get(r.getTargetAgencyOrgId()),
                r.getObjective(),
                r.getCity(),
                r.getDistrict(),
                r.getExpectedPrice(),
                r.getDeadline(),
                AgencyDirectoryService.split(r.getMandateTypes()),
                AgencyDirectoryService.split(r.getServices()),
                r.getCommissionNote(),
                r.getAvailability(),
                r.getLanguages(),
                r.getMessage(),
                r.getStatus(),
                r.getMaxProposals(),
                r.getOpenedAt(),
                r.getExpiresAt(),
                canOpenToMarket(r),
                proposalViews,
                mandateViews);
    }

    /** Demande directe : déclinée, ou sans proposition de l'agence après le délai de réponse. */
    public boolean canOpenToMarket(MandateRequestEntity r) {
        if (!MREQ_DIRECT.equals(r.getVisibility()) || !MREQ_OPEN.equals(r.getStatus())) {
            return false;
        }
        if (r.getTargetDeclinedAt() != null) {
            return true;
        }
        boolean answered =
                proposals
                        .findByRequestIdAndAgencyOrgId(r.getId(), r.getTargetAgencyOrgId())
                        .isPresent();
        return !answered
                && r.getOpenedAt()
                        .plusHours(settings.directResponseHours())
                        .isBefore(LocalDateTime.now());
    }

    // ---------------------------------------------------------------- agence

    public AgencyRequest agencyRequest(MandateRequestEntity r, String agency) {
        PropertyEntity property = properties.findById(r.getPropertyId()).orElse(null);
        String ownerName =
                organizations
                        .findByOrgId(r.getOwnerOrgId())
                        .map(OrganizationEntity::getDisplayName)
                        .orElse("Propriétaire");
        AgencyProposal mine =
                proposals
                        .findByRequestIdAndAgencyOrgId(r.getId(), agency)
                        .map(this::agencyProposal)
                        .orElse(null);
        String reason = cannotPropose(r, agency);
        MandateMatchingService.Score score = matching.score(r, agency);
        boolean invited =
                invitations
                        .findByRequestIdAndAgencyOrgId(r.getId(), agency)
                        .map(i -> MandateInvitationEntity.INVITED.equals(i.getKind()))
                        .orElse(false);
        boolean ownerVerified =
                organizations
                        .findByOrgId(r.getOwnerOrgId())
                        .map(OrganizationEntity::isVerified)
                        .orElse(false);
        boolean propertyVerified =
                property != null
                        && PropertyEntity.VERIFICATION_VERIFIED.equals(
                                property.getVerificationStatus());
        return new AgencyRequest(
                r.getId(),
                agency.equals(r.getTargetAgencyOrgId()),
                r.getObjective(),
                property != null ? property.getPropertyType() : null,
                r.getCity(),
                r.getDistrict(),
                property != null ? property.getSurface() : null,
                property != null ? property.getRooms() : null,
                r.getExpectedPrice(),
                r.getDeadline(),
                AgencyDirectoryService.split(r.getMandateTypes()),
                AgencyDirectoryService.split(r.getServices()),
                r.getCommissionNote(),
                r.getAvailability(),
                r.getLanguages(),
                // Message libre : coordonnées masquées comme dans la messagerie (R-PROP-08).
                ContactMasker.mask(r.getMessage()),
                ownerName,
                r.getStatus(),
                r.getOpenedAt(),
                r.getExpiresAt(),
                reason == null,
                reason,
                mine,
                score.total(),
                score.eligible()
                        ? score.compatibleBuyers()
                        : matching.compatibleBuyers(agency, r, property),
                invited,
                ownerVerified,
                propertyVerified);
    }

    /** {@code null} si l'agence peut proposer, sinon la raison (R-PROP-07, R-PROP-11). */
    public String cannotPropose(MandateRequestEntity r, String agency) {
        if (!MREQ_OPEN.equals(r.getStatus())
                || (r.getExpiresAt() != null && r.getExpiresAt().isBefore(LocalDateTime.now()))) {
            return "REQUEST_CLOSED: cette demande n'accepte plus de proposition.";
        }
        if (proposals.findByRequestIdAndAgencyOrgId(r.getId(), agency).isPresent()) {
            return "ALREADY_PROPOSED: votre agence a déjà fait une proposition sur cette demande.";
        }
        boolean target = agency.equals(r.getTargetAgencyOrgId());
        if (MREQ_DIRECT.equals(r.getVisibility()) && !target) {
            return "NOT_DIRECT: cette demande est adressée à une autre agence.";
        }
        if (!target) {
            long others =
                    proposals.findByRequestIdOrderByCreatedAtAsc(r.getId()).stream()
                            .filter(p -> !p.getAgencyOrgId().equals(r.getTargetAgencyOrgId()))
                            .count();
            if (others >= r.getMaxProposals()) {
                return "REQUEST_FULL: cette demande a déjà reçu "
                        + r.getMaxProposals()
                        + " propositions.";
            }
        }
        if (matching.remainingQuota(agency) <= 0) {
            return "QUOTA_REACHED: votre agence a utilisé ses "
                    + matching.monthlyQuota(agency)
                    + " propositions du mois prévues par son offre.";
        }
        return null;
    }

    public AgencyProposal agencyProposal(MandateProposalEntity p) {
        MandateRequestEntity r = requests.findById(p.getRequestId()).orElseThrow();
        return new AgencyProposal(
                p.getId(),
                r.getId(),
                r.getCity(),
                r.getDistrict(),
                r.getObjective(),
                p.getAgentName(),
                p.getMandateType(),
                p.getDurationMonths(),
                p.getCommissionKind(),
                p.getCommissionValue(),
                p.getCommissionPayer(),
                AgencyDirectoryService.split(p.getServices()),
                p.getEstimateMin(),
                p.getEstimateMax(),
                p.getMessage(),
                p.getStatus(),
                unread(p.getId(), MarketplaceMessageEntity.OWNER, p.getAgencyLastReadAt()),
                mandates.findByProposalId(p.getId()).map(MandateEntity::getId).orElse(null),
                p.getCreatedAt());
    }

    // ---------------------------------------------------------------- mandat

    /**
     * {@code forAgency} : vue de l'agence mandatée, avec les coordonnées du propriétaire et
     * l'adresse du bien tant que le mandat est en attente de signature ou actif (R-PROP-02).
     */
    public Mandate mandate(MandateEntity m, boolean forAgency) {
        Owner owner = null;
        if (forAgency && MandateMarketplaceService.LIVE_MANDATE.contains(m.getStatus())) {
            OrganizationEntity org = organizations.findByOrgId(m.getOwnerOrgId()).orElse(null);
            PropertyEntity p = properties.findById(m.getPropertyId()).orElse(null);
            owner =
                    new Owner(
                            org != null ? org.getDisplayName() : null,
                            org != null ? org.getOwnerPhone() : null,
                            p != null ? p.getTitle() : null,
                            p != null ? p.getPropertyType() : null,
                            p != null ? p.getCity() : null,
                            p != null ? p.getDistrict() : null,
                            p != null ? p.getAddress() : null,
                            p != null ? p.getLandTitleNumber() : null,
                            p != null ? p.getSurface() : null,
                            p != null ? p.getRooms() : null,
                            p != null ? p.getExpectedPrice() : null);
        }
        Long annonceId =
                orgScope.unfiltered(
                        () ->
                                annonces.findFirstByMandateIdOrderByIdAsc(m.getId())
                                        .map(Annonce::getId)
                                        .orElse(null));
        return new Mandate(
                m.getId(),
                m.getPropertyId(),
                m.getAgencyOrgId(),
                agencies.agencyName(m.getAgencyOrgId()),
                m.getMandateType(),
                m.getDurationMonths(),
                m.getCommissionKind(),
                m.getCommissionValue(),
                m.getCommissionPayer(),
                m.getStatus(),
                m.getStartsAt(),
                m.getEndsAt(),
                m.getSignedAt(),
                forAgency ? m.getDossierId() : null,
                annonceId,
                owner,
                m.getEndReason(),
                m.getEndedBy(),
                m.getEndedAt());
    }

    // ---------------------------------------------------------------- utilitaires

    private long unread(Long proposalId, String fromSide, LocalDateTime readAt) {
        return readAt == null
                ? messages.countByProposalIdAndAuthorSide(proposalId, fromSide)
                : messages.countByProposalIdAndAuthorSideAndCreatedAtAfter(
                        proposalId, fromSide, readAt);
    }

    static boolean shouldAlert(LocalDateTime alertedAt, LocalDateTime readAt) {
        if (alertedAt == null) {
            return true;
        }
        if (readAt != null && readAt.isAfter(alertedAt)) {
            return true;
        }
        return alertedAt.isBefore(LocalDateTime.now().minusMinutes(ALERT_QUIET_MINUTES));
    }
}
