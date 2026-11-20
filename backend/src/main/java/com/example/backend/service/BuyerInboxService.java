package com.example.backend.service;

import com.example.backend.dto.BuyerInboxItem;
import com.example.backend.dto.BuyerInboxResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Page « Mes relances » : toutes annonces confondues, ce qui attend l'agent, par ordre d'urgence.
 * Chaque proposition n'apparaît que dans une section, la plus urgente :
 *
 * <ol>
 *   <li>FOLLOW_UP : relance en attente (client sans réponse depuis 24 h, ou silencieux) ;
 *   <li>VISIT_TO_PLAN : le client veut visiter, aucune visite planifiée ;
 *   <li>RECENT_REPLY : réponse des 7 derniers jours (intérêt, prix, question) ;
 *   <li>UPCOMING_VISIT : visite planifiée à venir (30 jours).
 * </ol>
 */
@Service
public class BuyerInboxService {

    public static final String FOLLOW_UP = "FOLLOW_UP";
    public static final String VISIT_TO_PLAN = "VISIT_TO_PLAN";
    public static final String RECENT_REPLY = "RECENT_REPLY";
    public static final String UPCOMING_VISIT = "UPCOMING_VISIT";
    static final List<String> SECTIONS =
            List.of(FOLLOW_UP, VISIT_TO_PLAN, RECENT_REPLY, UPCOMING_VISIT);

    static final Set<String> REPLY_INTENTS = Set.of("INTERESSE", "NEGOCIATION", "QUESTION");
    static final int LOOKBACK_DAYS = 45;
    static final int RECENT_REPLY_DAYS = 7;
    static final int UPCOMING_DAYS = 30;
    static final int MAX_ROWS = 500;

    private final AnnonceDossierMatchRepository matchRepository;
    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final AppointmentRepository appointmentRepository;
    private final OutboundMessageRepository outboundMessageRepository;
    private final MessageRepository messageRepository;

    public BuyerInboxService(
            AnnonceDossierMatchRepository matchRepository,
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            AppointmentRepository appointmentRepository,
            OutboundMessageRepository outboundMessageRepository,
            MessageRepository messageRepository) {
        this.matchRepository = matchRepository;
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.appointmentRepository = appointmentRepository;
        this.outboundMessageRepository = outboundMessageRepository;
        this.messageRepository = messageRepository;
    }

    /**
     * @param agent si non nul, seulement les dossiers créés par cet agent (« mes clients »)
     */
    @Transactional(readOnly = true)
    public BuyerInboxResponse inbox(String agent, LocalDateTime now) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        List<AnnonceDossierMatch> matches =
                matchRepository.findInbox(
                        orgId, now.minusDays(LOOKBACK_DAYS), PageRequest.of(0, MAX_ROWS));
        Map<Long, Dossier> dossiers =
                dossierRepository
                        .findAllById(
                                matches.stream().map(AnnonceDossierMatch::getDossierId).toList())
                        .stream()
                        .filter(d -> orgId.equals(d.getOrgId()))
                        .collect(Collectors.toMap(Dossier::getId, Function.identity()));
        Map<Long, Annonce> annonces =
                annonceRepository
                        .findAllById(
                                matches.stream().map(AnnonceDossierMatch::getAnnonceId).toList())
                        .stream()
                        .filter(a -> orgId.equals(a.getOrgId()))
                        .collect(Collectors.toMap(Annonce::getId, Function.identity()));
        Map<Long, AppointmentEntity> visits =
                appointmentRepository
                        .findAllById(
                                matches.stream()
                                        .map(AnnonceDossierMatch::getVisitAppointmentId)
                                        .filter(Objects::nonNull)
                                        .toList())
                        .stream()
                        .collect(Collectors.toMap(AppointmentEntity::getId, Function.identity()));

        List<BuyerInboxItem> items = new ArrayList<>();
        for (AnnonceDossierMatch m : matches) {
            Dossier d = dossiers.get(m.getDossierId());
            Annonce a = annonces.get(m.getAnnonceId());
            if (d == null || a == null) {
                continue;
            }
            if (agent != null && !agent.equals(d.getCreatedBy())) {
                continue;
            }
            AppointmentEntity visit =
                    m.getVisitAppointmentId() != null
                            ? visits.get(m.getVisitAppointmentId())
                            : null;
            String section = section(m, visit, now);
            if (section == null) {
                continue;
            }
            boolean answered = RECENT_REPLY.equals(section) && answeredSince(m);
            items.add(
                    new BuyerInboxItem(
                            m.getId(),
                            section,
                            a.getId(),
                            a.getTitle(),
                            a.getCity(),
                            d.getId(),
                            d.getLeadName(),
                            m.getScore(),
                            m.getReplyIntent(),
                            m.getReplyExcerpt(),
                            m.getReplyAt(),
                            m.isFollowUpPending() ? m.getFollowUpKind() : null,
                            m.isFollowUpPending() ? m.getFollowUpNotifiedAt() : null,
                            m.getProposedStart(),
                            visit != null ? visit.getId() : null,
                            visit != null ? visit.getStartTime() : null,
                            m.getPitchedAt(),
                            m.getPitchChannel(),
                            answered));
        }
        items.sort(URGENCY);
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String s : SECTIONS) {
            counts.put(s, (int) items.stream().filter(i -> s.equals(i.section())).count());
        }
        return new BuyerInboxResponse(items, counts);
    }

    static String section(AnnonceDossierMatch m, AppointmentEntity visit, LocalDateTime now) {
        if (m.isFollowUpPending()) {
            return FOLLOW_UP;
        }
        boolean visitActive =
                visit != null
                        && visit.getStatus() != AppointmentStatus.CANCELLED
                        && visit.getStatus() != AppointmentStatus.COMPLETED;
        boolean visitCancelled = visit != null && visit.getStatus() == AppointmentStatus.CANCELLED;
        if ("VISITE".equals(m.getReplyIntent()) && (visit == null || visitCancelled)) {
            return VISIT_TO_PLAN;
        }
        if (visitActive
                && visit.getStartTime() != null
                && visit.getStartTime().isAfter(now.minusHours(1))
                && visit.getStartTime().isBefore(now.plusDays(UPCOMING_DAYS))) {
            return UPCOMING_VISIT;
        }
        if (m.getReplyIntent() != null
                && REPLY_INTENTS.contains(m.getReplyIntent())
                && m.getReplyAt() != null
                && m.getReplyAt().isAfter(now.minusDays(RECENT_REPLY_DAYS))
                && visit == null) {
            return RECENT_REPLY;
        }
        return null;
    }

    private boolean answeredSince(AnnonceDossierMatch m) {
        return m.getReplyAt() != null
                && (outboundMessageRepository.existsByDossierIdAndCreatedAtAfter(
                                m.getDossierId(), m.getReplyAt())
                        || messageRepository.existsByDossier_IdAndDirectionAndTimestampAfter(
                                m.getDossierId(), MessageDirection.OUTBOUND, m.getReplyAt()));
    }

    /**
     * Section d'abord ; à relancer : le client qui attend avant le silence, puis le plus ancien ;
     * visites à planifier : la demande la plus ancienne ; réponses : non traitées puis récentes ;
     * visites : la plus proche.
     */
    static final Comparator<BuyerInboxItem> URGENCY =
            Comparator.comparingInt((BuyerInboxItem i) -> SECTIONS.indexOf(i.section()))
                    .thenComparing(
                            i ->
                                    FOLLOW_UP.equals(i.section())
                                                    && PitchFollowUpService.AGENT_REPLY_DUE.equals(
                                                            i.followUpKind())
                                            ? 0
                                            : 1)
                    .thenComparing(i -> RECENT_REPLY.equals(i.section()) && i.answered() ? 1 : 0)
                    .thenComparing(BuyerInboxService::sortKey);

    private static long sortKey(BuyerInboxItem i) {
        LocalDateTime t =
                switch (i.section()) {
                    case FOLLOW_UP ->
                            PitchFollowUpService.AGENT_REPLY_DUE.equals(i.followUpKind())
                                    ? i.replyAt()
                                    : i.pitchedAt();
                    case VISIT_TO_PLAN -> i.replyAt();
                    case RECENT_REPLY -> i.replyAt();
                    default -> i.visitStart();
                };
        if (t == null) {
            return Long.MAX_VALUE;
        }
        long epoch = t.toEpochSecond(java.time.ZoneOffset.UTC);
        // réponses récentes : la plus récente d'abord
        return RECENT_REPLY.equals(i.section()) ? -epoch : epoch;
    }
}
