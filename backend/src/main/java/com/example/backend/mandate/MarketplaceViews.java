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
            LocalDateTime createdAt,
            Double agencyRating,
            int agencyReviews) {}

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
            AgencyProposal myProposal,
            int relevance,
            int compatibleBuyers,
            boolean invited,
            boolean ownerVerified,
            boolean propertyVerified) {}

    /** Agence recommandée au propriétaire (§ 5.1, top 5), sans le détail du score. */
    public record RecommendedAgency(
            String orgId,
            String name,
            String description,
            List<String> districts,
            Double rating,
            int reviews,
            boolean invited,
            boolean proposed) {}

    /** Événement du dossier de l'agence marqué « visible par le client » (R-PROP-12). */
    public record VisibleEvent(Long id, String type, String content, LocalDateTime createdAt) {}

    /** Annonce de l'agence pour le bien, et contacts reçus. */
    public record AgencyListing(Long annonceId, String title, String status, long contacts) {}

    public record Review(Integer rating, String comment, LocalDateTime createdAt) {}

    /** Offre d'un acquéreur (anonyme) transmise par l'agence, et la réponse du propriétaire. */
    public record Offer(
            Long id,
            BigDecimal amount,
            String currency,
            String buyerSummary,
            String conditions,
            java.time.LocalDate validUntil,
            String status,
            BigDecimal counterAmount,
            String ownerComment,
            LocalDateTime createdAt,
            LocalDateTime decidedAt) {}

    /** Suivi d'un mandat par le propriétaire (UC-P8, UC-P9). */
    public record MandateFollowUp(
            Mandate mandate,
            Long requestId,
            Long proposalId,
            String propertyTitle,
            List<AgencyListing> listings,
            List<VisibleEvent> events,
            List<Offer> offers,
            boolean canEnd,
            List<String> endReasons,
            boolean canReview,
            Review review) {}

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
            Owner owner,
            String endReason,
            String endedBy,
            LocalDateTime endedAt) {}

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
