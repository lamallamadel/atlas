package com.example.backend.dto;

import java.time.LocalDateTime;

public class CalendarSyncStatusResponse {

    private String provider;
    private Boolean syncEnabled;
    private LocalDateTime lastSync;
    private LocalDateTime nextSync;

    public CalendarSyncStatusResponse() {}

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public Boolean getSyncEnabled() {
        return syncEnabled;
    }

    public void setSyncEnabled(Boolean syncEnabled) {
        this.syncEnabled = syncEnabled;
    }

    public LocalDateTime getLastSync() {
        return lastSync;
    }

    public void setLastSync(LocalDateTime lastSync) {
        this.lastSync = lastSync;
    }

    public LocalDateTime getNextSync() {
        return nextSync;
    }

    public void setNextSync(LocalDateTime nextSync) {
        this.nextSync = nextSync;
    }
}
