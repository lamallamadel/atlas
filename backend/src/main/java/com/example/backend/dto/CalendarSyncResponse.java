package com.example.backend.dto;

public class CalendarSyncResponse {
    
    private Boolean success;
    private Integer syncedCount;
    private String message;

    public CalendarSyncResponse() {
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public Integer getSyncedCount() {
        return syncedCount;
    }

    public void setSyncedCount(Integer syncedCount) {
        this.syncedCount = syncedCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
