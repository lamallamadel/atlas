package com.example.backend.service;

import com.example.backend.dto.BulkOperationResponse;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.repository.DossierRepository;
import com.example.backend.security.AccessPolicy;
import com.example.backend.util.CurrentUser;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Agent assigné aux dossiers (étape 6, lot A). Un dossier sans agent est « à attribuer » : un agent
 * peut le prendre ; seuls le manager et l'admin réassignent. Chaque changement est tracé (audit,
 * fil d'activité du dossier) et l'agent qui reçoit le dossier est notifié.
 */
@Service
public class DossierAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(DossierAssignmentService.class);

    private final DossierRepository dossierRepository;
    private final DossierMapper dossierMapper;
    private final TeamDirectoryService teamDirectory;
    @Nullable private final ActivityService activityService;
    @Nullable private final AuditEventService auditEventService;
    @Nullable private final NotificationService notificationService;

    public DossierAssignmentService(
            DossierRepository dossierRepository,
            DossierMapper dossierMapper,
            TeamDirectoryService teamDirectory,
            @Autowired(required = false) @Nullable ActivityService activityService,
            @Autowired(required = false) @Nullable AuditEventService auditEventService,
            @Autowired(required = false) @Nullable NotificationService notificationService) {
        this.dossierRepository = dossierRepository;
        this.dossierMapper = dossierMapper;
        this.teamDirectory = teamDirectory;
        this.activityService = activityService;
        this.auditEventService = auditEventService;
        this.notificationService = notificationService;
    }

    /** À la création d'un dossier par un utilisateur, il lui revient. Rien pour le système. */
    public static void assignToCreator(Dossier dossier) {
        if (dossier.getAssignedTo() != null) {
            return;
        }
        CurrentUser.id()
                .ifPresent(
                        id -> {
                            dossier.setAssignedTo(id);
                            dossier.setAssignedToName(CurrentUser.displayName().orElse(id));
                            dossier.setAssignedAt(LocalDateTime.now());
                        });
    }

    /** L'utilisateur connecté prend un dossier à attribuer. */
    @CacheEvict(
            value = "dossier",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public DossierResponse claim(Long id) {
        Dossier dossier = load(id);
        String me =
                CurrentUser.id()
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.FORBIDDEN, "Utilisateur inconnu"));
        if (dossier.getAssignedTo() != null) {
            if (dossier.getAssignedTo().equals(me)) {
                return dossierMapper.toResponse(dossier);
            }
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "ALREADY_ASSIGNED: ce dossier est déjà suivi par " + nameOrId(dossier) + ".");
        }
        apply(dossier, me, CurrentUser.displayName().orElse(me), false);
        return dossierMapper.toResponse(dossier);
    }

    /** Réassigne un dossier (manager ou admin). {@code userId = null} le remet « à attribuer ». */
    @CacheEvict(
            value = "dossier",
            key = "#id + '_' + T(com.example.backend.util.TenantContext).getOrgId()")
    @Transactional
    public DossierResponse assign(Long id, @Nullable String userId) {
        requireManager();
        Dossier dossier = load(id);
        if (userId == null || userId.isBlank()) {
            apply(dossier, null, null, true);
        } else {
            TeamMemberResponse member = resolveMember(dossier.getOrgId(), userId);
            apply(dossier, member.userId(), member.name(), true);
        }
        return dossierMapper.toResponse(dossier);
    }

    /** Réassignation groupée (manager ou admin). */
    @CacheEvict(value = "dossier", allEntries = true)
    @Transactional
    public BulkOperationResponse bulkAssign(List<Long> ids, @Nullable String userId) {
        requireManager();
        String orgId = requireOrg();
        TeamMemberResponse member =
                userId == null || userId.isBlank() ? null : resolveMember(orgId, userId);
        int ok = 0;
        List<BulkOperationResponse.BulkOperationError> errors = new ArrayList<>();
        for (Long id : ids) {
            try {
                Dossier dossier = load(id);
                apply(
                        dossier,
                        member == null ? null : member.userId(),
                        member == null ? null : member.name(),
                        true);
                ok++;
            } catch (Exception e) {
                errors.add(new BulkOperationResponse.BulkOperationError(id, e.getMessage()));
            }
        }
        return new BulkOperationResponse(ok, errors.size(), errors);
    }

    private void apply(Dossier dossier, String userId, String userName, boolean byManager) {
        String previous = dossier.getAssignedTo();
        String previousName = nameOrId(dossier);
        if (Objects.equals(previous, userId)) {
            return;
        }
        dossier.setAssignedTo(userId);
        dossier.setAssignedToName(userName);
        dossier.setAssignedAt(userId == null ? null : LocalDateTime.now());
        dossier.setUpdatedAt(LocalDateTime.now());
        dossierRepository.save(dossier);

        String actor = CurrentUser.displayName().orElse("Système");
        String description =
                userId == null
                        ? actor + " a remis le dossier à attribuer"
                        : byManager
                                ? actor + " a assigné le dossier à " + userName
                                : userName + " a pris le dossier";
        Map<String, Object> meta = new HashMap<>();
        meta.put("previousAssignee", previous);
        meta.put("previousAssigneeName", previousName);
        meta.put("assignee", userId);
        meta.put("assigneeName", userName);
        if (activityService != null) {
            try {
                activityService.logActivity(
                        dossier.getId(), ActivityType.ASSIGNMENT_CHANGED, description, meta);
            } catch (Exception e) {
                log.warn("Failed to log assignment activity for dossier {}", dossier.getId(), e);
            }
        }
        if (auditEventService != null) {
            try {
                auditEventService.logEvent("DOSSIER", dossier.getId(), "ASSIGNED", description);
            } catch (Exception e) {
                log.warn("Failed to audit assignment for dossier {}", dossier.getId(), e);
            }
        }
        // L'agent qui reçoit le dossier d'un autre est prévenu (pas quand il le prend lui-même).
        if (notificationService != null
                && userId != null
                && !userId.equals(CurrentUser.id().orElse(null))) {
            try {
                notificationService.createInAppNotification(
                        dossier.getOrgId(),
                        dossier.getId(),
                        userId,
                        "Nouveau dossier assigné",
                        actor
                                + " vous a assigné le dossier de "
                                + (dossier.getLeadName() != null
                                        ? dossier.getLeadName()
                                        : "n°" + dossier.getId()),
                        "/pro/dossiers/" + dossier.getId());
            } catch (Exception e) {
                log.warn("Failed to notify assignee for dossier {}", dossier.getId(), e);
            }
        }
    }

    private TeamMemberResponse resolveMember(String orgId, String userId) {
        TeamDirectoryService.Team team = teamDirectory.team(orgId);
        return team.find(userId)
                .orElseGet(
                        () -> {
                            if (team.authoritative()) {
                                throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "USER_NOT_IN_AGENCY: cet utilisateur ne fait pas partie"
                                                + " de l'agence.");
                            }
                            // Annuaire indisponible : on ne peut pas vérifier, on garde l'id.
                            log.warn(
                                    "Team directory unavailable, assigning unverified user {} in"
                                            + " org {}",
                                    userId,
                                    orgId);
                            return new TeamMemberResponse(userId, userId, null);
                        });
    }

    private Dossier load(Long id) {
        String orgId = requireOrg();
        Dossier dossier =
                dossierRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + id));
        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }
        return dossier;
    }

    private static void requireManager() {
        AccessPolicy.requireCanAssign();
    }

    private static String requireOrg() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        return orgId;
    }

    private static String nameOrId(Dossier d) {
        return d.getAssignedToName() != null ? d.getAssignedToName() : d.getAssignedTo();
    }
}
