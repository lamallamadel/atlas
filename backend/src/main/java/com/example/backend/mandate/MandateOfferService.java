package com.example.backend.mandate;

import com.example.backend.entity.ActivityEntity;
import com.example.backend.entity.MandateEntity;
import com.example.backend.entity.MandateOfferEntity;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ActivityVisibility;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MandateOfferRepository;
import com.example.backend.util.CurrentUser;
import com.example.backend.workflow.DossierWorkflowCatalog;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Offres sur un bien sous mandat (UC-P8) : l'agence mandatée transmet l'offre d'un acquéreur, le
 * propriétaire l'accepte, la refuse ou fait une contre-proposition depuis son espace. La décision
 * est tracée dans le dossier de l'agence et fait avancer son workflow (offre reçue, négociation).
 * L'acquéreur reste anonyme pour le propriétaire (R-PROP-12) : un profil court, sans coordonnées.
 */
@Service
public class MandateOfferService {

    public static final String ACCEPT = "ACCEPT";
    public static final String REFUSE = "REFUSE";
    public static final String COUNTER = "COUNTER";

    private final MandateLifecycleService lifecycle;
    private final MandateMarketplaceService marketplace;
    private final MandateOfferRepository offers;
    private final DossierRepository dossiers;
    private final ActivityRepository activities;
    private final OrgScope orgScope;

    public MandateOfferService(
            MandateLifecycleService lifecycle,
            MandateMarketplaceService marketplace,
            MandateOfferRepository offers,
            DossierRepository dossiers,
            ActivityRepository activities,
            OrgScope orgScope) {
        this.lifecycle = lifecycle;
        this.marketplace = marketplace;
        this.offers = offers;
        this.dossiers = dossiers;
        this.activities = activities;
        this.orgScope = orgScope;
    }

    public record OfferRequest(
            BigDecimal amount, String buyerSummary, String conditions, LocalDate validUntil) {}

    public record DecisionRequest(String decision, BigDecimal counterAmount, String comment) {}

    // ---------------------------------------------------------------- agence

    @Transactional(readOnly = true)
    public List<MarketplaceViews.Offer> agencyOffers(Long mandateId) {
        return list(lifecycle.agencyMandateEntity(mandateId).getId());
    }

    /** L'agence transmet une offre ; le propriétaire est alerté. Mandat signé et actif requis. */
    @Transactional
    public List<MarketplaceViews.Offer> submit(Long mandateId, OfferRequest in) {
        MandateEntity m = lifecycle.agencyMandateEntity(mandateId);
        if (!MandateEntity.MANDATE_ACTIVE.equals(m.getStatus())) {
            throw MandateMarketplaceService.conflict(
                    "MANDATE_NOT_ACTIVE: une offre se transmet sur un mandat signé et en cours.");
        }
        if (in == null || in.amount() == null || in.amount().signum() <= 0) {
            throw MandateMarketplaceService.bad("AMOUNT_REQUIRED: indiquez le montant de l'offre.");
        }
        if (in.validUntil() != null && in.validUntil().isBefore(LocalDate.now())) {
            throw MandateMarketplaceService.bad("VALID_UNTIL_PAST: la date de validité est passée.");
        }
        LocalDateTime now = LocalDateTime.now();
        MandateOfferEntity o = new MandateOfferEntity();
        o.setMandateId(m.getId());
        o.setOwnerOrgId(m.getOwnerOrgId());
        o.setAgencyOrgId(m.getAgencyOrgId());
        o.setAmount(in.amount().setScale(2, RoundingMode.HALF_UP));
        o.setCurrency("MAD");
        o.setBuyerSummary(clean(in.buyerSummary(), 255));
        o.setConditions(clean(in.conditions(), 1000));
        o.setValidUntil(in.validUntil());
        o.setStatus(MandateOfferEntity.OFFER_PENDING);
        o.setCreatedBy(CurrentUser.id().orElse(null));
        o.setCreatedAt(now);
        o.setUpdatedAt(now);
        offers.save(o);
        lifecycle.moveDossier(m, DossierWorkflowCatalog.OFFER_RECEIVED);
        logInDossier(m, "Offre de " + mad(o.getAmount()) + " transmise au propriétaire.");
        lifecycle.alertOwner(
                m,
                "Nouvelle offre de "
                        + mad(o.getAmount())
                        + " sur votre bien : acceptez, refusez ou faites une contre-proposition.");
        return list(m.getId());
    }

    /** L'acquéreur retire son offre (ou l'agence l'annule) tant qu'elle n'est pas refusée. */
    @Transactional
    public List<MarketplaceViews.Offer> withdraw(Long mandateId, Long offerId) {
        MandateEntity m = lifecycle.agencyMandateEntity(mandateId);
        MandateOfferEntity o = offer(m, offerId);
        if (!MandateOfferEntity.isWithdrawable(o.getStatus())) {
            throw MandateMarketplaceService.conflict("OFFER_CLOSED: cette offre est déjà close.");
        }
        o.setStatus(MandateOfferEntity.OFFER_WITHDRAWN);
        o.setUpdatedAt(LocalDateTime.now());
        offers.save(o);
        logInDossier(m, "Offre de " + mad(o.getAmount()) + " retirée.");
        lifecycle.alertOwner(m, "L'offre de " + mad(o.getAmount()) + " a été retirée.");
        return list(m.getId());
    }

    // ---------------------------------------------------------------- propriétaire

    /** Décision du propriétaire, tracée dans le dossier de l'agence ; l'agent est prévenu. */
    @Transactional
    public MarketplaceViews.MandateFollowUp decide(
            Long mandateId, Long offerId, DecisionRequest in) {
        MandateEntity m = lifecycle.ownerMandateEntity(mandateId);
        if (!MandateEntity.MANDATE_ACTIVE.equals(m.getStatus())) {
            throw MandateMarketplaceService.conflict("MANDATE_ENDED: ce mandat n'est plus en cours.");
        }
        MandateOfferEntity o = offer(m, offerId);
        if (!MandateOfferEntity.OFFER_PENDING.equals(o.getStatus())) {
            throw MandateMarketplaceService.conflict("OFFER_CLOSED: vous avez déjà répondu à cette offre.");
        }
        String decision = in == null || in.decision() == null ? "" : in.decision();
        String comment = in == null ? null : clean(in.comment(), 1000);
        String line;
        switch (decision) {
            case ACCEPT -> {
                if (offers.existsByMandateIdAndStatus(
                        m.getId(), MandateOfferEntity.OFFER_ACCEPTED)) {
                    throw MandateMarketplaceService.conflict(
                            "OFFER_ALREADY_ACCEPTED: vous avez déjà accepté une offre ; l'agence"
                                    + " doit la retirer avant que vous en acceptiez une autre.");
                }
                o.setStatus(MandateOfferEntity.OFFER_ACCEPTED);
                line = "Le propriétaire accepte l'offre de " + mad(o.getAmount()) + ".";
            }
            case REFUSE -> {
                o.setStatus(MandateOfferEntity.OFFER_REFUSED);
                line = "Le propriétaire refuse l'offre de " + mad(o.getAmount()) + ".";
            }
            case COUNTER -> {
                BigDecimal counter = in.counterAmount();
                if (counter == null || counter.signum() <= 0) {
                    throw MandateMarketplaceService.bad("COUNTER_REQUIRED: indiquez le prix de votre contre-proposition.");
                }
                if (counter.compareTo(o.getAmount()) <= 0) {
                    throw MandateMarketplaceService.bad(
                            "COUNTER_TOO_LOW: la contre-proposition doit dépasser l'offre ;"
                                    + " sinon, acceptez-la.");
                }
                o.setStatus(MandateOfferEntity.OFFER_COUNTERED);
                o.setCounterAmount(counter.setScale(2, RoundingMode.HALF_UP));
                lifecycle.moveDossier(m, DossierWorkflowCatalog.NEGOTIATION);
                line =
                        "Le propriétaire répond à l'offre de "
                                + mad(o.getAmount())
                                + " par une contre-proposition à "
                                + mad(o.getCounterAmount())
                                + ".";
            }
            default -> throw MandateMarketplaceService.bad("DECISION_INVALID: accepter, refuser ou contre-proposer.");
        }
        LocalDateTime now = LocalDateTime.now();
        o.setOwnerComment(comment);
        o.setDecidedAt(now);
        o.setUpdatedAt(now);
        offers.save(o);
        logInDossier(m, comment == null ? line : line + "\nCommentaire : " + comment);
        marketplace.notifyAgency(
                m.getAgencyOrgId(),
                m.getAgentUserId(),
                "Réponse du propriétaire à une offre",
                line,
                m.getDossierId() != null ? "/pro/dossiers/" + m.getDossierId() : "/pro/mandats");
        return lifecycle.followUp(m);
    }

    // ---------------------------------------------------------------- commun

    @Transactional(readOnly = true)
    public List<MarketplaceViews.Offer> list(Long mandateId) {
        return offers.findByMandateIdOrderByCreatedAtDesc(mandateId).stream()
                .map(MandateOfferService::view)
                .toList();
    }

    static MarketplaceViews.Offer view(MandateOfferEntity o) {
        return new MarketplaceViews.Offer(
                o.getId(),
                o.getAmount(),
                o.getCurrency(),
                o.getBuyerSummary(),
                o.getConditions(),
                o.getValidUntil(),
                o.getStatus(),
                o.getCounterAmount(),
                o.getOwnerComment(),
                o.getCreatedAt(),
                o.getDecidedAt());
    }

    private MandateOfferEntity offer(MandateEntity m, Long offerId) {
        return offers.findById(offerId)
                .filter(o -> m.getId().equals(o.getMandateId()))
                .orElseThrow(() -> MandateMarketplaceService.notFound("Offre introuvable"));
    }

    /** Trace interne au dossier de l'agence (l'offre a sa propre vue chez le propriétaire). */
    private void logInDossier(MandateEntity m, String content) {
        if (m.getDossierId() == null) {
            return;
        }
        orgScope.run(
                m.getAgencyOrgId(),
                () ->
                        dossiers.findById(m.getDossierId())
                                .ifPresent(
                                        d -> {
                                            ActivityEntity a = new ActivityEntity();
                                            a.setOrgId(m.getAgencyOrgId());
                                            a.setDossier(d);
                                            a.setType(ActivityType.NOTE);
                                            a.setContent(content);
                                            a.setVisibility(ActivityVisibility.INTERNAL);
                                            activities.save(a); // dates : BaseEntity
                                        }));
    }

    /** Pas de coordonnées de l'acquéreur chez le propriétaire (R-PROP-12). */
    private static String clean(String s, int max) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String masked = ContactMasker.mask(s.strip());
        return masked.length() > max ? masked.substring(0, max) : masked;
    }

    static String mad(BigDecimal amount) {
        NumberFormat f = NumberFormat.getIntegerInstance(Locale.FRANCE);
        return f.format(amount.setScale(0, RoundingMode.HALF_UP)).replace(' ', ' ') + " MAD";
    }
}
