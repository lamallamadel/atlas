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
 * l'écran Pro ne les envoie pas.
 *
 * <p>{@code CRM_LEAD_B2B_DEMO} a son propre pipeline ({@code B2B_*}, spec {@code
 * 08_workflow_b2b_demo.md}) : raison de perte obligatoire, rendez-vous exigé pour planifier la
 * démo, réouverture et nouvelle démo réservées au manager.
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

    public static final String B2B_CASE_TYPE = "CRM_LEAD_B2B_DEMO";

    public static final String B2B_NEW = "B2B_NEW";
    public static final String B2B_QUALIFIED = "B2B_QUALIFIED";
    public static final String B2B_SCHEDULED = "B2B_SCHEDULED";
    public static final String B2B_DONE = "B2B_DONE";
    public static final String B2B_WON = "B2B_WON";
    public static final String B2B_LOST = "B2B_LOST";

    /** Rôles autorisés pour les retours en arrière du pipeline B2B. */
    private static final List<String> MANAGERS = List.of("MANAGER", "ADMIN", "SUPER_ADMIN");

    private static final List<State> B2B_STATES =
            List.of(
                    new State(B2B_NEW, Stage.OPEN, FunnelStep.NEW, List.of()),
                    new State(B2B_QUALIFIED, Stage.OPEN, FunnelStep.QUALIFICATION, List.of()),
                    new State(B2B_SCHEDULED, Stage.OPEN, FunnelStep.VISIT, List.of("appointment")),
                    new State(B2B_DONE, Stage.OPEN, FunnelStep.OFFER, List.of()),
                    new State(B2B_WON, Stage.WON, FunnelStep.CLOSING, List.of()),
                    new State(B2B_LOST, Stage.LOST, FunnelStep.CLOSING, List.of("lossReason")));

    private static final List<Transition> B2B_TRANSITIONS =
            List.of(
                    open(B2B_NEW, B2B_QUALIFIED),
                    open(B2B_QUALIFIED, B2B_SCHEDULED),
                    open(B2B_SCHEDULED, B2B_DONE),
                    open(B2B_DONE, B2B_WON),
                    open(B2B_NEW, B2B_LOST),
                    open(B2B_QUALIFIED, B2B_LOST),
                    open(B2B_SCHEDULED, B2B_LOST),
                    open(B2B_DONE, B2B_LOST),
                    new Transition(B2B_QUALIFIED, B2B_NEW, List.of(), MANAGERS),
                    new Transition(B2B_DONE, B2B_SCHEDULED, List.of(), MANAGERS));

    private DossierWorkflowCatalog() {}

    private static Transition open(String from, String to) {
        return new Transition(from, to, List.of(), List.of());
    }

    /** Catégorie de référentiel des raisons de perte pour ce type de dossier. */
    public static String lossReasonCategory(String caseType) {
        return B2B_CASE_TYPE.equals(caseType) ? "B2B_LOST_REASON" : "LOSS_REASON";
    }

    public static Optional<DossierWorkflow> systemWorkflow(String caseType) {
        if (caseType == null || !SYSTEM_CASE_TYPES.contains(caseType)) {
            return Optional.empty();
        }
        if (B2B_CASE_TYPE.equals(caseType)) {
            return Optional.of(
                    new DossierWorkflow(
                            caseType,
                            DossierWorkflow.SOURCE_SYSTEM,
                            null,
                            B2B_NEW,
                            B2B_STATES,
                            B2B_TRANSITIONS));
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
