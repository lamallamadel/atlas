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
        if (d == null || d.getId() == null || !MANDATE_SIGNED.equals(d.getStatusCode())) {
            return;
        }
        mandates.findByDossierId(d.getId())
                .filter(m -> MandateEntity.MANDATE_PENDING_SIGNATURE.equals(m.getStatus()))
                .ifPresent(this::activate);
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
    }

    private void end(MandateEntity m, String status, String reason) {
        LocalDateTime now = LocalDateTime.now();
        m.setStatus(status);
        m.setEndReason(reason);
        m.setEndedAt(now);
        m.setUpdatedAt(now);
        mandates.save(m);
        log.info("Mandat {} terminé : {} ({})", m.getId(), status, reason);
    }

    private MandateEntity agencyMandateEntity(Long id) {
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

    private void alertOwner(MandateEntity m, String text) {
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
                        "d" + m.getRequestId(),
                        publicBaseUrl + "/proprietaire/demandes/" + m.getRequestId(),
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
