package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CalendarSyncConfigRequest {
    
    @NotBlank(message = "Provider is required")
    private String provider;
    
    private Boolean autoSync;
    
    private Integer syncInterval;

    public CalendarSyncConfigRequest() {
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public Boolean getAutoSync() {
        return autoSync;
    }

    public void setAutoSync(Boolean autoSync) {
        this.autoSync = autoSync;
    }

    public Integer getSyncInterval() {
        return syncInterval;
    }

    public void setSyncInterval(Integer syncInterval) {
        this.syncInterval = syncInterval;
    }
}
