package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.ScheduledWorkflowAction;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.ScheduledWorkflowActionRepository;
import com.example.backend.workflow.action.WorkflowActionHandler;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScheduledWorkflowActionServiceTest {

    @Mock private ScheduledWorkflowActionRepository repository;
    @Mock private DossierRepository dossierRepository;
    @Mock private WorkflowActionHandler actionHandler;

    private ScheduledWorkflowActionService service;

    @BeforeEach
    void setUp() {
        service = new ScheduledWorkflowActionService(repository, dossierRepository, Arrays.asList(actionHandler));
    }

    @Test
    void testScheduleAction_SavesToRepository() {
        Map<String, Object> config = Map.of("type", "SEND_EMAIL");
        LocalDateTime runAt = LocalDateTime.now().plusHours(2);

        service.scheduleAction(1L, null, runAt, config, "user-1");

        ArgumentCaptor<ScheduledWorkflowAction> captor = ArgumentCaptor.forClass(ScheduledWorkflowAction.class);
        verify(repository).save(captor.capture());
        
        ScheduledWorkflowAction saved = captor.getValue();
        assertThat(saved.getDossierId()).isEqualTo(1L);
        assertThat(saved.getRunAt()).isEqualTo(runAt);
        assertThat(saved.getActionConfig()).isEqualTo(config);
    }

    @Test
    void testRunScheduledActions_ExecutesAndDeletes() {
        ScheduledWorkflowAction action = new ScheduledWorkflowAction();
        action.setId(100L);
        action.setDossierId(1L);
        Map<String, Object> config = Map.of("type", "TEST");
        action.setActionConfig(config);
        action.setUserId("user-1");

        when(repository.findByRunAtBefore(any())).thenReturn(Arrays.asList(action));
        
        Dossier dossier = new Dossier();
        dossier.setId(1L);
        when(dossierRepository.findById(1L)).thenReturn(Optional.of(dossier));
        
        when(actionHandler.supports("TEST")).thenReturn(true);

        service.runScheduledActions();

        verify(actionHandler).execute(eq(dossier), eq(config), eq("user-1"));
        verify(repository).delete(action);
    }
}
