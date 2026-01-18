package com.example.backend.exception;

import java.util.Map;

public class WorkflowValidationException extends RuntimeException {
    private final Map<String, Object> validationErrors;

    public WorkflowValidationException(String message, Map<String, Object> validationErrors) {
        super(message);
        this.validationErrors = validationErrors;
    }

    public WorkflowValidationException(String message) {
        super(message);
        this.validationErrors = null;
    }

    public Map<String, Object> getValidationErrors() {
        return validationErrors;
    }
}
