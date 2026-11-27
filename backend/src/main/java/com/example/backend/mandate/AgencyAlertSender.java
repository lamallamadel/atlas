package com.example.backend.mandate;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.owner.PlatformAlert;
import com.example.backend.owner.PlatformAlertSender;
import com.example.backend.security.AgencyRole;
import com.example.backend.service.NotificationService;
import com.example.backend.service.TeamDirectoryService;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Envoie les {@link AgencyAlert} : notification dans l'espace Pro et e-mail aux administrateurs et
 * managers de chaque agence (annuaire Keycloak, {@link TeamDirectoryService}). Sans administrateur
 * ni manager connu, tous les membres actifs sont prévenus. Une alerte manquée n'annule rien : la
 * demande reste dans la bourse.
 */
@Component
public class AgencyAlertSender {

    private static final Logger log = LoggerFactory.getLogger(AgencyAlertSender.class);
    private static final Set<String> RECIPIENT_ROLES =
            Set.of(AgencyRole.ADMIN.name(), AgencyRole.MANAGER.name());

    private final TeamDirectoryService team;
    private final NotificationService notifications;
    private final PlatformAlertSender mail;
    private final String publicBaseUrl;

    public AgencyAlertSender(
            TeamDirectoryService team,
            NotificationService notifications,
            PlatformAlertSender mail,
            @Value("${atlas.consent.public-base-url:http://localhost:4200}") String publicBaseUrl) {
        this.team = team;
        this.notifications = notifications;
        this.mail = mail;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAlert(AgencyAlert alert) {
        Map<String, TeamDirectoryService.Team> teams;
        try {
            teams = team.teams(alert.agencyOrgIds());
        } catch (RuntimeException e) {
            log.warn("Alerte agences {} non envoyée : {}", alert.agencyOrgIds(), e.getMessage());
            return;
        }
        for (String orgId : alert.agencyOrgIds()) {
            try {
                send(orgId, teams.get(orgId).members(), alert);
            } catch (RuntimeException e) {
                log.warn("Alerte agence {} non envoyée : {}", orgId, e.getMessage());
            }
        }
    }

    /** Renvoie le nombre de destinataires prévenus. */
    int send(String orgId, List<TeamMemberResponse> members, AgencyAlert alert) {
        List<TeamMemberResponse> recipients = recipients(members);
        for (TeamMemberResponse m : recipients) {
            notifications.createInAppNotification(
                    orgId, null, m.userId(), alert.subject(), alert.message(), alert.path());
            if (m.email() != null && !m.email().isBlank()) {
                mail.send(
                        new PlatformAlert(
                                PlatformAlert.Audience.AGENCY,
                                null,
                                m.email(),
                                alert.message(),
                                "Atlas Pro : " + alert.subject(),
                                null,
                                publicBaseUrl + alert.path(),
                                false,
                                true));
            }
        }
        if (recipients.isEmpty()) {
            log.warn("Alerte agence {} : aucun membre connu", orgId);
        }
        return recipients.size();
    }

    /** Administrateurs et managers ; à défaut de rôles connus, tous les membres actifs. */
    static List<TeamMemberResponse> recipients(List<TeamMemberResponse> members) {
        List<TeamMemberResponse> active =
                members.stream().filter(TeamMemberResponse::enabled).toList();
        List<TeamMemberResponse> leads =
                active.stream()
                        .filter(m -> m.role() != null && RECIPIENT_ROLES.contains(m.role()))
                        .toList();
        return leads.isEmpty() ? active : leads;
    }
}
