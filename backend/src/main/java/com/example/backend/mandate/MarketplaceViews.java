package com.example.backend.mandate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Vues de la bourse aux mandats, côté propriétaire et côté agence (cas d'usage n°1, lot B). */
public final class MarketplaceViews {

    private MarketplaceViews() {}

    public record RequestCreate(
            Long propertyId,
            String visibility,
            String targetAgencyOrgId,
            BigDecimal expectedPrice,
            String deadline,
            List<String> mandateTypes,
            List<String> services,
            String commissionNote,
            String availability,
            String languages,
            String message) {}

    public record ProposalCreate(
            String mandateType,
            Integer durationMonths,
            String commissionKind,
            BigDecimal commissionValue,
            String commissionPayer,
            List<String> services,
            BigDecimal estimateMin,
            BigDecimal estimateMax,
            String message) {}

    /** Proposition telle que le propriétaire la compare. */
    public record OwnerProposal(
            Long id,
            String agencyOrgId,
            String agencyName,
            String agentName,
            String mandateType,
            Integer durationMonths,
            String commissionKind,
            BigDecimal commissionValue,
            String commissionPayer,
            List<String> services,
            BigDecimal estimateMin,
            BigDecimal estimateMax,
            String message,
            String status,
            long unread,
            LocalDateTime createdAt) {}

    public record OwnerRequest(
            Long id,
            Long propertyId,
            String propertyTitle,
            String visibility,
            String targetAgencyOrgId,
            String targetAgencyName,
            String objective,
            String city,
            String district,
            BigDecimal expectedPrice,
            String deadline,
            List<String> mandateTypes,
            List<String> services,
            String commissionNote,
            String availability,
            String languages,
            String message,
            String status,
            int maxProposals,
            LocalDateTime openedAt,
            LocalDateTime expiresAt,
            boolean canOpenToMarket,
            List<OwnerProposal> proposals,
            List<Mandate> mandates) {}

    /** Demande vue par une agence : anonymisée (ni adresse, ni téléphone, prénom et initiale). */
    public record AgencyRequest(
            Long id,
            boolean direct,
            String objective,
            String propertyType,
            String city,
            String district,
            Double surface,
            Integer rooms,
            BigDecimal expectedPrice,
            String deadline,
            List<String> mandateTypes,
            List<String> services,
            String commissionNote,
            String availability,
            String languages,
            String message,
            String ownerName,
            String status,
            LocalDateTime openedAt,
            LocalDateTime expiresAt,
            boolean canPropose,
            String cannotProposeReason,
            AgencyProposal myProposal) {}

    public record AgencyProposal(
            Long id,
            Long requestId,
            String city,
            String district,
            String objective,
            String agentName,
            String mandateType,
            Integer durationMonths,
            String commissionKind,
            BigDecimal commissionValue,
            String commissionPayer,
            List<String> services,
            BigDecimal estimateMin,
            BigDecimal estimateMax,
            String message,
            String status,
            long unread,
            Long mandateId,
            LocalDateTime createdAt) {}

    /**
     * Mandat. Les coordonnées du propriétaire et l'adresse du bien ne sont remplies que pour
     * l'agence mandatée, tant que le mandat est en attente de signature ou actif (R-PROP-02).
     */
    public record Mandate(
            Long id,
            Long propertyId,
            String agencyOrgId,
            String agencyName,
            String mandateType,
            Integer durationMonths,
            String commissionKind,
            BigDecimal commissionValue,
            String commissionPayer,
            String status,
            LocalDateTime startsAt,
            LocalDateTime endsAt,
            LocalDateTime signedAt,
            Long dossierId,
            Long annonceId,
            Owner owner) {}

    public record Owner(
            String name,
            String phone,
            String propertyTitle,
            String propertyType,
            String city,
            String district,
            String address,
            String landTitleNumber,
            Double surface,
            Integer rooms,
            BigDecimal expectedPrice) {}

    public record ThreadMessage(
            Long id, String side, String authorName, String body, LocalDateTime createdAt) {}

    /** {@code masked} : coordonnées masquées tant que la proposition n'est pas acceptée. */
    public record Thread(
            Long proposalId, boolean masked, boolean closed, List<ThreadMessage> messages) {}
}
