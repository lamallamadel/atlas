package com.example.backend.workflow;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.WorkflowTransitionRule;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.event.DossierStatusChangedEvent;
import com.example.backend.repository.WorkflowTransitionRuleRepository;
import com.example.backend.workflow.action.WorkflowActionHandler;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WorkflowActionDispatcherTest {

    @Mock
    private WorkflowTransitionRuleRepository ruleRepository;

    @Mock
    private WorkflowActionHandler actionHandler;

    private WorkflowActionDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        dispatcher = new WorkflowActionDispatcher(ruleRepository, Arrays.asList(actionHandler));
    }

    @Test
    void testHandleDossierStatusChanged_ExecutesAction() {
        // Given
        Dossier dossier = new Dossier();
        dossier.setId(1L);
        dossier.setOrgId("org-1");
        dossier.setWorkflowDefinitionId(10L);

        DossierStatusChangedEvent event = new DossierStatusChangedEvent(this, dossier, DossierStatus.NEW, DossierStatus.QUALIFIED, "user-1", "reason");

        WorkflowTransitionRule rule = new WorkflowTransitionRule();
        Map<String, Object> actionConfig = Map.of("type", "TEST_ACTION", "key", "value");
        rule.setActionsJson(Arrays.asList(actionConfig));

        when(ruleRepository.findActiveTransition(10L, "NEW", "QUALIFIED", "org-1"))
                .thenReturn(Optional.of(rule));
        when(ruleRepository.findGlobalActiveTransitions("NEW", "QUALIFIED", "org-1"))
                .thenReturn(Collections.emptyList());
        
        when(actionHandler.supports("TEST_ACTION")).thenReturn(true);

        // When
        dispatcher.handleDossierStatusChanged(event);

        // Then
        verify(actionHandler).execute(eq(dossier), eq(actionConfig), eq("user-1"));
    }

    @Test
    void testHandleDossierStatusChanged_NoRule_DoesNothing() {
        Dossier dossier = new Dossier();
        dossier.setId(1L);
        dossier.setOrgId("org-1");

        DossierStatusChangedEvent event = new DossierStatusChangedEvent(this, dossier, DossierStatus.NEW, DossierStatus.QUALIFIED, "user-1", "reason");

        when(ruleRepository.findGlobalActiveTransitions("NEW", "QUALIFIED", "org-1"))
                .thenReturn(Collections.emptyList());

        dispatcher.handleDossierStatusChanged(event);

        verify(actionHandler, never()).execute(any(), any(), any());
    }
}
