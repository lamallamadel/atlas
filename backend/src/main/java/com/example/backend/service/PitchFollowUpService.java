package com.example.backend.service;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Relances des propositions de biens. Deux situations signalées à l'agent, avec un brouillon de
 * relance à valider dans l'éditeur de proposition :
 *
 * <ul>
 *   <li>{@link #AGENT_REPLY_DUE} : le client a répondu (visite, intérêt, prix, question) et
 *       personne ne lui a écrit depuis 24 h ;
 *   <li>{@link #CLIENT_SILENT} : le client n'a pas répondu 3 jours après la proposition (une seule
 *       relance).
 * </ul>
 *
 * Rien n'est envoyé au client automatiquement.
 */
@Service
public class PitchFollowUpService {

    private static final Logger log = LoggerFactory.getLogger(PitchFollowUpService.class);

    public static final String AGENT_REPLY_DUE = "AGENT_REPLY_DUE";
    public static final String CLIENT_SILENT = "CLIENT_SILENT";

    static final Set<String> ACTIONABLE = Set.of("VISITE", "INTERESSE", "NEGOCIATION", "QUESTION");

    /** Au-delà, la conversation est considérée comme close : pas de relance. */
    static final int MAX_AGE_DAYS = 30;

    private final AnnonceDossierMatchRepository matchRepository;
    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final OutboundMessageRepository outboundMessageRepository;
    private final MessageRepository messageRepository;
    private final NotificationService notificationService;
    private final boolean enabled;
    private final int agentReplyHours;
    private final int clientSilentDays;

    public PitchFollowUpService(
            AnnonceDossierMatchRepository matchRepository,
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            OutboundMessageRepository outboundMessageRepository,
            MessageRepository messageRepository,
            @Nullable NotificationService notificationService,
            @Value("${atlas.follow-up.enabled:true}") boolean enabled,
            @Value("${atlas.follow-up.agent-reply-hours:24}") int agentReplyHours,
            @Value("${atlas.follow-up.client-silent-days:3}") int clientSilentDays) {
        this.matchRepository = matchRepository;
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.outboundMessageRepository = outboundMessageRepository;
        this.messageRepository = messageRepository;
        this.notificationService = notificationService;
        this.enabled = enabled;
        this.agentReplyHours = agentReplyHours;
        this.clientSilentDays = clientSilentDays;
    }

    /** Toutes les 30 minutes, de 8 h à 20 h (pas de notification la nuit). */
    @Scheduled(cron = "${atlas.follow-up.cron:0 */30 8-20 * * *}")
    public void scheduledScan() {
        if (!enabled) {
            return;
        }
        try {
            int n = scan(LocalDateTime.now());
            if (n > 0) {
                log.info("Relances de propositions : {} signalée(s)", n);
            }
        } catch (Exception e) {
            log.warn("Recherche des relances échouée : {}", e.getMessage());
        }
    }

    /**
     * @return nombre de relances signalées à un agent
     */
    @Transactional
    public int scan(LocalDateTime now) {
        LocalDateTime since = now.minusDays(MAX_AGE_DAYS);
        int notified = 0;
        for (AnnonceDossierMatch m :
                matchRepository.findAwaitingAgentReply(
                        ACTIONABLE, now.minusHours(agentReplyHours), since)) {
            // L'agent a déjà écrit au client depuis sa réponse : rien à relancer.
            boolean answered =
                    outboundMessageRepository.existsByDossierIdAndCreatedAtAfter(
                                    m.getDossierId(), m.getReplyAt())
                            || messageRepository.existsByDossier_IdAndDirectionAndTimestampAfter(
                                    m.getDossierId(), MessageDirection.OUTBOUND, m.getReplyAt());
            if (answered) {
                m.setFollowUpNotifiedAt(now); // examinée, sans rappel
                m.setFollowUpKind(null);
                matchRepository.save(m);
                continue;
            }
            if (flag(m, AGENT_REPLY_DUE, now)) {
                notified++;
            }
        }
        for (AnnonceDossierMatch m :
                matchRepository.findSilentClients(now.minusDays(clientSilentDays), since)) {
            if (flag(m, CLIENT_SILENT, now)) {
                notified++;
            }
        }
        return notified;
    }

    private boolean flag(AnnonceDossierMatch m, String kind, LocalDateTime now) {
        m.setFollowUpKind(kind);
        m.setFollowUpNotifiedAt(now);
        m.setFollowUpDoneAt(null);
        matchRepository.save(m);
        Annonce annonce = annonceRepository.findById(m.getAnnonceId()).orElse(null);
        Dossier dossier = dossierRepository.findById(m.getDossierId()).orElse(null);
        if (annonce == null || dossier == null || notificationService == null) {
            return false;
        }
        String who = dossier.getLeadName() != null ? dossier.getLeadName() : "Le client";
        String title =
                AGENT_REPLY_DUE.equals(kind)
                        ? who + " attend votre réponse depuis " + agentReplyHours + " h"
                        : who + " n'a pas répondu à la proposition";
        String body =
                AGENT_REPLY_DUE.equals(kind)
                        ? "Sa réponse sur « "
                                + annonce.getTitle()
                                + " » : « "
                                + m.getReplyExcerpt()
                                + " ». Un brouillon de relance vous attend."
                        : "Proposition « "
                                + annonce.getTitle()
                                + " » envoyée il y a "
                                + clientSilentDays
                                + " jours. Une relance courte peut être envoyée.";
        // Tâche planifiée : pas d'organisation dans le contexte, or le journal d'audit en a besoin.
        boolean ownTenant = TenantContext.getOrgId() == null;
        if (ownTenant) {
            TenantContext.setOrgId(m.getOrgId());
        }
        try {
            notificationService.createInAppNotification(
                    m.getOrgId(),
                    dossier.getId(),
                    dossier.getCreatedBy() != null ? dossier.getCreatedBy() : "equipe",
                    title + " — " + annonce.getTitle(),
                    body,
                    "/annonces/" + annonce.getId());
            return true;
        } catch (Exception e) {
            log.warn(
                    "Notification de relance non créée (match {}) : {}", m.getId(), e.getMessage());
            return false;
        } finally {
            if (ownTenant) {
                TenantContext.clear();
            }
        }
    }

    /** L'agent indique qu'il a relancé le client autrement (téléphone, WhatsApp personnel…). */
    @Transactional
    public void markDone(Long annonceId, Long matchId) {
        String orgId = TenantContext.getOrgId();
        AnnonceDossierMatch m =
                matchRepository
                        .findById(matchId)
                        .filter(
                                x ->
                                        annonceId.equals(x.getAnnonceId())
                                                && x.getOrgId().equals(orgId))
                        .orElseThrow(
                                () -> new EntityNotFoundException("Match not found: " + matchId));
        if (!m.isFollowUpPending()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Aucune relance en attente.");
        }
        m.closeFollowUp(LocalDateTime.now());
        matchRepository.save(m);
    }
}
