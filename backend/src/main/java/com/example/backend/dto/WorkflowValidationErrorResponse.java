package com.example.backend.dto;

import java.util.List;
import java.util.Map;

public class WorkflowValidationErrorResponse {

    private String message;
    private String errorType;
    private List<String> missingRequiredFields;
    private List<String> requiredFieldsActionableMessages;
    private String roleAuthorizationError;
    private String roleActionableMessage;
    private String preConditionError;
    private String preConditionActionableMessage;
    private List<String> failedConditions;
    private List<String> conditionsActionableMessages;
    private String transitionError;
    private List<String> allowedTransitions;
    private String actionableMessage;

    public WorkflowValidationErrorResponse() {}

    public WorkflowValidationErrorResponse(String message, Map<String, Object> validationErrors) {
        this.message = message;

        if (validationErrors != null) {
            this.missingRequiredFields = getListFromMap(validationErrors, "missingRequiredFields");
            this.requiredFieldsActionableMessages =
                    getListFromMap(validationErrors, "requiredFieldsActionableMessages");
            this.roleAuthorizationError =
                    getStringFromMap(validationErrors, "roleAuthorizationError");
            this.roleActionableMessage =
                    getStringFromMap(validationErrors, "roleActionableMessage");
            this.preConditionError = getStringFromMap(validationErrors, "preConditionError");
            this.preConditionActionableMessage =
                    getStringFromMap(validationErrors, "preConditionActionableMessage");
            this.failedConditions = getListFromMap(validationErrors, "failedConditions");
            this.conditionsActionableMessages =
                    getListFromMap(validationErrors, "conditionsActionableMessages");
            this.transitionError = getStringFromMap(validationErrors, "transition");
            this.allowedTransitions = getListFromMap(validationErrors, "allowedTransitions");
            this.actionableMessage = getStringFromMap(validationErrors, "actionableMessage");

            this.errorType = determineErrorType(validationErrors);
        }
    }

    private String determineErrorType(Map<String, Object> validationErrors) {
        if (validationErrors.containsKey("missingRequiredFields")) {
            return "MISSING_REQUIRED_FIELDS";
        }
        if (validationErrors.containsKey("roleAuthorizationError")) {
            return "ROLE_AUTHORIZATION_FAILED";
        }
        if (validationErrors.containsKey("preConditionError")) {
            return "PRE_CONDITION_NOT_MET";
        }
        if (validationErrors.containsKey("failedConditions")) {
            return "CUSTOM_CONDITION_FAILED";
        }
        if (validationErrors.containsKey("transition")) {
            return "INVALID_TRANSITION";
        }
        return "VALIDATION_ERROR";
    }

    @SuppressWarnings("unchecked")
    private List<String> getListFromMap(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof List) {
            return (List<String>) value;
        }
        return null;
    }

    private String getStringFromMap(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof String) {
            return (String) value;
        }
        return null;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getErrorType() {
        return errorType;
    }

    public void setErrorType(String errorType) {
        this.errorType = errorType;
    }

    public List<String> getMissingRequiredFields() {
        return missingRequiredFields;
    }

    public void setMissingRequiredFields(List<String> missingRequiredFields) {
        this.missingRequiredFields = missingRequiredFields;
    }

    public List<String> getRequiredFieldsActionableMessages() {
        return requiredFieldsActionableMessages;
    }

    public void setRequiredFieldsActionableMessages(List<String> requiredFieldsActionableMessages) {
        this.requiredFieldsActionableMessages = requiredFieldsActionableMessages;
    }

    public String getRoleAuthorizationError() {
        return roleAuthorizationError;
    }

    public void setRoleAuthorizationError(String roleAuthorizationError) {
        this.roleAuthorizationError = roleAuthorizationError;
    }

    public String getRoleActionableMessage() {
        return roleActionableMessage;
    }

    public void setRoleActionableMessage(String roleActionableMessage) {
        this.roleActionableMessage = roleActionableMessage;
    }

    public String getPreConditionError() {
        return preConditionError;
    }

    public void setPreConditionError(String preConditionError) {
        this.preConditionError = preConditionError;
    }

    public String getPreConditionActionableMessage() {
        return preConditionActionableMessage;
    }

    public void setPreConditionActionableMessage(String preConditionActionableMessage) {
        this.preConditionActionableMessage = preConditionActionableMessage;
    }

    public List<String> getFailedConditions() {
        return failedConditions;
    }

    public void setFailedConditions(List<String> failedConditions) {
        this.failedConditions = failedConditions;
    }

    public List<String> getConditionsActionableMessages() {
        return conditionsActionableMessages;
    }

    public void setConditionsActionableMessages(List<String> conditionsActionableMessages) {
        this.conditionsActionableMessages = conditionsActionableMessages;
    }

    public String getTransitionError() {
        return transitionError;
    }

    public void setTransitionError(String transitionError) {
        this.transitionError = transitionError;
    }

    public List<String> getAllowedTransitions() {
        return allowedTransitions;
    }

    public void setAllowedTransitions(List<String> allowedTransitions) {
        this.allowedTransitions = allowedTransitions;
    }

    public String getActionableMessage() {
        return actionableMessage;
    }

    public void setActionableMessage(String actionableMessage) {
        this.actionableMessage = actionableMessage;
    }
}
