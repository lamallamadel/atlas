package com.example.backend.service;

import com.example.backend.entity.ScheduledWorkflowAction;
import com.example.backend.entity.Dossier;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.ScheduledWorkflowActionRepository;
import com.example.backend.workflow.action.WorkflowActionHandler;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduledWorkflowActionService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledWorkflowActionService.class);

    private final ScheduledWorkflowActionRepository repository;
    private final DossierRepository dossierRepository;
    private final List<WorkflowActionHandler> actionHandlers;

    public ScheduledWorkflowActionService(
            ScheduledWorkflowActionRepository repository,
            DossierRepository dossierRepository,
            List<WorkflowActionHandler> actionHandlers) {
        this.repository = repository;
        this.dossierRepository = dossierRepository;
        this.actionHandlers = actionHandlers;
    }

    @Transactional
    public void scheduleAction(Long dossierId, Long appointmentId, LocalDateTime runAt, Map<String, Object> actionConfig, String userId) {
        ScheduledWorkflowAction action = new ScheduledWorkflowAction();
        action.setDossierId(dossierId);
        action.setAppointmentId(appointmentId);
        action.setRunAt(runAt);
        action.setActionConfig(actionConfig);
        action.setUserId(userId);
        
        // orgId is handled by BaseEntity/TenantContext normally, but for scheduled background tasks
        // we might need to store it explicitly if context is lost.
        // ScheduledWorkflowAction extends BaseEntity so it has orgId.
        
        repository.save(action);
        logger.info("Scheduled automated action of type {} for dossier {} at {}", 
                actionConfig.get("type"), dossierId, runAt);
    }

    @Scheduled(cron = "0 0/15 * * * ?") // Run every 15 minutes
    @Transactional
    public void runScheduledActions() {
        LocalDateTime now = LocalDateTime.now();
        List<ScheduledWorkflowAction> actions = repository.findByRunAtBefore(now, PageRequest.of(0, 100));

        if (actions.isEmpty()) {
            return;
        }

        logger.info("Running {} scheduled workflow actions", actions.size());

        // Batch-load all dossiers in one query to avoid N+1
        List<Long> dossierIds = actions.stream()
                .map(ScheduledWorkflowAction::getDossierId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Dossier> dossierMap = dossierRepository.findAllById(dossierIds).stream()
                .collect(Collectors.toMap(Dossier::getId, Function.identity()));

        for (ScheduledWorkflowAction action : actions) {
            try {
                executeScheduledTask(action, dossierMap.get(action.getDossierId()));
                repository.delete(action);
            } catch (Exception e) {
                logger.error("Failed to execute scheduled action {}: {}", action.getId(), e.getMessage(), e);
            }
        }
    }

    private void executeScheduledTask(ScheduledWorkflowAction action, Dossier dossier) {
        if (dossier == null) {
            logger.warn("Dossier {} not found for scheduled action {}", action.getDossierId(), action.getId());
            return;
        }

        Map<String, Object> config = action.getActionConfig();
        String actionType = (String) config.get("type");

        actionHandlers.stream()
                .filter(h -> h.supports(actionType))
                .findFirst()
                .ifPresentOrElse(
                        h -> h.execute(dossier, config, action.getUserId()),
                        () -> logger.warn("No handler for scheduled action type: {}", actionType)
                );
    }
}
