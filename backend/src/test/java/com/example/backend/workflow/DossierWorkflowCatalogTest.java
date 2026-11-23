package com.example.backend.workflow;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.service.DossierStatusTransitionService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DossierWorkflowCatalogTest {

    /** Le modèle système doit autoriser exactement les transitions de l'ancien enum (phase A). */
    @Test
    void systemLeadWorkflowMatchesLegacyEnumMatrix() {
        DossierStatusTransitionService legacy =
                new DossierStatusTransitionService(null, null, null, null);
        DossierWorkflow workflow = DossierWorkflowCatalog.systemWorkflow("CRM_LEAD").orElseThrow();

        for (DossierStatus from : DossierStatus.values()) {
            for (DossierStatus to : DossierStatus.values()) {
                boolean legacyAllowed = legacy.isTransitionAllowed(from, to);
                boolean workflowAllowed =
                        workflow.transition(
                                        DossierStatusCodes.toCode(from),
                                        DossierStatusCodes.toCode(to))
                                .isPresent();
                assertThat(workflowAllowed).as("%s -> %s", from, to).isEqualTo(legacyAllowed);
            }
        }
    }

    @Test
    void everyEnumStatusHasAStateWithConsistentStage() {
        DossierWorkflow workflow = DossierWorkflowCatalog.systemWorkflow("CRM_LEAD").orElseThrow();
        for (DossierStatus s : DossierStatus.values()) {
            DossierWorkflow.State state =
                    workflow.state(DossierStatusCodes.toCode(s)).orElseThrow();
            DossierWorkflow.Stage expected =
                    switch (s) {
                        case WON -> DossierWorkflow.Stage.WON;
                        case LOST -> DossierWorkflow.Stage.LOST;
                        default -> DossierWorkflow.Stage.OPEN;
                    };
            assertThat(state.stage()).as(s.name()).isEqualTo(expected);
        }
        assertThat(workflow.initialState()).isEqualTo(DossierStatusCodes.CRM_NEW);
    }

    @Test
    void systemWorkflowsCoverLeadCaseTypesOnly() {
        assertThat(DossierWorkflowCatalog.systemWorkflow("CRM_LEAD")).isPresent();
        assertThat(DossierWorkflowCatalog.systemWorkflow("CRM_LEAD_BUY")).isPresent();
        assertThat(DossierWorkflowCatalog.systemWorkflow("CRM_LEAD_RENT")).isPresent();
        assertThat(DossierWorkflowCatalog.systemWorkflow("CRM_LEAD_B2B_DEMO")).isPresent();
        assertThat(DossierWorkflowCatalog.systemWorkflow("CRM_SALE_TRANSACTION")).isEmpty();
        assertThat(DossierWorkflowCatalog.systemWorkflow(null)).isEmpty();
    }

    @Test
    void normalizeMapsLegacyNamesAndKeepsCodes() {
        assertThat(DossierStatusCodes.normalize("APPOINTMENT")).isEqualTo("CRM_VISIT_PLANNED");
        assertThat(DossierStatusCodes.normalize("CRM_NEGOTIATION")).isEqualTo("CRM_NEGOTIATION");
        assertThat(DossierStatusCodes.effectiveCaseType(" ")).isEqualTo("CRM_LEAD");
    }

    @Test
    void orgDefinitionIsParsedFromEditorJson() {
        WorkflowDefinition def = new WorkflowDefinition();
        def.setCaseType("CRM_LEAD_RENT");
        def.setStatesJson(
                List.of(
                        Map.of("stateCode", "CRM_NEW", "isInitial", true, "isFinal", false),
                        Map.of("stateCode", "CRM_QUALIFIED", "isFinal", false),
                        Map.of("stateCode", "CRM_CLOSED_LOST", "isFinal", true)));
        def.setTransitionsJson(
                List.of(
                        Map.of(
                                "fromState",
                                "CRM_NEW",
                                "toState",
                                "CRM_QUALIFIED",
                                "requiredFields",
                                List.of("leadPhone"),
                                "allowedRoles",
                                List.of("MANAGER")),
                        Map.of(
                                "fromState",
                                "CRM_NEW",
                                "toState",
                                "CRM_CLOSED_LOST",
                                "isActive",
                                false)));

        DossierWorkflow w = DossierWorkflow.fromDefinition(def);

        assertThat(w.source()).isEqualTo(DossierWorkflow.SOURCE_ORG);
        assertThat(w.initialState()).isEqualTo("CRM_NEW");
        assertThat(w.stateCodes()).containsExactly("CRM_NEW", "CRM_QUALIFIED", "CRM_CLOSED_LOST");
        assertThat(w.state("CRM_CLOSED_LOST").orElseThrow().stage())
                .isEqualTo(DossierWorkflow.Stage.LOST);
        assertThat(w.targetsFrom("CRM_NEW")).containsExactly("CRM_QUALIFIED");
        DossierWorkflow.Transition t = w.transition("CRM_NEW", "CRM_QUALIFIED").orElseThrow();
        assertThat(t.requiredFields()).containsExactly("leadPhone");
        assertThat(t.allowedRoles()).containsExactly("MANAGER");
    }
}
