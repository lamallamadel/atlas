package com.example.backend.owner;

import com.example.backend.dto.AppointmentCreateRequest;
import com.example.backend.dto.AppointmentResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.LeadConversationEntity;
import com.example.backend.entity.LeadConversationLinkEntity;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.VisitProposalEntity;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.entity.enums.ReminderStrategy;
import com.example.backend.event.PortalLeadCreatedEvent;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LeadConversationLinkRepository;
import com.example.backend.repository.LeadConversationRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.VisitProposalRepository;
import com.example.backend.service.AppointmentService;
import com.example.backend.service.DossierService;
import com.example.backend.util.TenantContext;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Échanges entre le propriétaire et le prospect d'un contact (cas d'usage n°1, UC-P4, Q3) :
 * messages dans la plateforme, créneaux de visite, alerte de l'autre partie à chaque étape.
 *
 * <p>Le prospect n'a pas de compte : il accède à la conversation par un lien envoyé dans l'alerte
 * (jeton aléatoire, empreinte SHA-256 en base, valable {@value #LINK_DAYS} jours). Ce lien ne donne
 * accès qu'à cette conversation ; l'adresse précise du bien et le téléphone du propriétaire n'y
 * figurent jamais.
 */
@Service
public class LeadConversationService {

    static final int LINK_DAYS = 60;
    static final int MAX_BODY = 2000;
    static final int MAX_PROSPECT_MESSAGES_PER_HOUR = 20;
    static final int MAX_SLOTS = 3;

    /** Délai sans nouvelle alerte de message tant que le destinataire n'a pas lu la précédente. */
    static final int ALERT_QUIET_MINUTES = 30;

    private static final Set<String> CLOSED = Set.of("CRM_CLOSED_WON", "CRM_CLOSED_LOST");
    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH'h'mm", Locale.FRENCH);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OwnerContext ownerContext;
    private final OwnerLeadService leadService;
    private final DossierRepository dossiers;
    private final AnnonceRepository annonces;
    private final OrganizationRepository organizations;
    private final LeadConversationRepository conversations;
    private final LeadConversationLinkRepository links;
    private final MessageRepository messages;
    private final VisitProposalRepository proposals;
    private final AppointmentRepository appointments;
    private final AppointmentService appointmentService;
    private final ConsentementRepository consents;
    private final DossierService dossierService;
    private final ApplicationEventPublisher events;
    private final String publicBaseUrl;

    public LeadConversationService(
            OwnerContext ownerContext,
            OwnerLeadService leadService,
            DossierRepository dossiers,
            AnnonceRepository annonces,
            OrganizationRepository organizations,
            LeadConversationRepository conversations,
            LeadConversationLinkRepository links,
            MessageRepository messages,
            VisitProposalRepository proposals,
            AppointmentRepository appointments,
            AppointmentService appointmentService,
            ConsentementRepository consents,
            DossierService dossierService,
            ApplicationEventPublisher events,
            @Value("${atlas.consent.public-base-url:http://localhost:4200}") String publicBaseUrl) {
        this.ownerContext = ownerContext;
        this.leadService = leadService;
        this.dossiers = dossiers;
        this.annonces = annonces;
        this.organizations = organizations;
        this.conversations = conversations;
        this.links = links;
        this.messages = messages;
        this.proposals = proposals;
        this.appointments = appointments;
        this.appointmentService = appointmentService;
        this.consents = consents;
        this.dossierService = dossierService;
        this.events = events;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    // ---------------------------------------------------------------- vues

    public record ThreadMessage(Long id, String author, String body, LocalDateTime at) {}

    public record Slot(Long id, LocalDateTime start, LocalDateTime end) {}

    public record Visit(Long id, LocalDateTime start, LocalDateTime end, String status) {}

    public record OwnerConversation(
            Long leadId,
            String prospectName,
            String prospectPhone,
            String prospectEmail,
            String initialMessage,
            String statusCode,
            String statusLabel,
            List<OwnerLeadService.StatusOption> next,
            String annonceTitle,
            boolean closed,
            List<ThreadMessage> messages,
            List<Slot> proposals,
            List<Visit> visits) {}

    public record ProspectConversation(
            String ownerName,
            String prospectName,
            Long annonceId,
            String annonceTitle,
            String annonceCity,
            String initialMessage,
            boolean closed,
            List<ThreadMessage> messages,
            List<Slot> proposals,
            List<Visit> visits) {}

    public record SlotRequest(LocalDateTime start, LocalDateTime end) {}

    // ---------------------------------------------------------------- côté propriétaire

    @Transactional
    public OwnerConversation ownerView(Long leadId) {
        Dossier dossier = requireOwnerLead(leadId);
        LeadConversationEntity conv = conversation(dossier);
        conv.setOwnerLastReadAt(LocalDateTime.now());
        conversations.save(conv);
        return toOwnerView(dossier);
    }

    @Transactional
    public OwnerConversation ownerSend(Long leadId, String rawBody) {
        Dossier dossier = requireOwnerLead(leadId);
        requireOpen(dossier);
        String body = body(rawBody);
        LeadConversationEntity conv = conversation(dossier);
        saveMessage(dossier, MessageDirection.OUTBOUND, body);
        conv.setOwnerLastReadAt(LocalDateTime.now());
        // Répondre au prospect : le contact passe « En contact ».
        if ("CRM_NEW".equals(dossier.getStatusCode())) {
            moveTo(dossier, "CRM_QUALIFYING");
        }
        if (shouldAlert(conv.getProspectAlertedAt(), conv.getProspectLastReadAt())) {
            alertProspect(
                    dossier,
                    conv,
                    ownerFirstName(dossier)
                            + " vous a répondu au sujet de "
                            + title(dossier)
                            + ".");
        }
        conversations.save(conv);
        return toOwnerView(requireOwnerLead(leadId));
    }

    @Transactional
    public OwnerConversation proposeVisits(Long leadId, List<SlotRequest> slots) {
        Dossier dossier = requireOwnerLead(leadId);
        requireOpen(dossier);
        validateSlots(slots);
        cancelPending(dossier.getId());
        String batch = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        for (SlotRequest s : slots) {
            VisitProposalEntity p = new VisitProposalEntity();
            p.setOrgId(dossier.getOrgId());
            p.setDossierId(dossier.getId());
            p.setBatchId(batch);
            p.setStartTime(s.start());
            p.setEndTime(s.end());
            p.setStatus(VisitProposalEntity.PROPOSED);
            p.setCreatedAt(now);
            p.setUpdatedAt(now);
            proposals.save(p);
        }
        LeadConversationEntity conv = conversation(dossier);
        alertProspect(
                dossier,
                conv,
                ownerFirstName(dossier)
                        + " vous propose "
                        + (slots.size() == 1 ? "un créneau" : slots.size() + " créneaux")
                        + " de visite pour "
                        + title(dossier)
                        + ".");
        conversations.save(conv);
        return toOwnerView(dossier);
    }

    @Transactional
    public OwnerConversation withdrawProposals(Long leadId) {
        Dossier dossier = requireOwnerLead(leadId);
        cancelPending(dossier.getId());
        return toOwnerView(dossier);
    }

    @Transactional
    public OwnerConversation cancelVisit(Long leadId, Long appointmentId) {
        Dossier dossier = requireOwnerLead(leadId);
        AppointmentEntity visit =
                appointments
                        .findById(appointmentId)
                        .filter(a -> a.getDossier().getId().equals(dossier.getId()))
                        .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                        .orElseThrow(() -> notFound("Visite introuvable"));
        visit.setStatus(AppointmentStatus.CANCELLED);
        visit.setUpdatedAt(LocalDateTime.now());
        appointments.save(visit);
        LeadConversationEntity conv = conversation(dossier);
        alertProspect(
                dossier,
                conv,
                ownerFirstName(dossier)
                        + " a annulé la visite du "
                        + WHEN.format(visit.getStartTime())
                        + " pour "
                        + title(dossier)
                        + ".");
        conversations.save(conv);
        return toOwnerView(dossier);
    }

    // ---------------------------------------------------------------- côté prospect

    @Transactional
    public ProspectConversation prospectView(String token) {
        return asProspect(
                token,
                (dossier, conv) -> {
                    conv.setProspectLastReadAt(LocalDateTime.now());
                    conversations.save(conv);
                    return toProspectView(dossier);
                });
    }

    @Transactional
    public ProspectConversation prospectSend(String token, String rawBody) {
        return asProspect(
                token,
                (dossier, conv) -> {
                    requireOpen(dossier);
                    String body = body(rawBody);
                    long lastHour =
                            messages.countByDossier_IdAndChannelAndDirectionAndTimestampAfter(
                                    dossier.getId(),
                                    MessageChannel.IN_APP,
                                    MessageDirection.INBOUND,
                                    LocalDateTime.now().minusHours(1));
                    if (lastHour >= MAX_PROSPECT_MESSAGES_PER_HOUR) {
                        throw new ResponseStatusException(
                                HttpStatus.TOO_MANY_REQUESTS,
                                "TOO_MANY_MESSAGES: patientez un peu avant d'écrire à nouveau.");
                    }
                    saveMessage(dossier, MessageDirection.INBOUND, body);
                    conv.setProspectLastReadAt(LocalDateTime.now());
                    if (shouldAlert(conv.getOwnerAlertedAt(), conv.getOwnerLastReadAt())) {
                        alertOwner(
                                dossier,
                                conv,
                                prospectName(dossier)
                                        + " vous a écrit au sujet de "
                                        + title(dossier)
                                        + ".");
                    }
                    conversations.save(conv);
                    return toProspectView(dossier);
                });
    }

    @Transactional
    public ProspectConversation prospectAccept(String token, Long proposalId) {
        return asProspect(
                token,
                (dossier, conv) -> {
                    requireOpen(dossier);
                    VisitProposalEntity chosen =
                            proposals
                                    .findById(proposalId)
                                    .filter(p -> p.getDossierId().equals(dossier.getId()))
                                    .filter(p -> VisitProposalEntity.PROPOSED.equals(p.getStatus()))
                                    .orElseThrow(
                                            () ->
                                                    new ResponseStatusException(
                                                            HttpStatus.CONFLICT,
                                                            "SLOT_UNAVAILABLE: ce créneau n'est"
                                                                    + " plus proposé."));
                    if (!chosen.getStartTime().isAfter(LocalDateTime.now())) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT, "SLOT_PAST: ce créneau est déjà passé.");
                    }
                    Long appointmentId = createVisit(dossier, chosen);
                    LocalDateTime now = LocalDateTime.now();
                    for (VisitProposalEntity p :
                            proposals.findByDossierIdAndStatus(
                                    dossier.getId(), VisitProposalEntity.PROPOSED)) {
                        boolean isChosen = p.getId().equals(chosen.getId());
                        p.setStatus(
                                isChosen
                                        ? VisitProposalEntity.ACCEPTED
                                        : VisitProposalEntity.CANCELLED);
                        if (isChosen) {
                            p.setAppointmentId(appointmentId);
                        }
                        p.setUpdatedAt(now);
                        proposals.save(p);
                    }
                    if (allowed(dossier, "CRM_VISIT_PLANNED")) {
                        moveTo(dossier, "CRM_VISIT_PLANNED");
                    }
                    alertOwner(
                            dossier,
                            conv,
                            prospectName(dossier)
                                    + " a choisi la visite du "
                                    + WHEN.format(chosen.getStartTime())
                                    + " pour "
                                    + title(dossier)
                                    + ".");
                    conversations.save(conv);
                    return toProspectView(dossiers.findById(dossier.getId()).orElseThrow());
                });
    }

    // ---------------------------------------------------------------- nouveau contact

    /** Un contact arrive sur l'annonce d'un propriétaire : on le prévient (UC-P4, point 2). */
    @EventListener
    public void onPortalLead(PortalLeadCreatedEvent event) {
        OrganizationEntity org = organizations.findByOrgId(event.orgId()).orElse(null);
        if (org == null || !org.isOwner()) {
            return;
        }
        dossiers.findById(event.dossierId())
                .ifPresent(
                        dossier -> {
                            LeadConversationEntity conv = conversation(dossier);
                            alertOwner(
                                    dossier,
                                    conv,
                                    "Nouveau contact pour "
                                            + title(dossier)
                                            + " : "
                                            + prospectName(dossier)
                                            + ".");
                            conversations.save(conv);
                        });
    }

    // ---------------------------------------------------------------- interne

    private interface ProspectAction<T> {
        T apply(Dossier dossier, LeadConversationEntity conv);
    }

    /** Résout le lien, puis travaille dans l'organisation du contact (le portail n'en a pas). */
    private <T> T asProspect(String token, ProspectAction<T> action) {
        LeadConversationLinkEntity link = resolve(token);
        LeadConversationEntity conv =
                conversations
                        .findById(link.getConversationId())
                        .orElseThrow(LeadConversationService::linkInvalid);
        Dossier dossier =
                dossiers.findById(conv.getDossierId())
                        .orElseThrow(LeadConversationService::linkInvalid);
        link.setLastUsedAt(LocalDateTime.now());
        links.save(link);
        return withOrg(dossier.getOrgId(), () -> action.apply(dossier, conv));
    }

    private LeadConversationLinkEntity resolve(String token) {
        if (token == null || token.isBlank() || token.length() > 128) {
            throw linkInvalid();
        }
        return links.findByTokenHash(sha256(token.trim()))
                .filter(l -> l.getRevokedAt() == null)
                .filter(l -> l.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(LeadConversationService::linkInvalid);
    }

    private String issueLink(LeadConversationEntity conv) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LeadConversationLinkEntity link = new LeadConversationLinkEntity();
        link.setConversationId(conv.getId());
        link.setTokenHash(sha256(token));
        LocalDateTime now = LocalDateTime.now();
        link.setCreatedAt(now);
        link.setExpiresAt(now.plusDays(LINK_DAYS));
        links.save(link);
        return token;
    }

    private void alertProspect(Dossier dossier, LeadConversationEntity conv, String text) {
        boolean whatsapp = consentGranted(dossier.getId(), ConsentementChannel.WHATSAPP);
        boolean phone = whatsapp || consentGranted(dossier.getId(), ConsentementChannel.PHONE);
        boolean email = consentGranted(dossier.getId(), ConsentementChannel.EMAIL);
        if (!phone && !email) {
            return;
        }
        String token = issueLink(conv);
        events.publishEvent(
                new PlatformAlert(
                        PlatformAlert.Audience.PROSPECT,
                        phone ? dossier.getLeadPhone() : null,
                        email ? dossier.getLeadEmail() : null,
                        text,
                        "Atlas : nouvelle réponse au sujet de votre demande",
                        token,
                        publicBaseUrl + "/contact/" + token,
                        whatsapp,
                        email));
        conv.setProspectAlertedAt(LocalDateTime.now());
    }

    private void alertOwner(Dossier dossier, LeadConversationEntity conv, String text) {
        OrganizationEntity org = organizations.findByOrgId(dossier.getOrgId()).orElse(null);
        if (org == null || org.getOwnerPhone() == null) {
            return;
        }
        String id = String.valueOf(dossier.getId());
        // Modèle WhatsApp propriétaire : bouton <site>/p/{{1}} ; « c<id> » ouvre le contact.
        events.publishEvent(
                new PlatformAlert(
                        PlatformAlert.Audience.OWNER,
                        org.getOwnerPhone(),
                        null,
                        text,
                        "Atlas : du nouveau sur votre annonce",
                        "c" + id,
                        publicBaseUrl + "/proprietaire/contacts/" + id,
                        true,
                        false));
        conv.setOwnerAlertedAt(LocalDateTime.now());
    }

    /** Alerte de message : pas de nouvelle alerte tant que la précédente n'a pas été lue. */
    private static boolean shouldAlert(LocalDateTime alertedAt, LocalDateTime readAt) {
        if (alertedAt == null) {
            return true;
        }
        if (readAt != null && readAt.isAfter(alertedAt)) {
            return true;
        }
        return alertedAt.isBefore(LocalDateTime.now().minusMinutes(ALERT_QUIET_MINUTES));
    }

    private boolean consentGranted(Long dossierId, ConsentementChannel channel) {
        List<ConsentementEntity> list =
                consents.findByDossierIdAndChannelAndConsentTypeOrderByUpdatedAtDesc(
                        dossierId, channel, ConsentementType.TRANSACTIONNEL);
        if (list.isEmpty()) {
            return false;
        }
        ConsentementEntity latest = list.get(0);
        return latest.getStatus() == ConsentementStatus.GRANTED
                && (latest.getExpiresAt() == null
                        || latest.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    private Long createVisit(Dossier dossier, VisitProposalEntity slot) {
        AppointmentCreateRequest req = new AppointmentCreateRequest();
        req.setDossierId(dossier.getId());
        req.setStartTime(slot.getStartTime());
        req.setEndTime(slot.getEndTime());
        req.setStatus(AppointmentStatus.SCHEDULED);
        req.setNotes("Visite choisie par le prospect sur la plateforme.");
        req.setReminderStrategy(ReminderStrategy.MINIMAL);
        AppointmentResponse created = appointmentService.create(req);
        // Les rappels automatiques passent par les fournisseurs de l'organisation, qu'un
        // propriétaire n'a pas : on les coupe (rappel de visite propriétaire : à venir).
        appointments
                .findById(created.getId())
                .ifPresent(
                        a -> {
                            a.setReminderSent(true);
                            appointments.save(a);
                        });
        return created.getId();
    }

    private void cancelPending(Long dossierId) {
        LocalDateTime now = LocalDateTime.now();
        for (VisitProposalEntity p :
                proposals.findByDossierIdAndStatus(dossierId, VisitProposalEntity.PROPOSED)) {
            p.setStatus(VisitProposalEntity.CANCELLED);
            p.setUpdatedAt(now);
            proposals.save(p);
        }
    }

    private static void validateSlots(List<SlotRequest> slots) {
        if (slots == null || slots.isEmpty() || slots.size() > MAX_SLOTS) {
            throw bad("SLOTS_INVALID: proposez entre 1 et " + MAX_SLOTS + " créneaux.");
        }
        LocalDateTime now = LocalDateTime.now();
        for (SlotRequest s : slots) {
            if (s == null || s.start() == null || s.end() == null || !s.end().isAfter(s.start())) {
                throw bad("SLOTS_INVALID: chaque créneau a un début et une fin après le début.");
            }
            if (s.start().isBefore(now.plusMinutes(30))) {
                throw bad("SLOTS_INVALID: un créneau commence au plus tôt dans 30 minutes.");
            }
            if (s.start().isAfter(now.plusDays(60))) {
                throw bad("SLOTS_INVALID: un créneau commence au plus tard dans 60 jours.");
            }
            if (s.end().isAfter(s.start().plusHours(4))) {
                throw bad("SLOTS_INVALID: une visite dure 4 heures au plus.");
            }
        }
    }

    private void saveMessage(Dossier dossier, MessageDirection direction, String body) {
        MessageEntity m = new MessageEntity();
        m.setOrgId(dossier.getOrgId());
        m.setDossier(dossier);
        m.setDirection(direction);
        m.setChannel(MessageChannel.IN_APP);
        m.setContent(body);
        LocalDateTime now = LocalDateTime.now();
        m.setTimestamp(now);
        m.setCreatedAt(now);
        m.setUpdatedAt(now);
        messages.save(m);
    }

    private LeadConversationEntity conversation(Dossier dossier) {
        return conversations
                .findByDossierId(dossier.getId())
                .orElseGet(
                        () -> {
                            LeadConversationEntity c = new LeadConversationEntity();
                            c.setOrgId(dossier.getOrgId());
                            c.setDossierId(dossier.getId());
                            return conversations.save(c);
                        });
    }

    private Dossier requireOwnerLead(Long id) {
        String orgId = ownerContext.requireOwnerOrg().getOrgId();
        return dossiers.findById(id)
                .filter(d -> orgId.equals(d.getOrgId()))
                .orElseThrow(() -> notFound("Contact introuvable"));
    }

    private static void requireOpen(Dossier dossier) {
        if (CLOSED.contains(dossier.getStatusCode())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "LEAD_CLOSED: cette conversation est close.");
        }
    }

    private boolean allowed(Dossier dossier, String code) {
        return dossierService.transitions(dossier.getId()).transitions().stream()
                .anyMatch(t -> code.equals(t.statusCode()));
    }

    private void moveTo(Dossier dossier, String code) {
        DossierStatusPatchRequest patch = new DossierStatusPatchRequest();
        patch.setStatusCode(code);
        dossierService.patchStatus(dossier.getId(), patch);
    }

    private OwnerConversation toOwnerView(Dossier dossier) {
        OwnerLeadService.OwnerLead lead = leadService.view(dossier.getId());
        return new OwnerConversation(
                dossier.getId(),
                dossier.getLeadName(),
                dossier.getLeadPhone(),
                dossier.getLeadEmail(),
                dossier.getNotes(),
                lead.statusCode(),
                lead.statusLabel(),
                lead.next(),
                annonce(dossier).map(Annonce::getTitle).orElse(null),
                CLOSED.contains(lead.statusCode()),
                thread(dossier.getId(), MessageDirection.OUTBOUND),
                pendingSlots(dossier.getId()),
                visits(dossier.getId()));
    }

    private ProspectConversation toProspectView(Dossier dossier) {
        Optional<Annonce> annonce = annonce(dossier);
        return new ProspectConversation(
                ownerFirstName(dossier),
                dossier.getLeadName(),
                annonce.map(Annonce::getId).orElse(null),
                annonce.map(Annonce::getTitle).orElse(null),
                annonce.map(Annonce::getCity).orElse(null),
                dossier.getNotes(),
                CLOSED.contains(dossier.getStatusCode()),
                thread(dossier.getId(), MessageDirection.INBOUND),
                pendingSlots(dossier.getId()),
                visits(dossier.getId()));
    }

    /** {@code mine} : le sens des messages de celui qui regarde (affichés comme « ME »). */
    private List<ThreadMessage> thread(Long dossierId, MessageDirection mine) {
        List<ThreadMessage> out = new ArrayList<>();
        for (MessageEntity m :
                messages.findByDossier_IdAndChannelOrderByTimestampAscIdAsc(
                        dossierId, MessageChannel.IN_APP)) {
            String author = m.getDirection() == MessageDirection.OUTBOUND ? "OWNER" : "PROSPECT";
            out.add(new ThreadMessage(m.getId(), author, m.getContent(), m.getTimestamp()));
        }
        return out;
    }

    private List<Slot> pendingSlots(Long dossierId) {
        LocalDateTime now = LocalDateTime.now();
        return proposals.findByDossierIdOrderByStartTimeAsc(dossierId).stream()
                .filter(p -> VisitProposalEntity.PROPOSED.equals(p.getStatus()))
                .filter(p -> p.getStartTime().isAfter(now))
                .map(p -> new Slot(p.getId(), p.getStartTime(), p.getEndTime()))
                .toList();
    }

    private List<Visit> visits(Long dossierId) {
        return appointments.findByDossier_Id(dossierId).stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .sorted(java.util.Comparator.comparing(AppointmentEntity::getStartTime))
                .map(
                        a ->
                                new Visit(
                                        a.getId(),
                                        a.getStartTime(),
                                        a.getEndTime(),
                                        a.getStatus().name()))
                .toList();
    }

    private Optional<Annonce> annonce(Dossier dossier) {
        return dossier.getAnnonceId() == null
                ? Optional.empty()
                : annonces.findById(dossier.getAnnonceId());
    }

    private String title(Dossier dossier) {
        String t = annonce(dossier).map(Annonce::getTitle).orElse("votre annonce");
        return "« " + (t.length() > 60 ? t.substring(0, 57) + "…" : t) + " »";
    }

    private String ownerFirstName(Dossier dossier) {
        String name =
                organizations
                        .findByOrgId(dossier.getOrgId())
                        .map(OrganizationEntity::getDisplayName)
                        .orElse(null);
        if (name == null || name.isBlank()) {
            return "Le propriétaire";
        }
        return name.trim().split("\\s+")[0];
    }

    private static String prospectName(Dossier dossier) {
        String name = dossier.getLeadName();
        return name == null || name.isBlank() ? "Un prospect" : name.trim();
    }

    private static String body(String raw) {
        String body = raw == null ? "" : raw.strip();
        if (body.isEmpty()) {
            throw bad("MESSAGE_EMPTY: le message est vide.");
        }
        if (body.length() > MAX_BODY) {
            throw bad("MESSAGE_TOO_LONG: " + MAX_BODY + " caractères au plus.");
        }
        return body;
    }

    private static <T> T withOrg(String orgId, Supplier<T> work) {
        String previous = TenantContext.getOrgId();
        TenantContext.setOrgId(orgId);
        try {
            return work.get();
        } finally {
            if (previous != null) {
                TenantContext.setOrgId(previous);
            } else {
                TenantContext.clear();
            }
        }
    }

    static String sha256(String value) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private static ResponseStatusException linkInvalid() {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "LINK_INVALID: ce lien n'est plus valable. Utilisez le lien du dernier message"
                        + " reçu.");
    }
}
