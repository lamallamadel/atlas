package com.example.backend.workflow;

import static com.example.backend.workflow.DossierStatusCodes.CRM_CLOSED_LOST;
import static com.example.backend.workflow.DossierStatusCodes.CRM_CLOSED_WON;
import static com.example.backend.workflow.DossierStatusCodes.CRM_NEW;
import static com.example.backend.workflow.DossierStatusCodes.CRM_QUALIFIED;
import static com.example.backend.workflow.DossierStatusCodes.CRM_QUALIFYING;
import static com.example.backend.workflow.DossierStatusCodes.CRM_VISIT_PLANNED;

import com.example.backend.workflow.DossierWorkflow.FunnelStep;
import com.example.backend.workflow.DossierWorkflow.Stage;
import com.example.backend.workflow.DossierWorkflow.State;
import com.example.backend.workflow.DossierWorkflow.Transition;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Modèles de workflow système, utilisés quand une organisation n'a pas publié le sien pour un type
 * de dossier (ADR 0004).
 *
 * <p>Phase A : tous les types de lead partagent le pipeline historique (mêmes transitions que
 * l'enum {@code DossierStatus}), exprimé en codes de nomenclature. Les exigences de clôture (raison
 * de perte ou de gain) sont déclarées via {@code requires} mais ne sont pas encore imposées :
 * l'écran Pro ne les envoie pas. Elles le seront en phase B, avec l'écran. Le pipeline propre à
 * {@code CRM_LEAD_B2B_DEMO} (statuts {@code B2B_*}) viendra avec l'étape B2B du backlog.
 */
public final class DossierWorkflowCatalog {

    public static final Set<String> SYSTEM_CASE_TYPES =
            Set.of(
                    DossierStatusCodes.DEFAULT_CASE_TYPE,
                    "CRM_LEAD_BUY",
                    "CRM_LEAD_RENT",
                    "CRM_LEAD_B2B_DEMO");

    private static final List<State> LEAD_STATES =
            List.of(
                    new State(CRM_NEW, Stage.OPEN, FunnelStep.NEW, List.of()),
                    new State(CRM_QUALIFYING, Stage.OPEN, FunnelStep.QUALIFICATION, List.of()),
                    new State(CRM_QUALIFIED, Stage.OPEN, FunnelStep.QUALIFICATION, List.of()),
                    new State(CRM_VISIT_PLANNED, Stage.OPEN, FunnelStep.VISIT, List.of()),
                    new State(CRM_CLOSED_WON, Stage.WON, FunnelStep.CLOSING, List.of()),
                    new State(CRM_CLOSED_LOST, Stage.LOST, FunnelStep.CLOSING, List.of()));

    /** Mêmes transitions que {@code DossierStatusTransitionService}. */
    private static final Map<String, List<String>> LEAD_TRANSITIONS =
            Map.of(
                    CRM_NEW,
                    List.of(CRM_QUALIFYING, CRM_QUALIFIED, CRM_VISIT_PLANNED, CRM_CLOSED_LOST),
                    CRM_QUALIFYING,
                    List.of(CRM_QUALIFIED, CRM_CLOSED_LOST),
                    CRM_QUALIFIED,
                    List.of(CRM_VISIT_PLANNED, CRM_CLOSED_LOST),
                    CRM_VISIT_PLANNED,
                    List.of(CRM_CLOSED_WON, CRM_CLOSED_LOST));

    private DossierWorkflowCatalog() {}

    public static Optional<DossierWorkflow> systemWorkflow(String caseType) {
        if (caseType == null || !SYSTEM_CASE_TYPES.contains(caseType)) {
            return Optional.empty();
        }
        List<Transition> transitions =
                LEAD_TRANSITIONS.entrySet().stream()
                        .flatMap(
                                e ->
                                        e.getValue().stream()
                                                .map(
                                                        to ->
                                                                new Transition(
                                                                        e.getKey(),
                                                                        to,
                                                                        List.of(),
                                                                        List.of())))
                        .toList();
        return Optional.of(
                new DossierWorkflow(
                        caseType,
                        DossierWorkflow.SOURCE_SYSTEM,
                        null,
                        CRM_NEW,
                        LEAD_STATES,
                        transitions));
    }
}
