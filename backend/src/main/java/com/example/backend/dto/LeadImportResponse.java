package com.example.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class LeadImportResponse {

    private Long importJobId;
    private Integer totalRows;
    private Integer successCount;
    private Integer errorCount;
    private Integer skippedCount;
    private List<ValidationError> validationErrors;

    public LeadImportResponse() {
        this.validationErrors = new ArrayList<>();
    }

    public Long getImportJobId() {
        return importJobId;
    }

    public void setImportJobId(Long importJobId) {
        this.importJobId = importJobId;
    }

    public Integer getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(Integer totalRows) {
        this.totalRows = totalRows;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public Integer getSkippedCount() {
        return skippedCount;
    }

    public void setSkippedCount(Integer skippedCount) {
        this.skippedCount = skippedCount;
    }

    public List<ValidationError> getValidationErrors() {
        return validationErrors;
    }

    public void setValidationErrors(List<ValidationError> validationErrors) {
        this.validationErrors = validationErrors;
    }

    public void addValidationError(int row, String field, String message) {
        this.validationErrors.add(new ValidationError(row, field, message));
    }

    public static class ValidationError {
        private int row;
        private String field;
        private String message;

        public ValidationError() {}

        public ValidationError(int row, String field, String message) {
            this.row = row;
            this.field = field;
            this.message = message;
        }

        public int getRow() {
            return row;
        }

        public void setRow(int row) {
            this.row = row;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
