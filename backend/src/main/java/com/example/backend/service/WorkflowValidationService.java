package com.example.backend.service;

import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.entity.WorkflowTransition;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.exception.WorkflowValidationException;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.repository.WorkflowTransitionRepository;
import com.example.backend.util.TenantContext;
import com.example.backend.workflow.DossierStatusCodes;
import com.example.backend.workflow.DossierWorkflow;
import com.example.backend.workflow.DossierWorkflowResolver;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Valide les transitions de statut d'un dossier contre le workflow de son type (ADR 0004).
 *
 * <p>Le workflow vient de la définition publiée et active de l'organisation, sinon du modèle
 * système ({@link com.example.backend.workflow.DossierWorkflowCatalog}). Un dossier sans type est
 * traité comme {@code CRM_LEAD}. Les statuts reçus sous forme de noms d'enum ({@code NEW}, …) sont
 * ramenés aux codes de la nomenclature ({@code CRM_NEW}, …).
 *
 * <p>La validation de base ({@link DossierStatusTransitionService}) reste appliquée en amont
 * pendant la migration. Chaque tentative est enregistrée dans {@code workflow_transition}.
 */
@Service
public class WorkflowValidationService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final AppointmentRepository appointmentRepository;
    private final DossierStatusTransitionService dossierStatusTransitionService;
    private final DossierWorkflowResolver workflowResolver;

    public WorkflowValidationService(
            WorkflowDefinitionRepository workflowDefinitionRepository,
            WorkflowTransitionRepository workflowTransitionRepository,
            AppointmentRepository appointmentRepository,
            DossierStatusTransitionService dossierStatusTransitionService,
            DossierWorkflowResolver workflowResolver) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.appointmentRepository = appointmentRepository;
        this.dossierStatusTransitionService = dossierStatusTransitionService;
        this.workflowResolver = workflowResolver;
    }

    @Transactional
    public void validateAndRecordTransition(
            Dossier dossier, String fromStatus, String toStatus, String userId, String reason) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        String caseType = DossierStatusCodes.effectiveCaseType(dossier.getCaseType());
        String from = DossierStatusCodes.normalize(fromStatus);
        String to = DossierStatusCodes.normalize(toStatus);

        WorkflowTransition transition = new WorkflowTransition();
        transition.setOrgId(orgId);
        transition.setDossierId(dossier.getId());
        transition.setCaseType(caseType);
        transition.setFromStatus(from);
        transition.setToStatus(to);
        transition.setUserId(userId);
        transition.setReason(reason);
        transition.setTransitionedAt(LocalDateTime.now());

        Optional<DossierWorkflow> resolved = workflowResolver.resolve(orgId, caseType);
        if (resolved.isEmpty()) {
            Map<String, Object> errors = new HashMap<>();
            errors.put(
                    "transition",
                    String.format("No workflow is defined for case type %s", caseType));
            errors.put(
                    "actionableMessage",
                    String.format(
                            "Aucun workflow n'est publié pour le type de dossier '%s'. "
                                    + "Publiez-en un dans l'administration des workflows.",
                            caseType));
            reject(transition, errors, from, to, caseType);
        }
        DossierWorkflow workflow = resolved.get();

        Optional<DossierWorkflow.Transition> rule = workflow.transition(from, to);
        if (rule.isEmpty()) {
            List<String> allowed = workflow.targetsFrom(from);
            Map<String, Object> errors = new HashMap<>();
            errors.put(
                    "transition",
                    String.format(
                            "Transition from %s to %s is not allowed for case type %s",
                            from, to, caseType));
            errors.put("allowedTransitions", allowed);
            errors.put(
                    "actionableMessage",
                    String.format(
                            "The status transition from '%s' to '%s' is not configured in your workflow. "
                                    + "Please configure this transition in the workflow definition or choose from the allowed transitions: %s",
                            from, to, String.join(", ", allowed)));
            reject(transition, errors, from, to, caseType);
        }

        WorkflowDefinition definition = workflow.definition().orElseGet(WorkflowDefinition::new);
        Map<String, Object> validationErrors = new HashMap<>();

        validateRequiredFields(dossier, definition, rule.get(), validationErrors);

        validateRoleBasedAuthorization(to, rule.get(), validationErrors);

        validatePreConditions(dossier, definition, to, validationErrors);

        validateCustomConditions(dossier, definition, validationErrors);

        if (!validationErrors.isEmpty()) {
            transition.setIsAllowed(false);
            transition.setValidationErrorsJson(validationErrors);
            workflowTransitionRepository.save(transition);

            throw new WorkflowValidationException(
                    String.format(
                            "Workflow validation failed for transition from %s to %s", from, to),
                    validationErrors);
        }

        transition.setIsAllowed(true);
        transition.setValidationErrorsJson(null);
        workflowTransitionRepository.save(transition);
    }

    private void reject(
            WorkflowTransition transition,
            Map<String, Object> errors,
            String from,
            String to,
            String caseType) {
        transition.setIsAllowed(false);
        transition.setValidationErrorsJson(errors);
        workflowTransitionRepository.save(transition);
        throw new WorkflowValidationException(
                String.format(
                        "Invalid workflow transition from %s to %s for case type %s",
                        from, to, caseType),
                errors);
    }

    /**
     * Champs exigés par la transition ({@code requiredFields}) et par la définition ({@code
     * metadata_json.requiredFields}). Les raisons de clôture ne sont plus imposées en dur : elles
     * le sont par le workflow (ADR 0004).
     */
    private void validateRequiredFields(
            Dossier dossier,
            WorkflowDefinition definition,
            DossierWorkflow.Transition rule,
            Map<String, Object> errors) {
        List<String> missingFields = new ArrayList<>();
        List<String> actionableMessages = new ArrayList<>();

        for (String fieldName : rule.requiredFields()) {
            Object fieldValue = getFieldValue(dossier, fieldName);
            if (isBlankValue(fieldValue)) {
                missingFields.add(fieldName);
                actionableMessages.add(
                        String.format(
                                "Field '%s' is required for this transition. Please provide a valid value.",
                                fieldName));
            }
        }

        Map<String, Object> requiredFields = definition.getRequiredFieldsJson();
        if (requiredFields != null && !requiredFields.isEmpty()) {
            for (Map.Entry<String, Object> entry : requiredFields.entrySet()) {
                String fieldName = entry.getKey();
                if (Boolean.TRUE.equals(entry.getValue()) && !missingFields.contains(fieldName)) {
                    Object fieldValue = getFieldValue(dossier, fieldName);
                    if (isBlankValue(fieldValue)) {
                        missingFields.add(fieldName);
                        actionableMessages.add(
                                String.format(
                                        "Field '%s' is required for this transition. Please provide a valid value.",
                                        fieldName));
                    }
                }
            }
        }

        if (!missingFields.isEmpty()) {
            errors.put("missingRequiredFields", missingFields);
            errors.put("requiredFieldsActionableMessages", actionableMessages);
        }
    }

    private static boolean isBlankValue(Object value) {
        return value == null || (value instanceof String str && str.isBlank());
    }

    /** Rôles autorisés déclarés par la transition ; aucun rôle déclaré = pas de restriction. */
    private void validateRoleBasedAuthorization(
            String toStatus, DossierWorkflow.Transition rule, Map<String, Object> errors) {
        if (rule.allowedRoles().isEmpty()) {
            return;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            errors.put("roleAuthorizationError", "Authentication required for this transition");
            errors.put(
                    "roleActionableMessage",
                    "You must be authenticated to perform this transition. Please log in and try again.");
            return;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        boolean allowed =
                authorities.stream()
                        .map(GrantedAuthority::getAuthority)
                        .anyMatch(
                                auth ->
                                        rule.allowedRoles().stream()
                                                .anyMatch(
                                                        role ->
                                                                auth.equalsIgnoreCase(role)
                                                                        || auth.equalsIgnoreCase(
                                                                                "ROLE_" + role)));

        if (!allowed) {
            errors.put(
                    "roleAuthorizationError",
                    String.format(
                            "Transition to %s requires one of the roles %s",
                            toStatus, rule.allowedRoles()));
            errors.put(
                    "roleActionableMessage",
                    String.format(
                            "Only users with one of the roles %s can move dossiers to '%s' status. "
                                    + "Your current roles are: %s. Please contact your administrator to request the appropriate role.",
                            rule.allowedRoles(),
                            toStatus,
                            authorities.stream().map(GrantedAuthority::getAuthority).toList()));
        }
    }

    private void validatePreConditions(
            Dossier dossier,
            WorkflowDefinition definition,
            String toStatus,
            Map<String, Object> errors) {
        if ("CRM_VISIT_DONE".equalsIgnoreCase(toStatus)) {
            List<AppointmentEntity> appointments = dossier.getAppointments();
            boolean hasCompletedAppointment =
                    appointments.stream()
                            .anyMatch(apt -> apt.getStatus() == AppointmentStatus.COMPLETED);

            if (!hasCompletedAppointment) {
                errors.put("preConditionError", "At least one completed appointment is required");
                errors.put(
                        "preConditionActionableMessage",
                        String.format(
                                "Before moving to '%s' status, you must have at least one completed appointment. "
                                        + "Please create and mark an appointment as completed, or if an appointment has already occurred, "
                                        + "update its status to COMPLETED.",
                                toStatus));
            }
        }

        Map<String, Object> conditions = definition.getConditionsJson();
        if (conditions != null && conditions.containsKey("requiresAppointment")) {
            Object requiresAppointment = conditions.get("requiresAppointment");
            if (Boolean.TRUE.equals(requiresAppointment)) {
                List<AppointmentEntity> appointments = dossier.getAppointments();
                if (appointments == null || appointments.isEmpty()) {
                    errors.put(
                            "preConditionError",
                            "At least one appointment is required for this transition");
                    errors.put(
                            "preConditionActionableMessage",
                            "This transition requires scheduling at least one appointment with the client. "
                                    + "Please create an appointment before proceeding.");
                }
            }
        }

        if (conditions != null && conditions.containsKey("requiresCompletedAppointment")) {
            Object requiresCompleted = conditions.get("requiresCompletedAppointment");
            if (Boolean.TRUE.equals(requiresCompleted)) {
                List<AppointmentEntity> appointments = dossier.getAppointments();
                boolean hasCompleted =
                        appointments != null
                                && appointments.stream()
                                        .anyMatch(
                                                apt ->
                                                        apt.getStatus()
                                                                == AppointmentStatus.COMPLETED);

                if (!hasCompleted) {
                    errors.put(
                            "preConditionError", "At least one completed appointment is required");
                    errors.put(
                            "preConditionActionableMessage",
                            "This transition requires at least one completed appointment. "
                                    + "Please ensure an appointment has been marked as COMPLETED.");
                }
            }
        }
    }

    private void validateCustomConditions(
            Dossier dossier, WorkflowDefinition definition, Map<String, Object> errors) {
        Map<String, Object> conditions = definition.getConditionsJson();
        if (conditions == null || conditions.isEmpty()) {
            return;
        }

        List<String> failedConditions = new ArrayList<>();
        List<String> actionableMessages = new ArrayList<>();

        for (Map.Entry<String, Object> entry : conditions.entrySet()) {
            String conditionName = entry.getKey();
            Object conditionValue = entry.getValue();

            if (conditionName.equals("requiresAppointment")
                    || conditionName.equals("requiresCompletedAppointment")) {
                continue;
            }

            if (conditionValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> condition = (Map<String, Object>) conditionValue;

                String field = (String) condition.get("field");
                String operator = (String) condition.get("operator");
                Object expectedValue = condition.get("value");

                if (field != null && operator != null) {
                    Object actualValue = getFieldValue(dossier, field);
                    if (!evaluateCondition(actualValue, operator, expectedValue)) {
                        String conditionDesc =
                                String.format(
                                        "%s: %s %s %s",
                                        conditionName, field, operator, expectedValue);
                        failedConditions.add(conditionDesc);

                        String actionableMessage =
                                buildActionableMessageForCondition(
                                        field, operator, expectedValue, actualValue);
                        actionableMessages.add(actionableMessage);
                    }
                }
            }
        }

        if (!failedConditions.isEmpty()) {
            errors.put("failedConditions", failedConditions);
            errors.put("conditionsActionableMessages", actionableMessages);
        }
    }

    private String buildActionableMessageForCondition(
            String field, String operator, Object expectedValue, Object actualValue) {
        String actualValueStr = actualValue == null ? "not set" : actualValue.toString();

        switch (operator) {
            case "equals":
                return String.format(
                        "Field '%s' must equal '%s', but current value is '%s'. "
                                + "Please update this field to the required value.",
                        field, expectedValue, actualValueStr);
            case "notEquals":
                return String.format(
                        "Field '%s' must not equal '%s', but current value is '%s'. "
                                + "Please change this field to a different value.",
                        field, expectedValue, actualValueStr);
            case "greaterThan":
                return String.format(
                        "Field '%s' must be greater than '%s', but current value is '%s'. "
                                + "Please increase the value of this field.",
                        field, expectedValue, actualValueStr);
            case "lessThan":
                return String.format(
                        "Field '%s' must be less than '%s', but current value is '%s'. "
                                + "Please decrease the value of this field.",
                        field, expectedValue, actualValueStr);
            case "greaterThanOrEqual":
                return String.format(
                        "Field '%s' must be greater than or equal to '%s', but current value is '%s'. "
                                + "Please ensure the value meets the minimum requirement.",
                        field, expectedValue, actualValueStr);
            case "lessThanOrEqual":
                return String.format(
                        "Field '%s' must be less than or equal to '%s', but current value is '%s'. "
                                + "Please ensure the value does not exceed the maximum.",
                        field, expectedValue, actualValueStr);
            case "isNull":
                return String.format(
                        "Field '%s' must be empty/null, but current value is '%s'. "
                                + "Please clear this field.",
                        field, actualValueStr);
            case "isNotNull":
                return String.format(
                        "Field '%s' must have a value, but it is currently empty. "
                                + "Please provide a value for this field.",
                        field);
            case "isEmpty":
                return String.format(
                        "Field '%s' must be empty, but current value is '%s'. "
                                + "Please clear this field.",
                        field, actualValueStr);
            case "isNotEmpty":
                return String.format(
                        "Field '%s' must have a value, but it is currently empty. "
                                + "Please provide a value for this field.",
                        field);
            default:
                return String.format(
                        "Field '%s' does not meet the condition: %s %s. Current value: '%s'",
                        field, operator, expectedValue, actualValueStr);
        }
    }

    private boolean evaluateCondition(Object actualValue, String operator, Object expectedValue) {
        switch (operator) {
            case "equals":
                return Objects.equals(actualValue, expectedValue);
            case "notEquals":
                return !Objects.equals(actualValue, expectedValue);
            case "greaterThan":
                return compareValues(actualValue, expectedValue) > 0;
            case "lessThan":
                return compareValues(actualValue, expectedValue) < 0;
            case "greaterThanOrEqual":
                return compareValues(actualValue, expectedValue) >= 0;
            case "lessThanOrEqual":
                return compareValues(actualValue, expectedValue) <= 0;
            case "isNull":
                return actualValue == null;
            case "isNotNull":
                return actualValue != null;
            case "isEmpty":
                return actualValue == null
                        || (actualValue instanceof String && ((String) actualValue).isEmpty());
            case "isNotEmpty":
                return actualValue != null
                        && !(actualValue instanceof String && ((String) actualValue).isEmpty());
            default:
                return false;
        }
    }

    @SuppressWarnings("unchecked")
    private int compareValues(Object actual, Object expected) {
        if (actual == null && expected == null) return 0;
        if (actual == null) return -1;
        if (expected == null) return 1;

        if (actual instanceof Comparable && expected instanceof Comparable) {
            return ((Comparable<Object>) actual).compareTo(expected);
        }

        return 0;
    }

    private Object getFieldValue(Dossier dossier, String fieldName) {
        return switch (fieldName) {
            case "leadName" -> dossier.getLeadName();
            case "leadPhone" -> dossier.getLeadPhone();
            case "leadEmail" -> dossier.getLeadEmail();
            case "leadSource" -> dossier.getLeadSource();
            case "notes" -> dossier.getNotes();
            case "score" -> dossier.getScore();
            case "annonceId" -> dossier.getAnnonceId();
            case "statusCode" -> dossier.getStatusCode();
            case "lossReason" -> dossier.getLossReason();
            case "wonReason" -> dossier.getWonReason();
            case "caseType" -> dossier.getCaseType();
            default -> null;
        };
    }

    /** Statuts atteignables depuis {@code currentStatus} pour ce type de dossier (codes). */
    public List<String> getAllowedNextStatuses(String caseType, String currentStatus) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        String from = DossierStatusCodes.normalize(currentStatus);
        return workflowResolver
                .resolve(orgId, caseType)
                .map(w -> w.targetsFrom(from))
                .orElse(Collections.emptyList());
    }

    public Map<String, Object> checkTransitionValidity(
            Dossier dossier, String fromStatus, String toStatus) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        String caseType = DossierStatusCodes.effectiveCaseType(dossier.getCaseType());
        String from = DossierStatusCodes.normalize(fromStatus);
        String to = DossierStatusCodes.normalize(toStatus);
        Map<String, Object> result = new HashMap<>();
        result.put("isValid", true);

        Optional<DossierWorkflow> resolved = workflowResolver.resolve(orgId, caseType);
        if (resolved.isEmpty()) {
            result.put("isValid", false);
            result.put("error", String.format("No workflow is defined for case type %s", caseType));
            return result;
        }
        DossierWorkflow workflow = resolved.get();
        Optional<DossierWorkflow.Transition> rule = workflow.transition(from, to);
        if (rule.isEmpty()) {
            result.put("isValid", false);
            result.put("error", String.format("Transition from %s to %s is not allowed", from, to));
            result.put("allowedTransitions", workflow.targetsFrom(from));
            return result;
        }

        WorkflowDefinition definition = workflow.definition().orElseGet(WorkflowDefinition::new);
        Map<String, Object> validationErrors = new HashMap<>();

        validateRequiredFields(dossier, definition, rule.get(), validationErrors);
        validateRoleBasedAuthorization(to, rule.get(), validationErrors);
        validatePreConditions(dossier, definition, to, validationErrors);
        validateCustomConditions(dossier, definition, validationErrors);

        if (!validationErrors.isEmpty()) {
            result.put("isValid", false);
            result.put("validationErrors", validationErrors);
        }

        return result;
    }

    public void validateWorkflowStructure(WorkflowDefinition workflow) {
        List<String> errors = new ArrayList<>();

        if (workflow.getStatesJson() == null || workflow.getStatesJson().isEmpty()) {
            errors.add("Workflow must have at least one state");
        }

        if (workflow.getTransitionsJson() == null || workflow.getTransitionsJson().isEmpty()) {
            errors.add("Workflow must have at least one transition");
        }

        if (workflow.getInitialState() == null || workflow.getInitialState().isBlank()) {
            errors.add("Workflow must have an initial state");
        }

        if (workflow.getFinalStates() == null || workflow.getFinalStates().isBlank()) {
            errors.add("Workflow must have at least one final state");
        }

        if (!errors.isEmpty()) {
            throw new WorkflowValidationException(
                    "Workflow structure validation failed", Map.of("errors", errors));
        }
    }
}
