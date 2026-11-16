package com.example.backend.workflow.action;

import com.example.backend.entity.Dossier;
import com.example.backend.service.ScheduledWorkflowActionService;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class ScheduleActionHandler implements WorkflowActionHandler {

    public static final String ACTION_TYPE = "SCHEDULE_ACTION";
    private final ScheduledWorkflowActionService scheduledService;

    public ScheduleActionHandler(@Lazy ScheduledWorkflowActionService scheduledService) {
        this.scheduledService = scheduledService;
    }

    @Override
    public boolean supports(String actionType) {
        return ACTION_TYPE.equalsIgnoreCase(actionType);
    }

    @Override
    @SuppressWarnings("unchecked")
    public void execute(Dossier dossier, Map<String, Object> actionConfig, String userId) {
        int delayHours = ((Number) actionConfig.getOrDefault("delayHours", 0)).intValue();
        Map<String, Object> nextAction = (Map<String, Object>) actionConfig.get("action");
        
        if (nextAction == null) return;

        LocalDateTime runAt = LocalDateTime.now().plusHours(delayHours);
        
        // We'll assume the appointmentId is passed in the metadata if this was triggered by an appointment event
        // For simplicity, let's just pass null for now if not easily available.
        
        scheduledService.scheduleAction(dossier.getId(), null, runAt, nextAction, userId);
    }
}
