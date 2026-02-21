package com.example.backend.dto;

import java.util.Map;

public class IntegrationTestResponse {

    private Boolean success;
    private String message;
    private Map<String, Object> details;

    public IntegrationTestResponse() {
    }

    public IntegrationTestResponse(Boolean success, String message, Map<String, Object> details) {
        this.success = success;
        this.message = message;
        this.details = details;
    }

    public static IntegrationTestResponse success(String message) {
        return new IntegrationTestResponse(true, message, null);
    }

    public static IntegrationTestResponse success(String message, Map<String, Object> details) {
        return new IntegrationTestResponse(true, message, details);
    }

    public static IntegrationTestResponse failure(String message) {
        return new IntegrationTestResponse(false, message, null);
    }

    public static IntegrationTestResponse failure(String message, Map<String, Object> details) {
        return new IntegrationTestResponse(false, message, details);
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
