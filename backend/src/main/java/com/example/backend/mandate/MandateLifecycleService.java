package com.example.backend.mandate;

import static com.example.backend.entity.MandateProposalEntity.MPROP_ACCEPTED;
import static com.example.backend.entity.MandateProposalEntity.MPROP_DECLINED;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.dto.PartiePrenanteRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MandateEntity;
import com.example.backend.entity.MandateProposalEntity;
import com.example.backend.entity.MandateRequestEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.PartiePrenanteRole;
import com.example.backend.event.DossierStatusChangedEvent;
import com.example.backend.event.MandateAnnoncePublishedEvent;
import com.example.backend.mandate.MarketplaceViews.Mandate;
import com.example.backend.owner.OwnerAnnonceService;
import com.example.backend.owner.OwnerContext;
import com.example.backend.owner.PhoneVerificationService;
import com.example.backend.owner.PlatformAlert;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MandateProposalRepository;
import com.example.backend.repository.MandateRepository;
import com.example.backend.repository.MandateRequestRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.PropertyRepository;
import com.example.backend.service.AnnoncePublicationService;
import com.example.backend.service.AnnonceService;
import com.example.backend.service.AuditEventService;
import com.example.backend.service.DossierService;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * Du « oui » du propriétaire au mandat (UC-P7) : acceptation confirmée par code (R-PROP-09),
 * mandat, dossier {@code CRM_MANDATE_*} dans l'agence, coordonnées révélées à cette seule agence,
 * suspension de l'annonce du propriétaire en exclusif (R-PROP-05). Puis le cycle du mandat :
 * signature, annonce de l'agence liée au bien, échéances.
 */
@Service
public class MandateLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(MandateLifecycleService.class);

    public static final String PURPOSE_ACCEPT = "MANDATE_ACCEPT";
    public static final String MANDATE_SIGNED = "CRM_MANDATE_SIGNED";
    public static final String MANDATE_PENDING = "CRM_MANDATE_PENDING";
    public static final String LISTED = "CRM_LISTED";
    public static final String PUBLISHER_AGENCY = "AGENCY";
    public static final String SUSPEND_EXCLUSIVE = "MANDATE_EXCLUSIVE";
    public static final String SUSPEND_MANDATE_ENDED = "MANDATE_ENDED";

    private final MandateMarketplaceService marketplace;
    private final MandateViews views;
    private final OwnerContext ownerContext;
    private final PhoneVerificationService phoneVerification;
    private final MandateRequestRepository requests;
    private final MandateProposalRepository proposals;
    private final MandateRepository mandates;
    private final PropertyRepository properties;
    private final OrganizationRepository organizations;
    private final AnnonceRepository annonces;
    private final AnnonceService annonceService;
    private final DossierRepository dossiers;
    private final DossierService dossierService;
    private final AuditEventService audit;
    private final AgencyDirectoryService agencies;
    private final MarketplaceSettings settings;
    private final OrgScope orgScope;
    private final ApplicationEventPublisher events;
    private final String publicBaseUrl;
    private final TransactionTemplate transactions;
    private com.example.backend.repository.ActivityRepository activities;
    private com.example.backend.repository.AgencyReviewRepository reviews;
    private com.example.backend.repository.MandateOfferRepository offers;

    /** Lot C : suivi (événements visibles, offres) et avis. */
    @org.springframework.beans.factory.annotation.Autowired
    void setFollowUpRepositories(
            com.example.backend.repository.ActivityRepository activities,
            com.example.backend.repository.AgencyReviewRepository reviews,
            com.example.backend.repository.MandateOfferRepository offers) {
        this.activities = activities;
        this.reviews = reviews;
        this.offers = offers;
    }

    public MandateLifecycleService(
            MandateMarketplaceService marketplace,
            MandateViews views,
            OwnerContext ownerContext,
            PhoneVerificationService phoneVerification,
            MandateRequestRepository requests,
            MandateProposalRepository proposals,
            MandateRepository mandates,
            PropertyRepository properties,
            OrganizationRepository organizations,
            AnnonceRepository annonces,
            AnnonceService annonceService,
            DossierRepository dossiers,
            DossierService dossierService,
            AuditEventService audit,
            AgencyDirectoryService agencies,
            MarketplaceSettings settings,
            OrgScope orgScope,
            ApplicationEventPublisher events,
            PlatformTransactionManager transactionManager,
            @Value("${atlas.consent.public-base-url:http://localhost:4200}") String publicBaseUrl) {
        this.transactions = new TransactionTemplate(transactionManager);
        this.marketplace = marketplace;
        this.views = views;
        this.ownerContext = ownerContext;
        this.phoneVerification = phoneVerification;
        this.requests = requests;
        this.proposals = proposals;
        this.mandates = mandates;
        this.properties = properties;
        this.organizations = organizations;
        this.annonces = annonces;
        this.annonceService = annonceService;
        this.dossiers = dossiers;
        this.dossierService = dossierService;
        this.audit = audit;
        this.agencies = agencies;
        this.settings = settings;
        this.orgScope = orgScope;
        this.events = events;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    // ---------------------------------------------------------------- acceptation (UC-P7)

    /** Envoie le code qui confirmera l'acceptation au téléphone du propriétaire. */
    public String startAcceptance(Long proposalId, String ipAddress) {
        marketplace.acceptableProposal(proposalId);
        OrganizationEntity owner = ownerContext.requireOwnerOrg();
        return phoneVerification.send(owner.getOwnerPhone(), PURPOSE_ACCEPT, ipAddress);
    }

    /**
     * Vérifie le code (les essais comptent même en cas d'échec), puis crée le mandat et le dossier
     * de l'agence en une seule transaction (PB-4).
     */
    public Mandate accept(Long proposalId, String code) {
        marketplace.acceptableProposal(proposalId);
        OrganizationEntity owner = ownerContext.requireOwnerOrg();
        phoneVerification.verify(owner.getOwnerPhone(), PURPOSE_ACCEPT, code);
        return transactions.execute(
                status -> {
                    MandateProposalEntity p = marketplace.acceptableProposal(proposalId);
                    return views.mandate(create(owner, p), false);
                });
    }

    private MandateEntity create(OrganizationEntity owner, MandateProposalEntity p) {
        MandateRequestEntity r = requests.findById(p.getRequestId()).orElseThrow();
        PropertyEntity property = properties.findById(r.getPropertyId()).orElseThrow();
        LocalDateTime now = LocalDateTime.now();

        MandateEntity m = new MandateEntity();
        m.setOwnerOrgId(owner.getOrgId());
        m.setAgencyOrgId(p.getAgencyOrgId());
        m.setPropertyId(property.getId());
        m.setRequestId(r.getId());
        m.setProposalId(p.getId());
        m.setAgentUserId(p.getAgentUserId());
        m.setMandateType(p.getMandateType());
        m.setDurationMonths(p.getDurationMonths());
        m.setCommissionKind(p.getCommissionKind());
        m.setCommissionValue(p.getCommissionValue());
        m.setCommissionPayer(p.getCommissionPayer());
        m.setStatus(MandateEntity.MANDATE_PENDING_SIGNATURE);
        m.setStartsAt(now);
        m.setEndsAt(now.plusMonths(p.getDurationMonths()));
        m.setCreatedAt(now);
        m.setUpdatedAt(now);
        mandates.save(m);

        marketplace.setStatus(p, MPROP_ACCEPTED);
        if (MandateRequestEntity.MREQ_OPEN.equals(r.getStatus())) {
            r.setStatus(MandateRequestEntity.MREQ_AWARDED);
            r.setUpdatedAt(now);
            requests.save(r);
        }
        boolean exclusive = MandateEntity.EXCLUSIVE.equals(p.getMandateType());
        // Exclusif : toutes les autres propositions sont écartées. Simple : seules les
        // propositions exclusives le sont ; les autres propositions simples restent possibles.
        for (MandateProposalEntity other :
                proposals.findByRequestIdOrderByCreatedAtAsc(r.getId())) {
            if (other.getId().equals(p.getId())
                    || !MandateMarketplaceService.ACTIVE_PROPOSAL.contains(other.getStatus())) {
                continue;
            }
            if (exclusive || MandateEntity.EXCLUSIVE.equals(other.getMandateType())) {
                marketplace.setStatus(other, MPROP_DECLINED);
                marketplace.notifyAgency(
                        other.getAgencyOrgId(),
                        other.getAgentUserId(),
                        "Proposition non retenue",
                        "Le propriétaire a confié son bien à "
                                + r.getCity()
                                + " à une autre agence.",
                        "/pro/mandats/propositions/" + other.getId());
            }
        }

        Long dossierId =
                orgScope.as(p.getAgencyOrgId(), () -> createDossier(owner, property, r, p, m));
        m.setDossierId(dossierId);
        mandates.save(m);

        if (exclusive) {
            suspendOwnerAnnonce(owner.getOrgId(), property.getId(), m.getId());
        }

        // Preuve du consentement au partage des coordonnées avec cette agence (R-PROP-09).
        String agencyName = agencies.agencyName(p.getAgencyOrgId());
        orgScope.run(
                owner.getOrgId(),
                () ->
                        audit.logEvent(
                                "ORGANIZATION",
                                owner.getId(),
                                "APPROVED",
                                "Proposition n°"
                                        + p.getId()
                                        + " acceptée par code à usage unique : mandat n°"
                                        + m.getId()
                                        + " ("
                                        + p.getMandateType()
                                        + "), coordonnées et adresse transmises à "
                                        + agencyName));
        marketplace.notifyAgency(
                p.getAgencyOrgId(),
                p.getAgentUserId(),
                "Mandat confié",
                "Le propriétaire a accepté votre proposition à "
                        + r.getCity()
                        + " : ses coordonnées sont dans le dossier.",
                "/pro/dossiers/" + dossierId);
        log.info(
                "Mandat {} créé : bien {}, agence {}, type {}",
                m.getId(),
                property.getId(),
                p.getAgencyOrgId(),
                p.getMandateType());
        return m;
    }

    private Long createDossier(
            OrganizationEntity owner,
            PropertyEntity property,
            MandateRequestEntity r,
            MandateProposalEntity p,
            MandateEntity m) {
        DossierCreateRequest req = new DossierCreateRequest();
        req.setLeadName(owner.getDisplayName());
        req.setLeadPhone(owner.getOwnerPhone());
        req.setLeadSource("BOURSE_MANDATS");
        req.setSource(DossierSource.WEB);
        req.setCaseType("RENT".equals(r.getObjective()) ? "CRM_MANDATE_RENT" : "CRM_MANDATE_SALE");
        req.setStatusCode(MANDATE_PENDING);
        req.setNotes(notes(property, p, m));
        PartiePrenanteRequest party = new PartiePrenanteRequest();
        party.setRole(PartiePrenanteRole.OWNER);
        party.setName(owner.getDisplayName());
        party.setPhone(owner.getOwnerPhone());
        party.setAddress(property.getAddress());
        req.setInitialParty(party);
        DossierResponse created = dossierService.create(req);
        Dossier d = dossiers.findById(created.getId()).orElseThrow();
        d.setAssignedTo(p.getAgentUserId());
        d.setAssignedToName(p.getAgentName());
        d.setAssignedAt(LocalDateTime.now());
        dossiers.save(d);
        audit.logEvent(
                "DOSSIER",
                d.getId(),
                "CREATED",
                "Mandat n°" + m.getId() + " accepté par le propriétaire sur la bourse aux mandats");
        return d.getId();
    }

    private static String notes(PropertyEntity property, MandateProposalEntity p, MandateEntity m) {
        StringBuilder sb = new StringBuilder("[Mandat n°").append(m.getId()).append("]");
        sb.append("\nType : ")
                .append(MandateEntity.EXCLUSIVE.equals(p.getMandateType()) ? "exclusif" : "simple");
        sb.append(", ").append(p.getDurationMonths()).append(" mois");
        sb.append("\nCommission : ")
                .append(p.getCommissionValue().stripTrailingZeros().toPlainString())
                .append("PERCENT".equals(p.getCommissionKind()) ? " %" : " MAD")
                .append(" à la charge de ")
                .append(
                        switch (p.getCommissionPayer()) {
                            case "BUYER" -> "l'acquéreur";
                            case "SHARED" -> "les deux parties";
                            default -> "du propriétaire";
                        });
        sb.append("\nBien : ").append(property.getTitle());
        sb.append("\nAdresse : ")
                .append(property.getAddress() != null ? property.getAddress() : "—");
        sb.append(", ")
                .append(property.getDistrict() != null ? property.getDistrict() + ", " : "")
                .append(property.getCity());
        if (property.getLandTitleNumber() != null) {
            sb.append("\nTitre foncier : ").append(property.getLandTitleNumber());
        }
        if (property.getExpectedPrice() != null) {
            sb.append("\nPrix souhaité : ")
                    .append(property.getExpectedPrice().stripTrailingZeros().toPlainString())
                    .append(" MAD");
        }
        return sb.toString();
    }

    /** R-PROP-05 : l'annonce du propriétaire est suspendue pendant un mandat exclusif. */
    private void suspendOwnerAnnonce(String ownerOrgId, Long propertyId, Long mandateId) {
        orgScope.run(
                ownerOrgId,
                () ->
                        annonces.findFirstByOrgIdAndPropertyId(ownerOrgId, propertyId)
                                .ifPresent(
                                        a -> {
                                            if (AnnonceStatus.normalize(a.getStatus())
                                                    == AnnonceStatus.PUBLISHED) {
                                                annonceService.applyTransition(
                                                        a.getId(),
                                                        AnnoncePublicationService.T_SUSPEND,
                                                        SUSPEND_EXCLUSIVE,
                                                        "Mandat exclusif n°" + mandateId);
                                            } else if (OwnerAnnonceService.MOD_PENDING.equals(
                                                    a.getModerationStatus())) {
                                                a.setModerationStatus(null);
                                                annonces.save(a);
                                            }
                                        }));
    }

    // ---------------------------------------------------------------- cycle du mandat

    @Transactional(readOnly = true)
    public List<Mandate> ownerMandates() {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return mandates.findByOwnerOrgIdOrderByCreatedAtDesc(orgId).stream()
                .map(m -> views.mandate(m, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Mandate> agencyMandates() {
        String agency = marketplace.requireVerifiedAgency();
        return mandates.findByAgencyOrgIdOrderByCreatedAtDesc(agency).stream()
                // « Mes dossiers » : un agent restreint ne voit que les mandats qui lui sont
                // confiés.
                .filter(
                        m ->
                                com.example.backend.security.DossierScope.isVisibleAssignee(
                                        m.getAgentUserId()))
                .map(m -> views.mandate(m, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public Mandate agencyMandate(Long id) {
        return views.mandate(agencyMandateEntity(id), true);
    }

    /** Signature (papier) déclarée par l'agence : le dossier passe « Mandat signé ». */
    @Transactional
    public Mandate markSigned(Long id) {
        MandateEntity m = agencyMandateEntity(id);
        if (!MandateEntity.MANDATE_PENDING_SIGNATURE.equals(m.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "MANDATE_NOT_PENDING: ce mandat n'attend pas de signature.");
        }
        if (m.getDossierId() != null) {
            DossierStatusPatchRequest patch = new DossierStatusPatchRequest();
            patch.setStatusCode(MANDATE_SIGNED);
            dossierService.patchStatus(m.getDossierId(), patch);
        }
        activate(m);
        return views.mandate(m, true);
    }

    /**
     * Le dossier de l'agence passe « Mandat signé » (écran Pro ou bouton) : le mandat est actif.
     */
    @EventListener
    public void onDossierStatus(DossierStatusChangedEvent event) {
        Dossier d = event.getDossier();
        if (d == null || d.getId() == null) {
            return;
        }
        if (MANDATE_SIGNED.equals(d.getStatusCode())) {
            mandates.findByDossierId(d.getId())
                    .filter(m -> MandateEntity.MANDATE_PENDING_SIGNATURE.equals(m.getStatus()))
                    .ifPresent(this::activate);
        } else if ("CRM_CLOSED_WON".equals(d.getStatusCode())) {
            // Affaire conclue par l'agence : le mandat est terminé (UC-P9).
            mandates.findByDossierId(d.getId())
                    .filter(m -> MandateMarketplaceService.LIVE_MANDATE.contains(m.getStatus()))
                    .ifPresent(
                            m -> {
                                m.setEndedBy("AGENCY");
                                end(m, MandateEntity.MANDATE_COMPLETED, END_DEAL_CLOSED);
                                alertOwner(
                                        m,
                                        agencies.agencyName(m.getAgencyOrgId())
                                                + " a conclu l'affaire : donnez votre avis sur"
                                                + " l'agence.");
                            });
        }
    }

    // ---------------------------------------------------------------- lot C : suivi et fin

    public static final String END_DEAL_CLOSED = "DEAL_CLOSED_AGENCY";

    /** Motifs de fin (MANDATE_END_REASON) que chaque partie peut choisir (UC-P9). */
    public static final List<String> OWNER_END_REASONS =
            List.of("SOLD_BY_OWNER", "SOLD_THIRD_PARTY", "WITHDRAWN_OWNER");

    public static final List<String> AGENCY_END_REASONS =
            List.of(END_DEAL_CLOSED, "SOLD_THIRD_PARTY", "WITHDRAWN_AGENCY");

    /** Suivi d'un mandat par le propriétaire (UC-P8) : statut, annonces, événements visibles. */
    @Transactional(readOnly = true)
    public MarketplaceViews.MandateFollowUp followUp(Long id) {
        return followUp(ownerMandateEntity(id));
    }

    /** Suivi d'un mandat déjà chargé et contrôlé ({@link #ownerMandateEntity}). */
    MarketplaceViews.MandateFollowUp followUp(MandateEntity m) {
        PropertyEntity property = properties.findById(m.getPropertyId()).orElse(null);
        List<MarketplaceViews.AgencyListing> listings =
                orgScope.unfiltered(
                        () ->
                                annonces.findByPropertyIdOrderByIdAsc(m.getPropertyId()).stream()
                                        .filter(a -> m.getId().equals(a.getMandateId()))
                                        .map(
                                                a ->
                                                        new MarketplaceViews.AgencyListing(
                                                                a.getId(),
                                                                a.getTitle(),
                                                                AnnonceStatus.normalize(
                                                                                a.getStatus())
                                                                        .name(),
                                                                zero(
                                                                        dossiers
                                                                                .countByAnnonceIdAndCreatedAtAfter(
                                                                                        a.getId(),
                                                                                        LocalDateTime
                                                                                                .of(
                                                                                                        2000,
                                                                                                        1,
                                                                                                        1,
                                                                                                        0,
                                                                                                        0)))))
                                        .toList());
        // R-PROP-12 : seuls les événements marqués visibles ; notes internes et autres prospects
        // restent dans l'agence.
        List<MarketplaceViews.VisibleEvent> events =
                m.getDossierId() == null
                        ? List.of()
                        : orgScope.as(
                                m.getAgencyOrgId(),
                                () ->
                                        activities
                                                .findByDossierIdAndVisibilityOrderByCreatedAtDesc(
                                                        m.getDossierId(),
                                                        com.example.backend.entity.enums
                                                                .ActivityVisibility.CLIENT_VISIBLE)
                                                .stream()
                                                .map(
                                                        a ->
                                                                new MarketplaceViews.VisibleEvent(
                                                                        a.getId(),
                                                                        a.getType() != null
                                                                                ? a.getType().name()
                                                                                : null,
                                                                        a.getContent(),
                                                                        a.getCreatedAt()))
                                                .toList());
        MarketplaceViews.Review review =
                reviews.findByMandateId(m.getId())
                        .map(
                                r ->
                                        new MarketplaceViews.Review(
                                                r.getRating(), r.getComment(), r.getCreatedAt()))
                        .orElse(null);
        boolean live = MandateMarketplaceService.LIVE_MANDATE.contains(m.getStatus());
        return new MarketplaceViews.MandateFollowUp(
                views.mandate(m, false),
                m.getRequestId(),
                m.getProposalId(),
                property != null ? property.getTitle() : null,
                listings,
                events,
                offers.findByMandateIdOrderByCreatedAtDesc(m.getId()).stream()
                        .map(MandateOfferService::view)
                        .toList(),
                live,
                live ? OWNER_END_REASONS : List.of(),
                canReview(m) && review == null,
                review);
    }

    /** Fin du mandat par le propriétaire (UC-P9) ; l'agence est prévenue. */
    @Transactional
    public MarketplaceViews.MandateFollowUp endByOwner(Long id, String reason) {
        MandateEntity m = ownerMandateEntity(id);
        requireLive(m);
        if (!OWNER_END_REASONS.contains(reason)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "END_REASON_INVALID: motif de fin requis.");
        }
        m.setEndedBy("OWNER");
        end(m, MandateEntity.MANDATE_TERMINATED, reason);
        closeDossier(m, false);
        marketplace.notifyAgency(
                m.getAgencyOrgId(),
                m.getAgentUserId(),
                "Mandat terminé par le propriétaire",
                "Le propriétaire a mis fin au mandat n°" + m.getId() + ".",
                m.getDossierId() != null ? "/pro/dossiers/" + m.getDossierId() : "/pro/mandats");
        return followUp(id);
    }

    /** Fin du mandat par l'agence (UC-P9) ; le propriétaire est prévenu. */
    @Transactional
    public MarketplaceViews.Mandate endByAgency(Long id, String reason) {
        MandateEntity m = agencyMandateEntity(id);
        requireLive(m);
        if (!AGENCY_END_REASONS.contains(reason)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "END_REASON_INVALID: motif de fin requis.");
        }
        m.setEndedBy("AGENCY");
        boolean won = END_DEAL_CLOSED.equals(reason);
        end(m, won ? MandateEntity.MANDATE_COMPLETED : MandateEntity.MANDATE_TERMINATED, reason);
        closeDossier(m, won);
        alertOwner(
                m,
                agencies.agencyName(m.getAgencyOrgId())
                        + (won ? " a conclu l'affaire." : " a mis fin au mandat.")
                        + " Donnez votre avis sur l'agence.");
        return views.mandate(m, true);
    }

    /** Avis vérifié : une fois, après un mandat signé et terminé (R-PROP-13, PC-4). */
    @Transactional
    public MarketplaceViews.MandateFollowUp review(Long id, Integer rating, String comment) {
        MandateEntity m = ownerMandateEntity(id);
        if (!canReview(m)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "REVIEW_NOT_ALLOWED: un avis se donne à la fin d'un mandat signé.");
        }
        if (reviews.findByMandateId(m.getId()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "REVIEW_EXISTS: vous avez déjà donné votre avis.");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "RATING_INVALID: une note de 1 à 5.");
        }
        com.example.backend.entity.AgencyReviewEntity r =
                new com.example.backend.entity.AgencyReviewEntity();
        r.setMandateId(m.getId());
        r.setOwnerOrgId(m.getOwnerOrgId());
        r.setAgencyOrgId(m.getAgencyOrgId());
        r.setRating(rating);
        r.setComment(
                comment == null || comment.isBlank()
                        ? null
                        : comment.strip().substring(0, Math.min(1000, comment.strip().length())));
        r.setCreatedAt(LocalDateTime.now());
        reviews.save(r);
        return followUp(id);
    }

    private static boolean canReview(MandateEntity m) {
        return m.getSignedAt() != null
                && !MandateMarketplaceService.LIVE_MANDATE.contains(m.getStatus());
    }

    private static void requireLive(MandateEntity m) {
        if (!MandateMarketplaceService.LIVE_MANDATE.contains(m.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "MANDATE_ENDED: ce mandat est déjà terminé.");
        }
    }

    /** Dossier de l'agence clos (gagné ou perdu) si son workflow le permet. */
    private void closeDossier(MandateEntity m, boolean won) {
        moveDossier(m, won ? "CRM_CLOSED_WON" : "CRM_CLOSED_LOST");
    }

    /** Fait avancer le dossier de l'agence si son workflow l'autorise ; sinon, ne fait rien. */
    void moveDossier(MandateEntity m, String target) {
        if (m.getDossierId() == null) {
            return;
        }
        orgScope.run(
                m.getAgencyOrgId(),
                () -> {
                    boolean allowed =
                            dossierService.transitions(m.getDossierId()).transitions().stream()
                                    .anyMatch(t -> target.equals(t.statusCode()));
                    if (allowed) {
                        DossierStatusPatchRequest patch = new DossierStatusPatchRequest();
                        patch.setStatusCode(target);
                        dossierService.patchStatus(m.getDossierId(), patch);
                    }
                });
    }

    MandateEntity ownerMandateEntity(Long id) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return mandates.findById(id)
                .filter(m -> orgId.equals(m.getOwnerOrgId()))
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Mandat introuvable"));
    }

    private static long zero(Long v) {
        return v == null ? 0 : v;
    }

    private void activate(MandateEntity m) {
        if (!MandateEntity.MANDATE_PENDING_SIGNATURE.equals(m.getStatus())) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        m.setStatus(MandateEntity.MANDATE_ACTIVE);
        m.setSignedAt(now);
        m.setStartsAt(now);
        m.setEndsAt(now.plusMonths(m.getDurationMonths()));
        m.setUpdatedAt(now);
        mandates.save(m);
        alertOwner(
                m,
                "Votre mandat avec "
                        + agencies.agencyName(m.getAgencyOrgId())
                        + " est signé : l'agence peut publier votre bien.");
    }

    /**
     * Annonce de l'agence liée au bien (brouillon), publiée ensuite par le parcours habituel de
     * l'agence. Une seule par mandat ; le quartier est affiché, jamais l'adresse précise.
     */
    @Transactional
    public Map<String, Long> createAgencyAnnonce(Long id) {
        MandateEntity m = agencyMandateEntity(id);
        if (!MandateEntity.MANDATE_ACTIVE.equals(m.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "MANDATE_NOT_ACTIVE: déclarez d'abord le mandat signé avant de publier le bien.");
        }
        Annonce existing = annonces.findFirstByMandateIdOrderByIdAsc(m.getId()).orElse(null);
        if (existing != null) {
            return Map.of("annonceId", existing.getId());
        }
        PropertyEntity property = properties.findById(m.getPropertyId()).orElseThrow();
        Annonce ownerAnnonce =
                orgScope.unfiltered(
                        () ->
                                annonces.findFirstByOrgIdAndPropertyId(
                                                m.getOwnerOrgId(), property.getId())
                                        .orElse(null));
        AnnonceCreateRequest create = new AnnonceCreateRequest();
        create.setTitle(ownerAnnonce != null ? ownerAnnonce.getTitle() : property.getTitle());
        create.setDescription(
                ownerAnnonce != null && ownerAnnonce.getDescription() != null
                        ? ownerAnnonce.getDescription()
                        : property.getDescription());
        create.setPrice(property.getExpectedPrice());
        create.setCurrency("MAD");
        create.setType(
                "RENT".equals(property.getTransactionType()) ? AnnonceType.RENT : AnnonceType.SALE);
        create.setCategory(property.getPropertyType());
        create.setCity(property.getCity());
        create.setAddress(property.getDistrict());
        create.setSurface(property.getSurface());
        Map<String, Object> meta = new HashMap<>();
        if (property.getRooms() != null) {
            meta.put("rooms", property.getRooms());
        }
        create.setMeta(meta);
        AnnonceResponse created = annonceService.create(create);
        Annonce a = annonces.findById(created.getId()).orElseThrow();
        a.setPropertyId(property.getId());
        a.setMandateId(m.getId());
        a.setPublisherKind(PUBLISHER_AGENCY);
        annonces.save(a);
        return Map.of("annonceId", a.getId());
    }

    /** Annonce de l'agence en ligne : le dossier passe « En commercialisation ». */
    @EventListener
    public void onAgencyAnnoncePublished(MandateAnnoncePublishedEvent event) {
        mandates.findById(event.mandateId())
                .filter(m -> m.getDossierId() != null)
                .ifPresent(
                        m -> {
                            boolean allowed =
                                    dossierService
                                            .transitions(m.getDossierId())
                                            .transitions()
                                            .stream()
                                            .anyMatch(t -> LISTED.equals(t.statusCode()));
                            if (allowed) {
                                DossierStatusPatchRequest patch = new DossierStatusPatchRequest();
                                patch.setStatusCode(LISTED);
                                dossierService.patchStatus(m.getDossierId(), patch);
                            }
                        });
    }

    /** Échéances : demandes de 14 jours, mandats non signés sous 7 jours, mandats échus. */
    @Scheduled(cron = "${atlas.marketplace.expiry-cron:0 7 * * * *}")
    @Transactional
    public void expire() {
        LocalDateTime now = LocalDateTime.now();
        for (MandateRequestEntity r :
                requests.findByStatusInAndExpiresAtBefore(
                        Set.of(MandateRequestEntity.MREQ_OPEN), now)) {
            marketplace.close(r, MandateRequestEntity.MREQ_EXPIRED);
        }
        for (MandateEntity m :
                mandates.findByStatusAndCreatedAtBefore(
                        MandateEntity.MANDATE_PENDING_SIGNATURE,
                        now.minusDays(settings.pendingSignatureDays()))) {
            end(m, MandateEntity.MANDATE_TERMINATED, "NOT_SIGNED");
        }
        for (MandateEntity m :
                mandates.findByStatusAndEndsAtBefore(MandateEntity.MANDATE_ACTIVE, now)) {
            end(m, MandateEntity.MANDATE_EXPIRED, "TERM_REACHED");
        }
        // Lot C, § 13 : mandat bientôt échu (J-15), aux deux parties.
        for (MandateEntity m :
                mandates.findByStatusAndEndsAtBefore(
                        MandateEntity.MANDATE_ACTIVE, now.plusDays(15))) {
            if (m.getExpiryAlertedAt() == null) {
                m.setExpiryAlertedAt(now);
                mandates.save(m);
                alertOwner(
                        m,
                        "Votre mandat avec "
                                + agencies.agencyName(m.getAgencyOrgId())
                                + " se termine dans moins de 15 jours.");
                marketplace.notifyAgency(
                        m.getAgencyOrgId(),
                        m.getAgentUserId(),
                        "Mandat bientôt échu",
                        "Le mandat n°" + m.getId() + " se termine dans moins de 15 jours.",
                        "/pro/mandats");
            }
        }
        // § 13 : demande ouverte sans proposition après 48 h, au propriétaire.
        for (MandateRequestEntity r :
                requests.findByStatusAndVisibilityOrderByOpenedAtDesc(
                        MandateRequestEntity.MREQ_OPEN, MandateRequestEntity.MREQ_OPEN_MARKET)) {
            if (r.getIdleAlertedAt() == null
                    && r.getOpenedAt() != null
                    && r.getOpenedAt().isBefore(now.minusHours(48))
                    && !proposals.existsByRequestId(r.getId())) {
                r.setIdleAlertedAt(now);
                requests.save(r);
                alertOwnerForRequest(
                        r,
                        "Pas encore de proposition pour votre bien à "
                                + r.getCity()
                                + " : invitez une agence recommandée depuis votre demande.");
            }
        }
        // § 13 : demande directe sans réponse, rappel à l'agence à 48 h, puis le propriétaire à
        // 72 h (il peut alors l'ouvrir à toutes les agences, R-PROP-16). idle_alerted_at garde la
        // dernière étape envoyée.
        for (MandateRequestEntity r :
                requests.findByStatusAndVisibilityOrderByOpenedAtDesc(
                        MandateRequestEntity.MREQ_OPEN, MandateRequestEntity.MREQ_DIRECT)) {
            if (r.getOpenedAt() == null || r.getTargetDeclinedAt() != null) {
                continue;
            }
            LocalDateTime ownerStep = r.getOpenedAt().plusHours(72);
            boolean agencyDue =
                    r.getIdleAlertedAt() == null && r.getOpenedAt().isBefore(now.minusHours(48));
            boolean ownerDue =
                    now.isAfter(ownerStep)
                            && (r.getIdleAlertedAt() == null
                                    || r.getIdleAlertedAt().isBefore(ownerStep));
            // La requête des propositions seulement quand une étape est due.
            if ((!agencyDue && !ownerDue) || proposals.existsByRequestId(r.getId())) {
                continue;
            }
            if (agencyDue && !ownerDue) {
                marketplace.notifyAgency(
                        r.getTargetAgencyOrgId(),
                        null,
                        "Rappel : demande directe sans réponse",
                        "Un propriétaire de "
                                + r.getCity()
                                + " attend votre réponse depuis 48 h. Sans réponse à 72 h, il"
                                + " pourra ouvrir sa demande à toutes les agences.",
                        "/pro/mandats/demandes/" + r.getId());
            }
            if (ownerDue) {
                alertOwnerForRequest(
                        r,
                        "L'agence n'a pas répondu en 72 h : vous pouvez ouvrir votre demande à"
                                + " toutes les agences de "
                                + r.getCity()
                                + ".");
            }
            r.setIdleAlertedAt(now);
            requests.save(r);
        }
    }

    private void alertOwnerForRequest(MandateRequestEntity r, String text) {
        OrganizationEntity owner = organizations.findByOrgId(r.getOwnerOrgId()).orElse(null);
        if (owner == null || owner.getOwnerPhone() == null) {
            return;
        }
        events.publishEvent(
                new PlatformAlert(
                        PlatformAlert.Audience.OWNER,
                        owner.getOwnerPhone(),
                        null,
                        text,
                        "Atlas : votre demande",
                        "d" + r.getId(),
                        publicBaseUrl + "/proprietaire/demandes/" + r.getId(),
                        true,
                        false));
    }

    private void end(MandateEntity m, String status, String reason) {
        LocalDateTime now = LocalDateTime.now();
        m.setStatus(status);
        m.setEndReason(reason);
        m.setEndedAt(now);
        m.setUpdatedAt(now);
        mandates.save(m);
        suspendAgencyAnnonces(m);
        log.info("Mandat {} terminé : {} ({})", m.getId(), status, reason);
    }

    /**
     * Sans mandat, l'agence ne peut plus commercialiser le bien : ses annonces quittent le portail.
     */
    private void suspendAgencyAnnonces(MandateEntity m) {
        orgScope.run(
                m.getAgencyOrgId(),
                () ->
                        annonces.findByPropertyIdOrderByIdAsc(m.getPropertyId()).stream()
                                .filter(a -> m.getId().equals(a.getMandateId()))
                                .filter(
                                        a ->
                                                AnnonceStatus.normalize(a.getStatus())
                                                        == AnnonceStatus.PUBLISHED)
                                .forEach(
                                        a ->
                                                annonceService.applyTransition(
                                                        a.getId(),
                                                        AnnoncePublicationService.T_SUSPEND,
                                                        SUSPEND_MANDATE_ENDED,
                                                        "Mandat n°" + m.getId() + " terminé")));
    }

    MandateEntity agencyMandateEntity(Long id) {
        String agency = marketplace.requireVerifiedAgency();
        return mandates.findById(id)
                .filter(m -> agency.equals(m.getAgencyOrgId()))
                .filter(
                        m ->
                                com.example.backend.security.DossierScope.isVisibleAssignee(
                                        m.getAgentUserId()))
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Mandat introuvable"));
    }

    /** Alerte au propriétaire ; le lien ouvre le suivi du mandat ({@code /p/m<id>}). */
    void alertOwner(MandateEntity m, String text) {
        OrganizationEntity owner = organizations.findByOrgId(m.getOwnerOrgId()).orElse(null);
        if (owner == null || owner.getOwnerPhone() == null) {
            return;
        }
        events.publishEvent(
                new PlatformAlert(
                        PlatformAlert.Audience.OWNER,
                        owner.getOwnerPhone(),
                        null,
                        text,
                        "Atlas : votre mandat",
                        "m" + m.getId(),
                        publicBaseUrl + "/proprietaire/mandats/" + m.getId(),
                        true,
                        false));
    }

    /** Pour la vue : un bien a-t-il un mandat exclusif vivant ? */
    public boolean hasLiveExclusive(Long propertyId) {
        return mandates
                .findByPropertyIdAndStatusIn(propertyId, MandateMarketplaceService.LIVE_MANDATE)
                .stream()
                .anyMatch(m -> MandateEntity.EXCLUSIVE.equals(m.getMandateType()));
    }
}
