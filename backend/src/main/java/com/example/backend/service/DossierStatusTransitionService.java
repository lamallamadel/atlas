package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.DossierStatusHistory;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.exception.InvalidStatusTransitionException;
import com.example.backend.repository.DossierStatusHistoryRepository;
import com.example.backend.util.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
public class DossierStatusTransitionService {

    private final DossierStatusHistoryRepository historyRepository;
    private final Map<DossierStatus, Set<DossierStatus>> allowedTransitions;

    public DossierStatusTransitionService(DossierStatusHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
        this.allowedTransitions = initializeTransitions();
    }

    private Map<DossierStatus, Set<DossierStatus>> initializeTransitions() {
        Map<DossierStatus, Set<DossierStatus>> transitions = new HashMap<>();
        
        transitions.put(DossierStatus.NEW, Set.of(
            DossierStatus.QUALIFYING,
            DossierStatus.LOST
        ));
        
        transitions.put(DossierStatus.QUALIFYING, Set.of(
            DossierStatus.QUALIFIED,
            DossierStatus.LOST
        ));
        
        transitions.put(DossierStatus.QUALIFIED, Set.of(
            DossierStatus.APPOINTMENT,
            DossierStatus.LOST
        ));
        
        transitions.put(DossierStatus.APPOINTMENT, Set.of(
            DossierStatus.WON,
            DossierStatus.LOST
        ));
        
        transitions.put(DossierStatus.WON, Set.of());
        transitions.put(DossierStatus.LOST, Set.of());
        
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
                String.format("Invalid status transition from %s to %s", fromStatus, toStatus)
            );
        }
    }

    @Transactional
    public void recordTransition(Dossier dossier, DossierStatus fromStatus, DossierStatus toStatus, String userId, String reason) {
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
        
        historyRepository.save(history);
    }

    public boolean isTerminalState(DossierStatus status) {
        return status == DossierStatus.WON || status == DossierStatus.LOST;
    }
}
