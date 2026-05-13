package com.example.backend.workflow.action;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import com.example.backend.entity.Dossier;
import com.example.backend.service.ScheduledWorkflowActionService;
import java.time.LocalDateTime;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScheduleActionHandlerTest {

    @Mock
    private ScheduledWorkflowActionService scheduledService;

    @InjectMocks
    private ScheduleActionHandler handler;

    @Test
    void testExecute_SchedulesDelayedAction() {
        Dossier dossier = new Dossier();
        dossier.setId(1L);
        
        Map<String, Object> innerAction = Map.of("type", "SEND_EMAIL");
        Map<String, Object> config = Map.of(
                "delayHours", 2,
                "action", innerAction
        );

        handler.execute(dossier, config, "user-1");

        verify(scheduledService).scheduleAction(
                eq(1L),
                eq(null),
                any(LocalDateTime.class),
                eq(innerAction),
                eq("user-1")
        );
    }
}
