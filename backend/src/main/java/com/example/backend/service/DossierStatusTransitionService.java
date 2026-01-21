package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.DossierStatusHistory;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.exception.InvalidStatusTransitionException;
import com.example.backend.repository.DossierStatusHistoryRepository;
import com.example.backend.util.TenantContext;
import com.example.backend.observability.MetricsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
public class DossierStatusTransitionService {

    private static final Logger logger = LoggerFactory.getLogger(DossierStatusTransitionService.class);

    private final DossierStatusHistoryRepository historyRepository;
    private final MetricsService metricsService;
    private final ActivityService activityService;
    private final Map<DossierStatus, Set<DossierStatus>> allowedTransitions;

    public DossierStatusTransitionService(DossierStatusHistoryRepository historyRepository, 
                                         MetricsService metricsService,
                                         ActivityService activityService) {
        this.historyRepository = historyRepository;
        this.metricsService = metricsService;
        this.activityService = activityService;
        this.allowedTransitions = initializeTransitions();
    }

    /**
     * Initializes basic status transition rules that apply to all dossiers.
     * These rules are always enforced, regardless of whether caseType is set.
     * 
     * When caseType is null, ONLY these rules apply (workflow validation bypassed).
     * When caseType is set, these rules AND custom workflow rules both apply.
     * 
     * Transition Map:
     * - NEW: Can go to QUALIFYING (start qualification), QUALIFIED (pre-qualified client),
     *        APPOINTMENT (direct scheduling), or LOST (client not interested)
     * - QUALIFYING: Can go to QUALIFIED (passed qualification) or LOST (failed qualification)
     * - QUALIFIED: Can go to APPOINTMENT (schedule visit) or LOST (client changed mind)
     * - APPOINTMENT: Can go to WON (deal closed) or LOST (client rejected offer)
     * - WON: Terminal state - no transitions allowed
     * - LOST: Terminal state - no transitions allowed
     */
    private Map<DossierStatus, Set<DossierStatus>> initializeTransitions() {
        Map<DossierStatus, Set<DossierStatus>> transitions = new HashMap<>();

        // NEW: Multiple paths to accommodate different sales velocities
        transitions.put(DossierStatus.NEW, Set.of(
                DossierStatus.QUALIFYING,   // Standard path: start qualification process
                DossierStatus.QUALIFIED,     // Shortcut: pre-qualified client
                DossierStatus.APPOINTMENT,   // Shortcut: direct appointment booking
                DossierStatus.LOST));        // Early rejection

        // QUALIFYING: Binary outcome of qualification
        transitions.put(DossierStatus.QUALIFYING, Set.of(
                DossierStatus.QUALIFIED,     // Qualification succeeded
                DossierStatus.LOST));        // Qualification failed

        // QUALIFIED: Ready for appointment or client withdrew
        transitions.put(DossierStatus.QUALIFIED, Set.of(
                DossierStatus.APPOINTMENT,   // Schedule property viewing
                DossierStatus.LOST));        // Client lost interest

        // APPOINTMENT: Final outcome after viewing
        transitions.put(DossierStatus.APPOINTMENT, Set.of(
                DossierStatus.WON,           // Deal successfully closed
                DossierStatus.LOST));        // Client rejected after viewing

        // Terminal states: no outbound transitions allowed
        transitions.put(DossierStatus.WON, Set.of());   // Cannot reopen won deals
        transitions.put(DossierStatus.LOST, Set.of());  // Cannot reopen lost deals

        return transitions;
    }

    public boolean isTransitionAllowed(DossierStatus fromStatus, DossierStatus toStatus) {
        if (fromStatus == null || toStatus == null) {
            return false;
        }

        Set<DossierStatus> allowed = allowedTransitions.get(fromStatus);
        return allowed != null && allowed.contains(toStatus);
    }

    public void validateTransition(DossierStatus fromStatus, DossierStatus toStatus) {
        if (!isTransitionAllowed(fromStatus, toStatus)) {
            throw new InvalidStatusTransitionException(
                    String.format("Invalid status transition from %s to %s", fromStatus, toStatus));
        }
    }

    @Transactional
    public void recordTransition(Dossier dossier, DossierStatus fromStatus, DossierStatus toStatus, String userId,
            String reason) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        DossierStatusHistory history = new DossierStatusHistory();
        history.setDossierId(dossier.getId());
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setUserId(userId);
        history.setReason(reason);
        history.setOrgId(orgId);

        LocalDateTime now = LocalDateTime.now();
        history.setCreatedAt(now);

        historyRepository.save(history);

        metricsService.incrementDossierStatusTransition(fromStatus.name(), toStatus.name());

        logStatusChangeActivity(dossier, fromStatus, toStatus, userId, reason);
    }

    private void logStatusChangeActivity(Dossier dossier, DossierStatus fromStatus, DossierStatus toStatus, 
                                         String userId, String reason) {
        if (activityService != null) {
            try {
                String description = String.format("Status changed from %s to %s", fromStatus, toStatus);
                if (reason != null && !reason.trim().isEmpty()) {
                    description += ": " + reason;
                }

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("fromStatus", fromStatus.name());
                metadata.put("toStatus", toStatus.name());
                metadata.put("userId", userId);
                if (reason != null) {
                    metadata.put("reason", reason);
                }
                metadata.put("timestamp", LocalDateTime.now().toString());

                activityService.logActivity(
                    dossier.getId(),
                    ActivityType.STATUS_CHANGE,
                    description,
                    metadata
                );
            } catch (Exception e) {
                logger.warn("Failed to log status change activity for dossier {}: {}", 
                    dossier.getId(), e.getMessage(), e);
            }
        }
    }

    public boolean isTerminalState(DossierStatus status) {
        return status == DossierStatus.WON || status == DossierStatus.LOST;
    }
}
