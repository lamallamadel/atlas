package com.example.backend.service;

import com.example.backend.brain.BrainClientService;
import com.example.backend.dto.AppointmentCreateRequest;
import com.example.backend.dto.AppointmentResponse;
import com.example.backend.dto.VisitPlanRequest;
import com.example.backend.dto.VisitPlanResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * Réponse d'un client à une proposition de bien : le brain lit son intention (visite, intérêt,
 * négociation…) et ses disponibilités ; Atlas cherche un créneau libre dans l'agenda de l'agent et
 * le prévient. L'agent planifie ensuite la visite en un clic (rien n'est envoyé au client
 * automatiquement).
 */
@Service
public class PitchReplyService {

    private static final Logger log = LoggerFactory.getLogger(PitchReplyService.class);

    public static final String VISITE = "VISITE";
    public static final String AUTRE = "AUTRE";
    static final Set<String> INTENTS =
            Set.of(VISITE, "INTERESSE", "NEGOCIATION", "QUESTION", "PAS_INTERESSE", AUTRE);

    /** Une réponse plus de N jours après la proposition ne s'y rapporte plus. */
    static final int REPLY_WINDOW_DAYS = 14;

    static final LocalTime DAY_START = LocalTime.of(9, 0);
    static final LocalTime DAY_END = LocalTime.of(19, 0);

    /** Délai minimal avant une visite proposée. */
    static final int MIN_NOTICE_HOURS = 2;

    private final AnnonceDossierMatchRepository matchRepository;
    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final AppointmentRepository appointmentRepository;
    private final BrainClientService brainClientService;
    private final NotificationService notificationService;
    private final AppointmentService appointmentService;
    private final int visitMinutes;
    private final TransactionTemplate newTransaction;

    public PitchReplyService(
            AnnonceDossierMatchRepository matchRepository,
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            AppointmentRepository appointmentRepository,
            BrainClientService brainClientService,
            @Nullable NotificationService notificationService,
            AppointmentService appointmentService,
            @Value("${atlas.visit.duration-minutes:45}") int visitMinutes,
            PlatformTransactionManager transactionManager) {
        this.matchRepository = matchRepository;
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.appointmentRepository = appointmentRepository;
        this.brainClientService = brainClientService;
        this.notificationService = notificationService;
        this.appointmentService = appointmentService;
        this.visitMinutes = visitMinutes;
        this.newTransaction = new TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ---------- réception d'une réponse ----------

    /** Appelé après l'enregistrement d'un message entrant (WhatsApp). */
    @Async("brainTaskExecutor")
    public void onInboundMessageAsync(
            String orgId,
            Long dossierId,
            Long messageId,
            String content,
            LocalDateTime receivedAt) {
        try {
            newTransaction.executeWithoutResult(
                    s -> onInboundMessage(orgId, dossierId, messageId, content, receivedAt));
        } catch (Exception e) {
            log.warn("Analyse de la réponse du dossier {} échouée : {}", dossierId, e.getMessage());
        }
    }

    /**
     * @return la correspondance mise à jour, vide si le message ne répond à aucune proposition
     */
    @Transactional
    public Optional<AnnonceDossierMatch> onInboundMessage(
            String orgId,
            Long dossierId,
            Long messageId,
            String content,
            LocalDateTime receivedAt) {
        if (orgId == null || dossierId == null || content == null || content.isBlank()) {
            return Optional.empty();
        }
        // Tâche de fond : l'organisation n'est pas dans le contexte, or le journal d'audit
        // (déclenché par la notification) en a besoin.
        boolean ownTenant = TenantContext.getOrgId() == null;
        if (ownTenant) {
            TenantContext.setOrgId(orgId);
        }
        try {
            return handleReply(orgId, dossierId, messageId, content, receivedAt);
        } finally {
            if (ownTenant) {
                TenantContext.clear();
            }
        }
    }

    private Optional<AnnonceDossierMatch> handleReply(
            String orgId,
            Long dossierId,
            Long messageId,
            String content,
            LocalDateTime receivedAt) {
        LocalDateTime at = receivedAt != null ? receivedAt : LocalDateTime.now();
        Optional<AnnonceDossierMatch> found =
                matchRepository
                        .findFirstByOrgIdAndDossierIdAndPitchedAtIsNotNullOrderByPitchedAtDesc(
                                orgId, dossierId)
                        .filter(m -> !m.getPitchedAt().isAfter(at))
                        .filter(m -> m.getPitchedAt().isAfter(at.minusDays(REPLY_WINDOW_DAYS)));
        if (found.isEmpty()) {
            return Optional.empty();
        }
        AnnonceDossierMatch match = found.get();
        Annonce annonce = annonceRepository.findById(match.getAnnonceId()).orElse(null);
        Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        if (annonce == null || dossier == null) {
            return Optional.empty();
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", content.length() > 4000 ? content.substring(0, 4000) : content);
        body.put("recu_le", at.truncatedTo(ChronoUnit.SECONDS).toString());
        body.put("titre_bien", annonce.getTitle());
        Optional<Map<String, Object>> analysed = brainClientService.analyseReply(body);
        if (analysed.isEmpty()) {
            log.info("Réponse du dossier {} non analysée (brain indisponible)", dossierId);
            return Optional.empty();
        }
        String intent = String.valueOf(analysed.get().getOrDefault("intention", AUTRE));
        if (!INTENTS.contains(intent)) {
            intent = AUTRE;
        }
        // « Merci » après « samedi 10h » ne doit pas effacer la demande de visite
        if (AUTRE.equals(intent) && match.getReplyIntent() != null) {
            return Optional.of(match);
        }

        match.closeFollowUp(
                at); // le client a répondu : la relance « silence » n'a plus lieu d'être
        match.setReplyIntent(intent);
        match.setReplyExcerpt(excerpt(content));
        match.setReplyAt(at);
        match.setReplyMessageId(messageId);
        if (VISITE.equals(intent) && match.getVisitAppointmentId() == null) {
            List<LocalDateTime[]> windows = windows(analysed.get().get("disponibilites"));
            Optional<LocalDateTime[]> slot =
                    findSlot(windows, agentOf(dossier), LocalDateTime.now(), visitMinutes);
            match.setProposedStart(slot.map(x -> x[0]).orElse(null));
            match.setProposedEnd(slot.map(x -> x[1]).orElse(null));
        }
        matchRepository.save(match);
        notifyAgent(annonce, dossier, match);
        return Optional.of(match);
    }

    private static String excerpt(String content) {
        String c = content.strip().replaceAll("\\s+", " ");
        return c.length() > 300 ? c.substring(0, 297) + "…" : c;
    }

    private static String agentOf(Dossier d) {
        return d.getCreatedBy();
    }

    @SuppressWarnings("unchecked")
    static List<LocalDateTime[]> windows(Object raw) {
        List<LocalDateTime[]> out = new ArrayList<>();
        if (raw instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m) {
                    try {
                        LocalDateTime start = LocalDateTime.parse(String.valueOf(m.get("debut")));
                        LocalDateTime end = LocalDateTime.parse(String.valueOf(m.get("fin")));
                        if (end.isAfter(start)) {
                            out.add(new LocalDateTime[] {start, end});
                        }
                    } catch (RuntimeException e) {
                        // créneau illisible : ignoré
                    }
                }
            }
        }
        return out;
    }

    // ---------- créneau ----------

    /**
     * Premier créneau libre pour l'agent : dans les disponibilités du client si elles existent,
     * sinon les 7 prochains jours (lundi–samedi). Pas de 30 min, de 9 h à 19 h, au moins 2 h à
     * l'avance.
     */
    Optional<LocalDateTime[]> findSlot(
            List<LocalDateTime[]> clientWindows, String agent, LocalDateTime now, int minutes) {
        LocalDateTime earliest = roundUp(now.plusHours(MIN_NOTICE_HOURS));
        List<LocalDateTime[]> windows = new ArrayList<>(clientWindows);
        boolean fromClient = !windows.isEmpty();
        if (!fromClient) {
            for (int i = 0; i < 8; i++) {
                LocalDateTime day = now.toLocalDate().plusDays(i).atStartOfDay();
                if (day.getDayOfWeek() != DayOfWeek.SUNDAY) {
                    windows.add(new LocalDateTime[] {day.with(DAY_START), day.with(DAY_END)});
                }
            }
        }
        for (LocalDateTime[] w : windows) {
            LocalDateTime start = w[0].isBefore(earliest) ? earliest : roundUp(w[0]);
            LocalDateTime dayStart = start.toLocalDate().atTime(DAY_START);
            if (start.isBefore(dayStart)) {
                start = dayStart;
            }
            while (!start.plusMinutes(minutes).isAfter(w[1])
                    && !start.plusMinutes(minutes).toLocalTime().isAfter(DAY_END)
                    && start.toLocalDate().equals(w[0].toLocalDate())) {
                LocalDateTime end = start.plusMinutes(minutes);
                if (isFree(agent, start, end)) {
                    return Optional.of(new LocalDateTime[] {start, end});
                }
                start = start.plusMinutes(30);
            }
        }
        return Optional.empty();
    }

    private boolean isFree(String agent, LocalDateTime start, LocalDateTime end) {
        if (agent == null || agent.isBlank()) {
            return true;
        }
        List<AppointmentEntity> overlapping =
                appointmentRepository.findOverlappingAppointments(agent, start, end, -1L);
        return overlapping.stream().noneMatch(a -> a.getStatus() != AppointmentStatus.CANCELLED);
    }

    static LocalDateTime roundUp(LocalDateTime t) {
        LocalDateTime base = t.truncatedTo(ChronoUnit.HOURS);
        int min = t.getMinute();
        if (min == 0 && t.getSecond() == 0 && t.getNano() == 0) {
            return base;
        }
        return min <= 30 && !(min == 30 && (t.getSecond() > 0 || t.getNano() > 0))
                ? base.plusMinutes(30)
                : base.plusHours(1);
    }

    // ---------- notification ----------

    private static final DateTimeFormatter SLOT =
            DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH'h'mm", Locale.FRENCH);

    static String intentTitle(String intent, String who) {
        return switch (intent) {
            case VISITE -> who + " veut visiter";
            case "INTERESSE" -> who + " est intéressé(e)";
            case "NEGOCIATION" -> who + " discute le prix";
            case "QUESTION" -> who + " pose une question";
            case "PAS_INTERESSE" -> who + " n'est pas intéressé(e)";
            default -> who + " a répondu";
        };
    }

    private void notifyAgent(Annonce annonce, Dossier dossier, AnnonceDossierMatch m) {
        if (notificationService == null) {
            return;
        }
        String who = dossier.getLeadName() != null ? dossier.getLeadName() : "Le client";
        StringBuilder msg =
                new StringBuilder("Réponse à la proposition « ")
                        .append(annonce.getTitle() != null ? annonce.getTitle() : "annonce")
                        .append(" » : « ")
                        .append(m.getReplyExcerpt())
                        .append(" »");
        if (m.getProposedStart() != null) {
            msg.append(". Créneau libre proposé : ")
                    .append(m.getProposedStart().format(SLOT))
                    .append('.');
        } else if (VISITE.equals(m.getReplyIntent())) {
            msg.append(". Aucun créneau libre trouvé : choisissez-en un.");
        }
        try {
            notificationService.createInAppNotification(
                    annonce.getOrgId(),
                    dossier.getId(),
                    agentOf(dossier) != null ? agentOf(dossier) : "equipe",
                    intentTitle(m.getReplyIntent(), who) + " — " + annonce.getTitle(),
                    msg.toString(),
                    "/annonces/" + annonce.getId());
        } catch (Exception e) {
            log.warn("Notification de réponse non créée : {}", e.getMessage());
        }
    }

    // ---------- planification par l'agent ----------

    @Transactional
    public VisitPlanResponse planVisit(Long annonceId, Long matchId, VisitPlanRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        Annonce annonce =
                annonceRepository
                        .findById(annonceId)
                        .filter(a -> orgId.equals(a.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + annonceId));
        AnnonceDossierMatch match =
                matchRepository
                        .findById(matchId)
                        .filter(
                                x ->
                                        annonceId.equals(x.getAnnonceId())
                                                && orgId.equals(x.getOrgId()))
                        .orElseThrow(
                                () -> new EntityNotFoundException("Match not found: " + matchId));
        if (match.getVisitAppointmentId() != null
                && appointmentRepository.existsById(match.getVisitAppointmentId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Une visite est déjà planifiée pour cet acheteur.");
        }
        if (!request.endTime().isAfter(request.startTime())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La fin de la visite doit suivre son début.");
        }
        if (request.startTime().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La visite ne peut pas être dans le passé.");
        }

        AppointmentCreateRequest create = new AppointmentCreateRequest();
        create.setDossierId(match.getDossierId());
        create.setStartTime(request.startTime());
        create.setEndTime(request.endTime());
        create.setLocation(
                request.location() != null && !request.location().isBlank()
                        ? request.location()
                        : location(annonce));
        create.setAssignedTo(currentUser());
        create.setStatus(AppointmentStatus.SCHEDULED);
        create.setNotes(
                "Visite : "
                        + (annonce.getTitle() != null
                                ? annonce.getTitle()
                                : "annonce #" + annonce.getId())
                        + (match.getReplyExcerpt() != null
                                ? "\nRéponse du client : « " + match.getReplyExcerpt() + " »"
                                : "")
                        + (request.notes() != null && !request.notes().isBlank()
                                ? "\n" + request.notes()
                                : ""));
        AppointmentResponse created = appointmentService.create(create);

        match.setVisitAppointmentId(created.getId());
        match.closeFollowUp(LocalDateTime.now());
        matchRepository.save(match);
        return new VisitPlanResponse(
                created.getId(),
                created.getStartTime(),
                created.getEndTime(),
                created.getWarnings() != null ? created.getWarnings() : List.of());
    }

    private static String location(Annonce a) {
        String addr = a.getAddress();
        if (addr != null && !addr.isBlank()) {
            return a.getCity() != null && !addr.contains(a.getCity())
                    ? addr + ", " + a.getCity()
                    : addr;
        }
        return a.getCity();
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() ? auth.getName() : null;
    }
}
