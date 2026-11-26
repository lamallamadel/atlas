package com.example.backend.mandate;

import static com.example.backend.entity.MandateProposalEntity.MPROP_ACCEPTED;
import static com.example.backend.entity.MandateProposalEntity.MPROP_DECLINED;
import static com.example.backend.entity.MandateProposalEntity.MPROP_SENT;
import static com.example.backend.entity.MandateProposalEntity.MPROP_SHORTLISTED;
import static com.example.backend.entity.MandateProposalEntity.MPROP_WITHDRAWN;
import static com.example.backend.entity.MandateRequestEntity.MREQ_AWARDED;
import static com.example.backend.entity.MandateRequestEntity.MREQ_CANCELLED;
import static com.example.backend.entity.MandateRequestEntity.MREQ_DIRECT;
import static com.example.backend.entity.MandateRequestEntity.MREQ_OPEN;
import static com.example.backend.entity.MandateRequestEntity.MREQ_OPEN_MARKET;

import com.example.backend.entity.MandateEntity;
import com.example.backend.entity.MandateProposalEntity;
import com.example.backend.entity.MandateRequestEntity;
import com.example.backend.entity.MarketplaceMessageEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.mandate.MarketplaceViews.AgencyProposal;
import com.example.backend.mandate.MarketplaceViews.AgencyRequest;
import com.example.backend.mandate.MarketplaceViews.OwnerRequest;
import com.example.backend.mandate.MarketplaceViews.ProposalCreate;
import com.example.backend.mandate.MarketplaceViews.RequestCreate;
import com.example.backend.mandate.MarketplaceViews.Thread;
import com.example.backend.mandate.MarketplaceViews.ThreadMessage;
import com.example.backend.owner.OwnerContext;
import com.example.backend.owner.PlatformAlert;
import com.example.backend.repository.MandateProposalRepository;
import com.example.backend.repository.MandateRepository;
import com.example.backend.repository.MandateRequestRepository;
import com.example.backend.repository.MarketplaceMessageRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.PropertyRepository;
import com.example.backend.security.AccessPolicy;
import com.example.backend.service.NotificationService;
import com.example.backend.util.CurrentUser;
import com.example.backend.util.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Bourse aux mandats (cas d'usage n°1, lot B) : demandes d'accompagnement du propriétaire (UC-P5),
 * propositions des agences (UC-P6), comparaison et échanges (UC-P7).
 *
 * <p>Objets inter-organisations (ADR 0005) : ce service est le seul point d'accès. Un propriétaire
 * ne lit que ses demandes ; une agence ne lit une demande que si elle est ouverte dans une de ses
 * zones, si elle lui est adressée, ou si elle y a proposé. Une agence ne voit jamais les
 * propositions concurrentes, ni l'adresse ou le téléphone du propriétaire avant acceptation.
 */
@Service
public class MandateMarketplaceService {

    static final Set<String> MANDATE_TYPES = Set.of(MandateEntity.SIMPLE, MandateEntity.EXCLUSIVE);
    static final Set<String> COMMISSION_KINDS = Set.of("PERCENT", "FLAT");
    static final Set<String> PAYERS = Set.of("SELLER", "BUYER", "SHARED");
    static final Set<String> SERVICES =
            Set.of(
                    "ESTIMATION",
                    "PHOTOS",
                    "VISITS",
                    "NEGOTIATION",
                    "LEGAL",
                    "TENANT_SELECTION",
                    "RENT_MANAGEMENT");
    static final Set<String> ACTIVE_PROPOSAL = Set.of(MPROP_SENT, MPROP_SHORTLISTED);
    static final Set<String> LIVE_MANDATE =
            Set.of(MandateEntity.MANDATE_PENDING_SIGNATURE, MandateEntity.MANDATE_ACTIVE);
    static final int MAX_MESSAGE = 2000;

    private final OwnerContext ownerContext;
    private final MandateRequestRepository requests;
    private final MandateProposalRepository proposals;
    private final MarketplaceMessageRepository messages;
    private final MandateRepository mandates;
    private final PropertyRepository properties;
    private final OrganizationRepository organizations;
    private final AgencyDirectoryService agencies;
    private final MarketplaceSettings settings;
    private final MandateViews views;
    private final NotificationService notifications;
    private final ApplicationEventPublisher events;
    private final String publicBaseUrl;
    private final MandateMatchingService matching;
    private final com.example.backend.repository.MandateInvitationRepository invitations;

    public MandateMarketplaceService(
            OwnerContext ownerContext,
            MandateRequestRepository requests,
            MandateProposalRepository proposals,
            MarketplaceMessageRepository messages,
            MandateRepository mandates,
            PropertyRepository properties,
            OrganizationRepository organizations,
            AgencyDirectoryService agencies,
            MarketplaceSettings settings,
            MandateViews views,
            NotificationService notifications,
            ApplicationEventPublisher events,
            MandateMatchingService matching,
            com.example.backend.repository.MandateInvitationRepository invitations,
            @Value("${atlas.consent.public-base-url:http://localhost:4200}") String publicBaseUrl) {
        this.matching = matching;
        this.invitations = invitations;
        this.ownerContext = ownerContext;
        this.requests = requests;
        this.proposals = proposals;
        this.messages = messages;
        this.mandates = mandates;
        this.properties = properties;
        this.organizations = organizations;
        this.agencies = agencies;
        this.settings = settings;
        this.views = views;
        this.notifications = notifications;
        this.events = events;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    // =================================================================== propriétaire

    @Transactional
    public OwnerRequest createRequest(RequestCreate in) {
        OrganizationEntity owner = ownerContext.requireOwnerOrg();
        if (in == null || in.propertyId() == null) {
            throw bad("PROPERTY_REQUIRED: choisissez le bien à confier.");
        }
        PropertyEntity property =
                properties
                        .findById(in.propertyId())
                        .filter(p -> owner.getOrgId().equals(p.getOrgId()))
                        .orElseThrow(() -> notFound("Bien introuvable"));
        // R-PROP-05 : pas de nouvelle demande sous mandat exclusif ; une seule demande ouverte.
        boolean exclusive =
                mandates.findByPropertyIdAndStatusIn(property.getId(), LIVE_MANDATE).stream()
                        .anyMatch(m -> MandateEntity.EXCLUSIVE.equals(m.getMandateType()));
        if (exclusive) {
            throw conflict(
                    "EXCLUSIVE_MANDATE: ce bien est confié en exclusivité à une agence ; pas de"
                            + " nouvelle demande pendant le mandat.");
        }
        if (requests.findByPropertyIdOrderByCreatedAtDesc(property.getId()).stream()
                .anyMatch(r -> MREQ_OPEN.equals(r.getStatus()))) {
            throw conflict("REQUEST_ALREADY_OPEN: une demande est déjà en cours pour ce bien.");
        }
        String visibility = in.visibility() == null ? MREQ_OPEN_MARKET : in.visibility();
        if (!MREQ_OPEN_MARKET.equals(visibility) && !MREQ_DIRECT.equals(visibility)) {
            throw bad("VISIBILITY_INVALID: MREQ_OPEN_MARKET ou MREQ_DIRECT.");
        }
        String target = null;
        if (MREQ_DIRECT.equals(visibility)) {
            target = in.targetAgencyOrgId();
            if (target == null || !agencies.isVerified(target)) {
                throw bad("AGENCY_INVALID: choisissez une agence vérifiée de l'annuaire.");
            }
        }
        List<String> types = upper(in.mandateTypes());
        if (types.isEmpty() || !MANDATE_TYPES.containsAll(types)) {
            throw bad("MANDATE_TYPES_INVALID: SIMPLE, EXCLUSIVE ou les deux.");
        }
        List<String> services = upper(in.services());
        if (!SERVICES.containsAll(services)) {
            throw bad("SERVICES_INVALID: services inconnus.");
        }
        if (in.expectedPrice() != null && in.expectedPrice().signum() <= 0) {
            throw bad("PRICE_INVALID: le prix souhaité est positif.");
        }
        LocalDateTime now = LocalDateTime.now();
        MandateRequestEntity r = new MandateRequestEntity();
        r.setOwnerOrgId(owner.getOrgId());
        r.setPropertyId(property.getId());
        r.setVisibility(visibility);
        r.setTargetAgencyOrgId(target);
        r.setObjective(property.getTransactionType());
        r.setCity(property.getCity());
        r.setDistrict(property.getDistrict());
        r.setExpectedPrice(
                in.expectedPrice() != null ? in.expectedPrice() : property.getExpectedPrice());
        r.setCurrency("MAD");
        r.setDeadline(text(in.deadline(), 40));
        r.setMandateTypes(String.join(",", types));
        r.setServices(services.isEmpty() ? null : String.join(",", services));
        r.setCommissionNote(text(in.commissionNote(), 255));
        r.setAvailability(text(in.availability(), 255));
        r.setLanguages(text(in.languages(), 120));
        r.setMessage(text(in.message(), 2000));
        r.setStatus(MREQ_OPEN);
        r.setMaxProposals(settings.maxProposals());
        r.setOpenedAt(now);
        r.setExpiresAt(now.plusDays(settings.requestDays()));
        r.setCreatedAt(now);
        r.setUpdatedAt(now);
        requests.save(r);
        if (MREQ_OPEN_MARKET.equals(visibility)) {
            recordMatches(r);
        }
        if (target != null) {
            notifyAgency(
                    target,
                    null,
                    "Demande directe d'un propriétaire",
                    "Un propriétaire vous confie son bien à "
                            + r.getCity()
                            + " : consultez sa demande et faites-lui une proposition.",
                    "/pro/mandats/demandes/" + r.getId());
        }
        return views.ownerRequest(r);
    }

    @Transactional(readOnly = true)
    public List<OwnerRequest> myRequests() {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return requests.findByOwnerOrgIdOrderByCreatedAtDesc(orgId).stream()
                .map(views::ownerRequest)
                .toList();
    }

    @Transactional(readOnly = true)
    public OwnerRequest myRequest(Long id) {
        return views.ownerRequest(ownerRequest(id));
    }

    @Transactional
    public OwnerRequest cancel(Long id) {
        MandateRequestEntity r = ownerRequest(id);
        if (!MREQ_OPEN.equals(r.getStatus())) {
            throw conflict("REQUEST_CLOSED: cette demande n'est plus ouverte.");
        }
        close(r, MREQ_CANCELLED);
        return views.ownerRequest(r);
    }

    /** Demande directe sans réponse sous 72 h, ou déclinée : ouverte à la bourse (R-PROP-16). */
    @Transactional
    public OwnerRequest openToMarket(Long id) {
        MandateRequestEntity r = ownerRequest(id);
        if (!views.canOpenToMarket(r)) {
            throw conflict(
                    "TOO_EARLY: l'agence a "
                            + settings.directResponseHours()
                            + " h pour répondre ; vous pourrez ensuite ouvrir la demande à"
                            + " toutes les agences.");
        }
        LocalDateTime now = LocalDateTime.now();
        r.setVisibility(MREQ_OPEN_MARKET);
        r.setOpenedAt(now);
        r.setExpiresAt(now.plusDays(settings.requestDays()));
        r.setUpdatedAt(now);
        requests.save(r);
        recordMatches(r);
        return views.ownerRequest(r);
    }

    // =================================================================== lot C : rapprochement

    /** Les 10 agences les plus pertinentes à l'ouverture (§ 5.1) : la bourse les met en avant. */
    void recordMatches(MandateRequestEntity r) {
        LocalDateTime now = LocalDateTime.now();
        for (MandateMatchingService.Score s : matching.ranking(r).stream().limit(10).toList()) {
            if (invitations.findByRequestIdAndAgencyOrgId(r.getId(), s.agencyOrgId()).isEmpty()) {
                com.example.backend.entity.MandateInvitationEntity i =
                        new com.example.backend.entity.MandateInvitationEntity();
                i.setRequestId(r.getId());
                i.setAgencyOrgId(s.agencyOrgId());
                i.setKind(com.example.backend.entity.MandateInvitationEntity.MATCHED);
                i.setScore(s.total());
                i.setCreatedAt(now);
                invitations.save(i);
            }
        }
    }

    /** Agences recommandées au propriétaire : les 5 plus pertinentes (PC-1). */
    @Transactional(readOnly = true)
    public List<MarketplaceViews.RecommendedAgency> recommended(Long requestId) {
        MandateRequestEntity r = ownerRequest(requestId);
        java.util.Set<String> proposed =
                proposals.findByRequestIdOrderByCreatedAtAsc(r.getId()).stream()
                        .map(MandateProposalEntity::getAgencyOrgId)
                        .collect(java.util.stream.Collectors.toSet());
        java.util.Map<String, AgencyDirectoryService.AgencyCard> cards =
                agencies.directory(r.getCity(), r.getObjective()).stream()
                        .collect(
                                java.util.stream.Collectors.toMap(
                                        AgencyDirectoryService.AgencyCard::orgId, c -> c));
        return matching.ranking(r).stream()
                .limit(5)
                .map(
                        s -> {
                            AgencyDirectoryService.AgencyCard c = cards.get(s.agencyOrgId());
                            boolean invited =
                                    invitations
                                            .findByRequestIdAndAgencyOrgId(
                                                    r.getId(), s.agencyOrgId())
                                            .map(
                                                    i ->
                                                            com.example.backend.entity
                                                                    .MandateInvitationEntity.INVITED
                                                                    .equals(i.getKind()))
                                            .orElse(false);
                            return new MarketplaceViews.RecommendedAgency(
                                    s.agencyOrgId(),
                                    c != null ? c.name() : agencies.agencyName(s.agencyOrgId()),
                                    c != null ? c.description() : null,
                                    c != null ? c.districts() : List.of(),
                                    c != null ? c.rating() : null,
                                    c != null ? c.reviews() : 0,
                                    invited,
                                    proposed.contains(s.agencyOrgId()));
                        })
                .toList();
    }

    /** Le propriétaire invite une agence recommandée à proposer (5 invitations au plus). */
    @Transactional
    public List<MarketplaceViews.RecommendedAgency> invite(Long requestId, String agencyOrgId) {
        MandateRequestEntity r = ownerRequest(requestId);
        if (!MREQ_OPEN.equals(r.getStatus()) || !MREQ_OPEN_MARKET.equals(r.getVisibility())) {
            throw conflict(
                    "REQUEST_CLOSED: invitez une agence sur une demande ouverte à la bourse.");
        }
        MandateMatchingService.Score s = matching.score(r, agencyOrgId);
        if (!s.eligible()) {
            throw bad("AGENCY_INVALID: cette agence ne couvre pas votre bien.");
        }
        long invited =
                invitations.findByRequestIdOrderByScoreDesc(r.getId()).stream()
                        .filter(
                                i ->
                                        com.example.backend.entity.MandateInvitationEntity.INVITED
                                                .equals(i.getKind()))
                        .count();
        com.example.backend.entity.MandateInvitationEntity i =
                invitations
                        .findByRequestIdAndAgencyOrgId(r.getId(), agencyOrgId)
                        .orElseGet(com.example.backend.entity.MandateInvitationEntity::new);
        if (!com.example.backend.entity.MandateInvitationEntity.INVITED.equals(i.getKind())) {
            if (invited >= 5) {
                throw conflict("INVITATIONS_FULL: 5 invitations au plus par demande.");
            }
            i.setRequestId(r.getId());
            i.setAgencyOrgId(agencyOrgId);
            i.setKind(com.example.backend.entity.MandateInvitationEntity.INVITED);
            i.setScore(s.total());
            if (i.getCreatedAt() == null) {
                i.setCreatedAt(LocalDateTime.now());
            }
            i.setSeenAt(null);
            invitations.save(i);
        }
        return recommended(requestId);
    }

    @Transactional
    public OwnerRequest shortlist(Long proposalId) {
        MandateProposalEntity p = ownerProposal(proposalId);
        if (!MPROP_SENT.equals(p.getStatus())) {
            throw conflict("PROPOSAL_NOT_PENDING: cette proposition n'est plus en attente.");
        }
        setStatus(p, MPROP_SHORTLISTED);
        return views.ownerRequest(requests.findById(p.getRequestId()).orElseThrow());
    }

    @Transactional
    public OwnerRequest decline(Long proposalId) {
        MandateProposalEntity p = ownerProposal(proposalId);
        if (!ACTIVE_PROPOSAL.contains(p.getStatus())) {
            throw conflict("PROPOSAL_NOT_PENDING: cette proposition n'est plus en attente.");
        }
        setStatus(p, MPROP_DECLINED);
        notifyAgency(
                p.getAgencyOrgId(),
                p.getAgentUserId(),
                "Proposition non retenue",
                "Le propriétaire n'a pas retenu votre proposition à " + city(p) + ".",
                "/pro/mandats/propositions/" + p.getId());
        return views.ownerRequest(requests.findById(p.getRequestId()).orElseThrow());
    }

    /** Proposition du propriétaire courant, encore acceptable (UC-P7). */
    @Transactional(readOnly = true)
    public MandateProposalEntity acceptableProposal(Long proposalId) {
        MandateProposalEntity p = ownerProposal(proposalId);
        MandateRequestEntity r = requests.findById(p.getRequestId()).orElseThrow();
        if (!ACTIVE_PROPOSAL.contains(p.getStatus())) {
            throw conflict("PROPOSAL_NOT_PENDING: cette proposition n'est plus en attente.");
        }
        boolean open = MREQ_OPEN.equals(r.getStatus());
        // Mandat simple : d'autres propositions simples restent acceptables après une première.
        boolean simpleAfterAward =
                MREQ_AWARDED.equals(r.getStatus())
                        && MandateEntity.SIMPLE.equals(p.getMandateType())
                        && mandates
                                .findByPropertyIdAndStatusIn(r.getPropertyId(), LIVE_MANDATE)
                                .stream()
                                .noneMatch(m -> MandateEntity.EXCLUSIVE.equals(m.getMandateType()));
        if (!open && !simpleAfterAward) {
            throw conflict("REQUEST_CLOSED: cette demande n'est plus ouverte.");
        }
        return p;
    }

    // =================================================================== agence

    /** Demandes ouvertes de la bourse dans les zones de l'agence (PB-1). */
    @Transactional(readOnly = true)
    public List<AgencyRequest> market() {
        String agency = requireVerifiedAgency();
        return requests
                .findByStatusAndVisibilityOrderByOpenedAtDesc(MREQ_OPEN, MREQ_OPEN_MARKET)
                .stream()
                .filter(r -> !r.getExpiresAt().isBefore(LocalDateTime.now()))
                .filter(r -> agencies.covers(agency, r.getCity()))
                .map(r -> views.agencyRequest(r, agency))
                // Invitations d'abord, puis par pertinence (§ 5.1).
                .sorted(
                        java.util.Comparator.comparing(AgencyRequest::invited)
                                .thenComparingInt(AgencyRequest::relevance)
                                .reversed())
                .toList();
    }

    /** Demandes adressées directement à l'agence (UC-P5). */
    @Transactional(readOnly = true)
    public List<AgencyRequest> directRequests() {
        String agency = requireVerifiedAgency();
        return requests.findByTargetAgencyOrgIdOrderByCreatedAtDesc(agency).stream()
                .map(r -> views.agencyRequest(r, agency))
                .toList();
    }

    @Transactional(readOnly = true)
    public AgencyRequest agencyRequest(Long id) {
        String agency = requireVerifiedAgency();
        return views.agencyRequest(visibleRequest(id, agency), agency);
    }

    @Transactional
    public AgencyRequest propose(Long requestId, ProposalCreate in) {
        String agency = requireVerifiedAgency();
        MandateRequestEntity r = visibleRequest(requestId, agency);
        String reason = views.cannotPropose(r, agency);
        if (reason != null) {
            throw conflict(reason);
        }
        validate(r, in);
        LocalDateTime now = LocalDateTime.now();
        MandateProposalEntity p = new MandateProposalEntity();
        p.setRequestId(r.getId());
        p.setAgencyOrgId(agency);
        p.setAgentUserId(CurrentUser.id().orElse("unknown"));
        p.setAgentName(CurrentUser.displayName().orElse(null));
        p.setMandateType(in.mandateType().toUpperCase());
        p.setDurationMonths(in.durationMonths());
        p.setCommissionKind(in.commissionKind().toUpperCase());
        p.setCommissionValue(in.commissionValue());
        p.setCommissionPayer(in.commissionPayer().toUpperCase());
        List<String> services = upper(in.services());
        p.setServices(services.isEmpty() ? null : String.join(",", services));
        p.setEstimateMin(in.estimateMin());
        p.setEstimateMax(in.estimateMax());
        p.setMessage(text(in.message(), 2000));
        p.setStatus(MPROP_SENT);
        p.setAgencyLastReadAt(now);
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
        proposals.save(p);
        alertOwner(
                r,
                p,
                "Nouvelle proposition de "
                        + agencies.agencyName(agency)
                        + " pour votre bien à "
                        + r.getCity()
                        + ".");
        return views.agencyRequest(r, agency);
    }

    /** L'agence visée décline une demande directe (R-PROP-16). */
    @Transactional
    public AgencyRequest declineDirect(Long requestId) {
        String agency = requireVerifiedAgency();
        MandateRequestEntity r = visibleRequest(requestId, agency);
        if (!agency.equals(r.getTargetAgencyOrgId()) || !MREQ_OPEN.equals(r.getStatus())) {
            throw conflict("NOT_DIRECT: cette demande ne vous est pas adressée.");
        }
        if (r.getTargetDeclinedAt() == null) {
            r.setTargetDeclinedAt(LocalDateTime.now());
            r.setUpdatedAt(LocalDateTime.now());
            requests.save(r);
            alertOwnerPlain(
                    r,
                    agencies.agencyName(agency)
                            + " ne peut pas prendre votre bien : ouvrez votre demande à toutes"
                            + " les agences.");
        }
        return views.agencyRequest(r, agency);
    }

    /** Propositions de l'agent, ou de toute l'agence pour un manager. */
    @Transactional(readOnly = true)
    public List<AgencyProposal> myProposals() {
        String agency = requireVerifiedAgency();
        boolean all = AccessPolicy.isManagerOrAdmin();
        String me = CurrentUser.id().orElse("");
        return proposals.findByAgencyOrgIdOrderByCreatedAtDesc(agency).stream()
                .filter(p -> all || me.equals(p.getAgentUserId()))
                .map(views::agencyProposal)
                .toList();
    }

    @Transactional(readOnly = true)
    public AgencyProposal myProposal(Long id) {
        return views.agencyProposal(agencyProposal(id));
    }

    @Transactional
    public AgencyProposal withdraw(Long proposalId) {
        MandateProposalEntity p = agencyProposal(proposalId);
        if (!ACTIVE_PROPOSAL.contains(p.getStatus())) {
            throw conflict("PROPOSAL_NOT_PENDING: cette proposition n'est plus en attente.");
        }
        setStatus(p, MPROP_WITHDRAWN);
        return views.agencyProposal(p);
    }

    // =================================================================== messages (UC-P7)

    @Transactional
    public Thread ownerThread(Long proposalId) {
        MandateProposalEntity p = ownerProposal(proposalId);
        p.setOwnerLastReadAt(LocalDateTime.now());
        proposals.save(p);
        return thread(p);
    }

    @Transactional
    public Thread ownerSend(Long proposalId, String body) {
        MandateProposalEntity p = ownerProposal(proposalId);
        requireThreadOpen(p);
        OrganizationEntity owner = ownerContext.requireOwnerOrg();
        save(
                p,
                MarketplaceMessageEntity.OWNER,
                owner.getOwnerUserId(),
                owner.getDisplayName(),
                body);
        p.setOwnerLastReadAt(LocalDateTime.now());
        proposals.save(p);
        notifyAgency(
                p.getAgencyOrgId(),
                p.getAgentUserId(),
                "Message d'un propriétaire",
                "Le propriétaire vous a écrit au sujet de votre proposition à " + city(p) + ".",
                "/pro/mandats/propositions/" + p.getId());
        return thread(p);
    }

    @Transactional
    public Thread agencyThread(Long proposalId) {
        MandateProposalEntity p = agencyProposal(proposalId);
        p.setAgencyLastReadAt(LocalDateTime.now());
        proposals.save(p);
        return thread(p);
    }

    @Transactional
    public Thread agencySend(Long proposalId, String body) {
        MandateProposalEntity p = agencyProposal(proposalId);
        requireThreadOpen(p);
        save(
                p,
                MarketplaceMessageEntity.AGENCY,
                CurrentUser.id().orElse(null),
                agencies.agencyName(p.getAgencyOrgId()),
                body);
        p.setAgencyLastReadAt(LocalDateTime.now());
        MandateRequestEntity r = requests.findById(p.getRequestId()).orElseThrow();
        if (MandateViews.shouldAlert(p.getOwnerAlertedAt(), p.getOwnerLastReadAt())) {
            alertOwner(
                    r,
                    p,
                    agencies.agencyName(p.getAgencyOrgId())
                            + " vous a écrit au sujet de votre bien à "
                            + r.getCity()
                            + ".");
        }
        proposals.save(p);
        return thread(p);
    }

    // =================================================================== interne

    MandateRequestEntity ownerRequest(Long id) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return requests.findById(id)
                .filter(r -> orgId.equals(r.getOwnerOrgId()))
                .orElseThrow(() -> notFound("Demande introuvable"));
    }

    MandateProposalEntity ownerProposal(Long id) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        MandateProposalEntity p =
                proposals.findById(id).orElseThrow(() -> notFound("Proposition introuvable"));
        requests.findById(p.getRequestId())
                .filter(r -> orgId.equals(r.getOwnerOrgId()))
                .orElseThrow(() -> notFound("Proposition introuvable"));
        return p;
    }

    MandateProposalEntity agencyProposal(Long id) {
        String agency = requireVerifiedAgency();
        boolean all = AccessPolicy.isManagerOrAdmin();
        String me = CurrentUser.id().orElse("");
        return proposals
                .findById(id)
                .filter(p -> agency.equals(p.getAgencyOrgId()))
                .filter(p -> all || me.equals(p.getAgentUserId()))
                .orElseThrow(() -> notFound("Proposition introuvable"));
    }

    /** Une agence ne lit une demande que si elle lui est accessible (§ 8, ADR 0005). */
    MandateRequestEntity visibleRequest(Long id, String agency) {
        MandateRequestEntity r =
                requests.findById(id).orElseThrow(() -> notFound("Demande introuvable"));
        boolean target = agency.equals(r.getTargetAgencyOrgId());
        boolean proposed = proposals.findByRequestIdAndAgencyOrgId(id, agency).isPresent();
        boolean market =
                MREQ_OPEN_MARKET.equals(r.getVisibility())
                        && MREQ_OPEN.equals(r.getStatus())
                        && agencies.covers(agency, r.getCity());
        if (!target && !proposed && !market) {
            throw notFound("Demande introuvable");
        }
        return r;
    }

    String requireVerifiedAgency() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Organisation inconnue");
        }
        if (!agencies.isVerified(orgId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "AGENCY_NOT_VERIFIED: la bourse aux mandats est réservée aux agences"
                            + " vérifiées par Atlas.");
        }
        return orgId;
    }

    private void validate(MandateRequestEntity r, ProposalCreate in) {
        if (in == null) {
            throw bad("PROPOSAL_INVALID: proposition vide.");
        }
        String type = in.mandateType() == null ? null : in.mandateType().toUpperCase();
        if (type == null || !AgencyDirectoryService.split(r.getMandateTypes()).contains(type)) {
            throw bad("MANDATE_TYPE_INVALID: le propriétaire accepte " + r.getMandateTypes() + ".");
        }
        if (in.durationMonths() == null || in.durationMonths() < 1 || in.durationMonths() > 12) {
            throw bad("DURATION_INVALID: un mandat dure de 1 à 12 mois (R-PROP-10).");
        }
        String kind = in.commissionKind() == null ? "" : in.commissionKind().toUpperCase();
        BigDecimal value = in.commissionValue();
        if (!COMMISSION_KINDS.contains(kind) || value == null || value.signum() <= 0) {
            throw bad("COMMISSION_INVALID: un pourcentage ou un forfait positif.");
        }
        if ("PERCENT".equals(kind) && value.compareTo(BigDecimal.TEN) > 0) {
            throw bad("COMMISSION_INVALID: 10 % au plus.");
        }
        if (in.commissionPayer() == null || !PAYERS.contains(in.commissionPayer().toUpperCase())) {
            throw bad("PAYER_INVALID: SELLER, BUYER ou SHARED.");
        }
        if (!SERVICES.containsAll(upper(in.services()))) {
            throw bad("SERVICES_INVALID: services inconnus.");
        }
        if (in.estimateMin() != null
                && in.estimateMax() != null
                && in.estimateMin().compareTo(in.estimateMax()) > 0) {
            throw bad("ESTIMATE_INVALID: le minimum dépasse le maximum.");
        }
    }

    void close(MandateRequestEntity r, String status) {
        LocalDateTime now = LocalDateTime.now();
        r.setStatus(status);
        r.setUpdatedAt(now);
        requests.save(r);
        String proposalStatus =
                MREQ_CANCELLED.equals(status)
                        ? MPROP_DECLINED
                        : MandateProposalEntity.MPROP_EXPIRED;
        for (MandateProposalEntity p : proposals.findByRequestIdOrderByCreatedAtAsc(r.getId())) {
            if (ACTIVE_PROPOSAL.contains(p.getStatus())) {
                setStatus(p, proposalStatus);
                notifyAgency(
                        p.getAgencyOrgId(),
                        p.getAgentUserId(),
                        "Demande close",
                        "La demande du propriétaire à " + r.getCity() + " est close.",
                        "/pro/mandats/propositions/" + p.getId());
            }
        }
    }

    void setStatus(MandateProposalEntity p, String status) {
        LocalDateTime now = LocalDateTime.now();
        p.setStatus(status);
        if (MPROP_ACCEPTED.equals(status) || MPROP_DECLINED.equals(status)) {
            p.setDecidedAt(now);
        }
        p.setUpdatedAt(now);
        proposals.save(p);
    }

    private void requireThreadOpen(MandateProposalEntity p) {
        if (MPROP_WITHDRAWN.equals(p.getStatus())
                || MPROP_DECLINED.equals(p.getStatus())
                || MandateProposalEntity.MPROP_EXPIRED.equals(p.getStatus())) {
            throw conflict("THREAD_CLOSED: cette proposition est close.");
        }
    }

    private void save(
            MandateProposalEntity p, String side, String userId, String name, String rawBody) {
        String body = rawBody == null ? "" : rawBody.strip();
        if (body.isEmpty()) {
            throw bad("MESSAGE_EMPTY: le message est vide.");
        }
        if (body.length() > MAX_MESSAGE) {
            throw bad("MESSAGE_TOO_LONG: " + MAX_MESSAGE + " caractères au plus.");
        }
        MarketplaceMessageEntity m = new MarketplaceMessageEntity();
        m.setProposalId(p.getId());
        m.setAuthorSide(side);
        m.setAuthorUserId(userId);
        m.setAuthorName(name);
        m.setBody(body);
        m.setCreatedAt(LocalDateTime.now());
        messages.save(m);
    }

    Thread thread(MandateProposalEntity p) {
        boolean masked = !MPROP_ACCEPTED.equals(p.getStatus());
        List<ThreadMessage> out = new ArrayList<>();
        for (MarketplaceMessageEntity m :
                messages.findByProposalIdOrderByCreatedAtAscIdAsc(p.getId())) {
            out.add(
                    new ThreadMessage(
                            m.getId(),
                            m.getAuthorSide(),
                            m.getAuthorName(),
                            masked ? ContactMasker.mask(m.getBody()) : m.getBody(),
                            m.getCreatedAt()));
        }
        boolean closed =
                Set.of(MPROP_WITHDRAWN, MPROP_DECLINED, MandateProposalEntity.MPROP_EXPIRED)
                        .contains(p.getStatus());
        return new Thread(p.getId(), masked, closed, out);
    }

    private void alertOwner(MandateRequestEntity r, MandateProposalEntity p, String text) {
        alertOwnerPlain(r, text);
        p.setOwnerAlertedAt(LocalDateTime.now());
    }

    private void alertOwnerPlain(MandateRequestEntity r, String text) {
        OrganizationEntity owner = organizations.findByOrgId(r.getOwnerOrgId()).orElse(null);
        if (owner == null || owner.getOwnerPhone() == null) {
            return;
        }
        String param = "d" + r.getId();
        events.publishEvent(
                new PlatformAlert(
                        PlatformAlert.Audience.OWNER,
                        owner.getOwnerPhone(),
                        null,
                        text,
                        "Atlas : du nouveau sur votre demande",
                        param,
                        publicBaseUrl + "/proprietaire/demandes/" + r.getId(),
                        true,
                        false));
    }

    void notifyAgency(
            String agencyOrgId, String userId, String subject, String message, String url) {
        if (userId == null) {
            // Notification in-app = un destinataire. Une demande directe n'en a pas encore :
            // l'onglet « Demandes directes » de la bourse la signale.
            return;
        }
        try {
            notifications.createInAppNotification(agencyOrgId, null, userId, subject, message, url);
        } catch (RuntimeException e) {
            // Une notification manquée ne doit pas annuler l'action.
            org.slf4j.LoggerFactory.getLogger(MandateMarketplaceService.class)
                    .warn("Notification agence non créée : {}", e.getMessage());
        }
    }

    private String city(MandateProposalEntity p) {
        return requests.findById(p.getRequestId()).map(MandateRequestEntity::getCity).orElse("");
    }

    static List<String> upper(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.trim().toUpperCase())
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    private static String text(String s, int max) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String t = s.strip();
        return t.length() > max ? t.substring(0, max) : t;
    }

    static ResponseStatusException bad(String m) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, m);
    }

    static ResponseStatusException conflict(String m) {
        return new ResponseStatusException(HttpStatus.CONFLICT, m);
    }

    static ResponseStatusException notFound(String m) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, m);
    }
}
