package com.example.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkOperationResponse {

    private int successCount;
    private int failureCount;
    private List<BulkOperationError> errors;

    public BulkOperationResponse() {
        this.errors = new ArrayList<>();
    }

    public BulkOperationResponse(int successCount, int failureCount, List<BulkOperationError> errors) {
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(int failureCount) {
        this.failureCount = failureCount;
    }

    public List<BulkOperationError> getErrors() {
        return errors;
    }

    public void setErrors(List<BulkOperationError> errors) {
        this.errors = errors;
    }

    public void addError(BulkOperationError error) {
        this.errors.add(error);
    }

    public static class BulkOperationError {
        private Long id;
        private String message;

        public BulkOperationError() {
        }

        public BulkOperationError(Long id, String message) {
            this.id = id;
            this.message = message;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
