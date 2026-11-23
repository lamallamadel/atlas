package com.example.backend.workflow;

import com.example.backend.entity.WorkflowDefinition;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Workflow effectif d'un type de dossier : états (avec leur sémantique) et transitions autorisées.
 *
 * <p>Provient soit de la {@link WorkflowDefinition} publiée et active de l'organisation, soit du
 * modèle système ({@link DossierWorkflowCatalog}). Voir ADR 0004.
 */
public final class DossierWorkflow {

    /** Issue d'un état : en cours, gagné ou perdu. */
    public enum Stage {
        OPEN,
        WON,
        LOST
    }

    /** Étape commune de l'entonnoir, pour comparer les métiers entre eux. */
    public enum FunnelStep {
        NEW,
        QUALIFICATION,
        VISIT,
        OFFER,
        CLOSING
    }

    public record State(String code, Stage stage, FunnelStep funnelStep, List<String> requires) {
        public State {
            requires = requires == null ? List.of() : List.copyOf(requires);
        }

        public boolean isTerminal() {
            return stage != Stage.OPEN;
        }
    }

    public record Transition(
            String from, String to, List<String> requiredFields, List<String> allowedRoles) {
        public Transition {
            requiredFields = requiredFields == null ? List.of() : List.copyOf(requiredFields);
            allowedRoles = allowedRoles == null ? List.of() : List.copyOf(allowedRoles);
        }
    }

    public static final String SOURCE_SYSTEM = "SYSTEM";
    public static final String SOURCE_ORG = "ORG";

    private final String caseType;
    private final String source;
    private final WorkflowDefinition definition;
    private final String initialState;
    private final Map<String, State> states;
    private final List<Transition> transitions;

    DossierWorkflow(
            String caseType,
            String source,
            WorkflowDefinition definition,
            String initialState,
            Collection<State> states,
            List<Transition> transitions) {
        this.caseType = caseType;
        this.source = source;
        this.definition = definition;
        this.initialState = initialState;
        Map<String, State> byCode = new LinkedHashMap<>();
        for (State s : states) {
            byCode.put(s.code(), s);
        }
        this.states = Collections.unmodifiableMap(byCode);
        this.transitions = List.copyOf(transitions);
    }

    public String caseType() {
        return caseType;
    }

    /** {@link #SOURCE_SYSTEM} ou {@link #SOURCE_ORG}. */
    public String source() {
        return source;
    }

    /** Définition de l'organisation, absente pour un modèle système. */
    public Optional<WorkflowDefinition> definition() {
        return Optional.ofNullable(definition);
    }

    public String initialState() {
        return initialState;
    }

    public Optional<State> state(String code) {
        return Optional.ofNullable(states.get(code));
    }

    public boolean hasState(String code) {
        return states.containsKey(code);
    }

    public List<String> stateCodes() {
        return new ArrayList<>(states.keySet());
    }

    public Optional<Transition> transition(String from, String to) {
        return transitions.stream()
                .filter(t -> Objects.equals(t.from(), from) && Objects.equals(t.to(), to))
                .findFirst();
    }

    public List<String> targetsFrom(String from) {
        return transitions.stream()
                .filter(t -> Objects.equals(t.from(), from))
                .map(Transition::to)
                .toList();
    }

    /**
     * Construit le workflow à partir d'une définition d'organisation ({@code states_json} et {@code
     * transitions_json}, format de l'éditeur de workflows : {@code stateCode}, {@code isFinal},
     * {@code fromState}, {@code toState}, {@code requiredFields}, {@code allowedRoles}, {@code
     * isActive}). Les clés {@code stage} et {@code funnelStep} sont facultatives.
     */
    public static DossierWorkflow fromDefinition(WorkflowDefinition def) {
        List<State> states = new ArrayList<>();
        String initial = def.getInitialState();
        if (def.getStatesJson() != null) {
            for (Map<String, Object> raw : def.getStatesJson()) {
                String code = str(raw.get("stateCode"));
                if (code == null) {
                    continue;
                }
                Stage stage = parseStage(raw.get("stage"), raw.get("isFinal"), code);
                FunnelStep step = parseFunnelStep(raw.get("funnelStep"), stage);
                states.add(new State(code, stage, step, strList(raw.get("requires"))));
                if (initial == null && Boolean.TRUE.equals(raw.get("isInitial"))) {
                    initial = code;
                }
            }
        }
        List<Transition> transitions = new ArrayList<>();
        if (def.getTransitionsJson() != null) {
            for (Map<String, Object> raw : def.getTransitionsJson()) {
                if (Boolean.FALSE.equals(raw.get("isActive"))) {
                    continue;
                }
                String from = str(raw.get("fromState"));
                String to = str(raw.get("toState"));
                if (from == null || to == null) {
                    continue;
                }
                transitions.add(
                        new Transition(
                                from,
                                to,
                                strList(raw.get("requiredFields")),
                                strList(raw.get("allowedRoles"))));
            }
        }
        return new DossierWorkflow(
                def.getCaseType(), SOURCE_ORG, def, initial, states, transitions);
    }

    private static Stage parseStage(Object stage, Object isFinal, String code) {
        if (stage != null) {
            try {
                return Stage.valueOf(stage.toString().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // valeur inconnue : on retombe sur la déduction ci-dessous
            }
        }
        if (Boolean.TRUE.equals(isFinal)) {
            return code.contains("LOST") || code.contains("CANCEL") ? Stage.LOST : Stage.WON;
        }
        return Stage.OPEN;
    }

    private static FunnelStep parseFunnelStep(Object step, Stage stage) {
        if (step != null) {
            try {
                return FunnelStep.valueOf(step.toString().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // valeur inconnue : on retombe sur la déduction ci-dessous
            }
        }
        return stage == Stage.OPEN ? FunnelStep.QUALIFICATION : FunnelStep.CLOSING;
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private static List<String> strList(Object o) {
        if (o instanceof Collection<?> c) {
            return c.stream().filter(Objects::nonNull).map(Object::toString).toList();
        }
        return List.of();
    }
}
