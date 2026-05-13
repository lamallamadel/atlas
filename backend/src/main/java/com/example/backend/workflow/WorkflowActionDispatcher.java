package com.example.backend.workflow;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.WorkflowTransitionRule;
import com.example.backend.event.DossierStatusChangedEvent;
import com.example.backend.repository.WorkflowTransitionRuleRepository;
import com.example.backend.workflow.action.WorkflowActionHandler;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkflowActionDispatcher {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowActionDispatcher.class);

    private final WorkflowTransitionRuleRepository ruleRepository;
    private final List<WorkflowActionHandler> actionHandlers;

    public WorkflowActionDispatcher(
            WorkflowTransitionRuleRepository ruleRepository,
            List<WorkflowActionHandler> actionHandlers) {
        this.ruleRepository = ruleRepository;
        this.actionHandlers = actionHandlers;
    }

    @EventListener
    @Transactional
    public void handleStatusChanged(DossierStatusChangedEvent event) {
        Dossier dossier = event.getDossier();
        String fromState = event.getFromStatus() != null ? event.getFromStatus().name() : "NONE";
        String toState = event.getToStatus().name();
        String orgId = dossier.getOrgId();

        logger.debug("Dispatching actions for dossier {} transition {} -> {}", dossier.getId(), fromState, toState);

        List<WorkflowTransitionRule> rules = new ArrayList<>();

        // 1. Fetch specific workflow rule if present
        if (dossier.getWorkflowDefinitionId() != null) {
            ruleRepository.findActiveTransition(
                    dossier.getWorkflowDefinitionId(), fromState, toState, orgId)
                    .ifPresent(rules::add);
        }

        // 2. Fetch global rules (where workflowDefinitionId is NULL)
        rules.addAll(ruleRepository.findGlobalActiveTransitions(fromState, toState, orgId));

        if (rules.isEmpty()) {
            logger.debug("No workflow rules found for transition {} -> {} in org {}", fromState, toState, orgId);
            return;
        }

        for (WorkflowTransitionRule rule : rules) {
            List<Map<String, Object>> actions = rule.getActionsJson();
            if (actions == null || actions.isEmpty()) {
                continue;
            }

            for (Map<String, Object> actionConfig : actions) {
                String actionType = (String) actionConfig.get("type");
                if (actionType == null) continue;

                executeAction(dossier, actionType, actionConfig, event.getUserId());
            }
        }
    }

    private void executeAction(Dossier dossier, String actionType, Map<String, Object> config, String userId) {
        actionHandlers.stream()
                .filter(handler -> handler.supports(actionType))
                .findFirst()
                .ifPresentOrElse(
                        handler -> {
                            logger.info("Executing action {} for dossier {}", actionType, dossier.getId());
                            handler.execute(dossier, config, userId);
                        },
                        () -> logger.warn("No handler found for action type: {}", actionType)
                );
    }
}
