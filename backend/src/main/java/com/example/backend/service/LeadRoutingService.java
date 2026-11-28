package com.example.backend.service;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.event.PortalLeadCreatedEvent;
import com.example.backend.mandate.OrgScope;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OrganizationRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Distribution des leads du portail (réglage d'équipe {@code leadRouting}) :
 *
 * <ul>
 *   <li>{@code SHARED_QUEUE} (par défaut) : le lead reste « à attribuer », un agent le prend ;
 *   <li>{@code LISTING_AGENT} : à l'agent qui a publié l'annonce, sinon tour de rôle ;
 *   <li>{@code ROUND_ROBIN} : à l'agent dont la dernière attribution est la plus ancienne.
 * </ul>
 *
 * <p>Le tour de rôle choisit parmi les agents actifs (à défaut, tous les membres actifs). Un lead
 * déjà attribué n'est jamais repris.
 */
@Service
public class LeadRoutingService {

    private static final Logger log = LoggerFactory.getLogger(LeadRoutingService.class);

    public enum Mode {
        SHARED_QUEUE,
        LISTING_AGENT,
        ROUND_ROBIN
    }

    private final OrganizationRepository organizations;
    private final DossierRepository dossiers;
    private final AnnonceRepository annonces;
    private final TeamSettingsService teamSettings;
    private final TeamDirectoryService teamDirectory;
    private final DossierAssignmentService assignment;
    private final OrgScope orgScope;
    private final TransactionTemplate newTransaction;

    public LeadRoutingService(
            OrganizationRepository organizations,
            DossierRepository dossiers,
            AnnonceRepository annonces,
            TeamSettingsService teamSettings,
            TeamDirectoryService teamDirectory,
            DossierAssignmentService assignment,
            OrgScope orgScope,
            PlatformTransactionManager transactionManager) {
        this.organizations = organizations;
        this.dossiers = dossiers;
        this.annonces = annonces;
        this.teamSettings = teamSettings;
        this.teamDirectory = teamDirectory;
        this.assignment = assignment;
        this.orgScope = orgScope;
        this.newTransaction = new TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPortalLead(PortalLeadCreatedEvent event) {
        try {
            newTransaction.executeWithoutResult(status -> route(event));
        } catch (RuntimeException e) {
            // Le lead est enregistré ; sans attribution il reste dans la file partagée.
            log.warn("Lead {} non distribué : {}", event.dossierId(), e.getMessage());
        }
    }

    /** Attribue le lead selon le réglage de l'agence ; renvoie l'agent choisi, s'il y en a un. */
    Optional<String> route(PortalLeadCreatedEvent event) {
        OrganizationEntity org = organizations.findByOrgId(event.orgId()).orElse(null);
        if (org == null || org.isOwner()) {
            return Optional.empty();
        }
        Mode mode = teamSettings.leadRouting(event.orgId());
        if (mode == Mode.SHARED_QUEUE) {
            return Optional.empty();
        }
        return orgScope.as(
                event.orgId(),
                () ->
                        dossiers.findById(event.dossierId())
                                .filter(d -> d.getAssignedTo() == null)
                                .flatMap(d -> assign(d, mode)));
    }

    private Optional<String> assign(Dossier dossier, Mode mode) {
        List<TeamMemberResponse> members =
                teamDirectory.team(dossier.getOrgId()).members().stream()
                        .filter(TeamMemberResponse::enabled)
                        .toList();
        if (mode == Mode.LISTING_AGENT) {
            Optional<TeamMemberResponse> lister = listingAgent(dossier, members);
            if (lister.isPresent()) {
                assignment.autoAssign(
                        dossier, lister.get().userId(), lister.get().name(), "agent de l'annonce");
                return Optional.of(lister.get().userId());
            }
        }
        Optional<TeamMemberResponse> next = nextInTurn(dossier.getOrgId(), members);
        next.ifPresent(m -> assignment.autoAssign(dossier, m.userId(), m.name(), "tour de rôle"));
        return next.map(TeamMemberResponse::userId);
    }

    private Optional<TeamMemberResponse> listingAgent(
            Dossier dossier, List<TeamMemberResponse> members) {
        if (dossier.getAnnonceId() == null) {
            return Optional.empty();
        }
        String publisher =
                annonces.findById(dossier.getAnnonceId()).map(Annonce::getCreatedBy).orElse(null);
        if (publisher == null) {
            return Optional.empty();
        }
        return members.stream().filter(m -> publisher.equals(m.userId())).findFirst();
    }

    /** Agent dont la dernière attribution est la plus ancienne (jamais attribué en premier). */
    Optional<TeamMemberResponse> nextInTurn(String orgId, List<TeamMemberResponse> members) {
        List<TeamMemberResponse> agents =
                members.stream().filter(m -> "AGENT".equals(m.role())).toList();
        List<TeamMemberResponse> pool = agents.isEmpty() ? members : agents;
        if (pool.isEmpty()) {
            return Optional.empty();
        }
        Map<String, LocalDateTime> last = new HashMap<>();
        for (Object[] row :
                dossiers.findLastAssignmentByAssignee(
                        orgId, pool.stream().map(TeamMemberResponse::userId).toList())) {
            last.put((String) row[0], (LocalDateTime) row[1]);
        }
        return pool.stream()
                .min(
                        Comparator.comparing(
                                        (TeamMemberResponse m) -> last.get(m.userId()),
                                        Comparator.nullsFirst(Comparator.naturalOrder()))
                                .thenComparing(TeamMemberResponse::name));
    }
}
