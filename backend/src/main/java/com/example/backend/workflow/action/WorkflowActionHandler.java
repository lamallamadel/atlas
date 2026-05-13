package com.example.backend.workflow.action;

import com.example.backend.entity.Dossier;
import java.util.Map;

public interface WorkflowActionHandler {
    
    /**
     * Checks if this handler can execute the given action type.
     */
    boolean supports(String actionType);

    /**
     * Executes the action for the given dossier and configuration.
     * 
     * @param dossier The dossier that triggered the event.
     * @param actionConfig The JSON configuration for this action (e.g., template name, task title).
     * @param userId The user who triggered the transition.
     */
    void execute(Dossier dossier, Map<String, Object> actionConfig, String userId);
}
