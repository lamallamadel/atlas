package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.entity.WorkflowTransition;
import com.example.backend.exception.WorkflowValidationException;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.repository.WorkflowTransitionRepository;
import com.example.backend.util.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Validates dossier status transitions against custom workflow rules defined per case type.
 * 
 * TWO-TIER VALIDATION ARCHITECTURE:
 * 
 * 1. BASIC VALIDATION (DossierStatusTransitionService) - ALWAYS APPLIED
 *    - Enforces terminal states (WON, LOST cannot transition)
 *    - Validates allowed transitions (e.g., NEW can go to QUALIFYING, QUALIFIED, APPOINTMENT, LOST)
 *    - Applied to ALL dossiers regardless of caseType
 * 
 * 2. WORKFLOW VALIDATION (This Service) - CONDITIONAL
 *    - Only applied when dossier.caseType is set (not null/blank)
 *    - Enforces custom rules per case type (e.g., "SALE", "RENTAL")
 *    - Can require specific fields, validate conditions, or impose stricter transitions
 *    - Records all transition attempts in workflow_transition table for audit
 * 
 * BYPASS MECHANISM:
 * When caseType is null or blank, this validation is skipped, allowing:
 * - Generic dossiers without workflow constraints
 * - Legacy data migration without workflow setup
 * - Flexible transitions that only need basic validation
 */
@Service
public class WorkflowValidationService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;

    public WorkflowValidationService(
            WorkflowDefinitionRepository workflowDefinitionRepository,
            WorkflowTransitionRepository workflowTransitionRepository) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
    }

    @Transactional
    public void validateAndRecordTransition(Dossier dossier, String fromStatus, String toStatus, String userId, String reason) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        String caseType = dossier.getCaseType();
        
        // Record all workflow transitions for audit trail
        WorkflowTransition transition = new WorkflowTransition();
        transition.setOrgId(orgId);
        transition.setDossierId(dossier.getId());
        transition.setCaseType(caseType);
        transition.setFromStatus(fromStatus);
        transition.setToStatus(toStatus);
        transition.setUserId(userId);
        transition.setReason(reason);
        transition.setTransitionedAt(LocalDateTime.now());

        // BYPASS: When caseType is null or blank, skip custom workflow validation
        // This allows dossiers without a specific case type to use only the basic
        // transition rules (from DossierStatusTransitionService).
        // Use case: Generic dossiers or legacy data that doesn't require workflow constraints.
        if (caseType == null || caseType.isBlank()) {
            transition.setIsAllowed(true);
            transition.setValidationErrorsJson(null);
            workflowTransitionRepository.save(transition);
            return;
        }

        Optional<WorkflowDefinition> workflowDef = workflowDefinitionRepository.findActiveTransition(
                orgId, caseType, fromStatus, toStatus);

        if (workflowDef.isEmpty()) {
            Map<String, Object> errors = new HashMap<>();
            errors.put("transition", String.format("Transition from %s to %s is not allowed for case type %s", 
                    fromStatus, toStatus, caseType));
            errors.put("allowedTransitions", getAllowedTransitions(orgId, caseType, fromStatus));
            
            transition.setIsAllowed(false);
            transition.setValidationErrorsJson(errors);
            workflowTransitionRepository.save(transition);
            
            throw new WorkflowValidationException(
                    String.format("Invalid workflow transition from %s to %s for case type %s", 
                            fromStatus, toStatus, caseType), 
                    errors);
        }

        WorkflowDefinition definition = workflowDef.get();
        Map<String, Object> validationErrors = validateConditionsAndRequiredFields(dossier, definition);

        if (validationErrors != null && !validationErrors.isEmpty()) {
            transition.setIsAllowed(false);
            transition.setValidationErrorsJson(validationErrors);
            workflowTransitionRepository.save(transition);
            
            throw new WorkflowValidationException(
                    String.format("Workflow validation failed for transition from %s to %s", fromStatus, toStatus),
                    validationErrors);
        }

        transition.setIsAllowed(true);
        transition.setValidationErrorsJson(null);
        workflowTransitionRepository.save(transition);
    }

    private List<String> getAllowedTransitions(String orgId, String caseType, String fromStatus) {
        List<WorkflowDefinition> allowed = workflowDefinitionRepository.findAllowedTransitionsFrom(
                orgId, caseType, fromStatus);
        return allowed.stream()
                .map(WorkflowDefinition::getToStatus)
                .toList();
    }

    private Map<String, Object> validateConditionsAndRequiredFields(Dossier dossier, WorkflowDefinition definition) {
        Map<String, Object> errors = new HashMap<>();

        Map<String, Object> requiredFields = definition.getRequiredFieldsJson();
        if (requiredFields != null && !requiredFields.isEmpty()) {
            List<String> missingFields = new ArrayList<>();
            
            for (Map.Entry<String, Object> entry : requiredFields.entrySet()) {
                String fieldName = entry.getKey();
                Boolean isRequired = (Boolean) entry.getValue();
                
                if (Boolean.TRUE.equals(isRequired)) {
                    Object fieldValue = getFieldValue(dossier, fieldName);
                    if (fieldValue == null || (fieldValue instanceof String && ((String) fieldValue).isBlank())) {
                        missingFields.add(fieldName);
                    }
                }
            }
            
            if (!missingFields.isEmpty()) {
                errors.put("missingRequiredFields", missingFields);
            }
        }

        Map<String, Object> conditions = definition.getConditionsJson();
        if (conditions != null && !conditions.isEmpty()) {
            List<String> failedConditions = validateConditions(dossier, conditions);
            if (!failedConditions.isEmpty()) {
                errors.put("failedConditions", failedConditions);
            }
        }

        return errors.isEmpty() ? null : errors;
    }

    private List<String> validateConditions(Dossier dossier, Map<String, Object> conditions) {
        List<String> failed = new ArrayList<>();
        
        for (Map.Entry<String, Object> entry : conditions.entrySet()) {
            String conditionName = entry.getKey();
            Object conditionValue = entry.getValue();
            
            if (conditionValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> condition = (Map<String, Object>) conditionValue;
                
                String field = (String) condition.get("field");
                String operator = (String) condition.get("operator");
                Object expectedValue = condition.get("value");
                
                if (field != null && operator != null) {
                    Object actualValue = getFieldValue(dossier, field);
                    if (!evaluateCondition(actualValue, operator, expectedValue)) {
                        failed.add(conditionName + ": " + field + " " + operator + " " + expectedValue);
                    }
                }
            }
        }
        
        return failed;
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
                return actualValue == null || (actualValue instanceof String && ((String) actualValue).isEmpty());
            case "isNotEmpty":
                return actualValue != null && !(actualValue instanceof String && ((String) actualValue).isEmpty());
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

    public List<String> getAllowedNextStatuses(String caseType, String currentStatus) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        if (caseType == null || caseType.isBlank()) {
            return Collections.emptyList();
        }

        return getAllowedTransitions(orgId, caseType, currentStatus);
    }
}
