package com.example.backend.dto;

import java.time.LocalDateTime;

public class SystemConfigResponse {

    private Long id;
    private NetworkSettingsDto networkSettings;
    private SecuritySettingsDto securitySettings;
    private PerformanceSettingsDto performanceSettings;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SystemConfigResponse() {
    }

    public SystemConfigResponse(Long id, NetworkSettingsDto networkSettings, SecuritySettingsDto securitySettings, 
                               PerformanceSettingsDto performanceSettings, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.networkSettings = networkSettings;
        this.securitySettings = securitySettings;
        this.performanceSettings = performanceSettings;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NetworkSettingsDto getNetworkSettings() {
        return networkSettings;
    }

    public void setNetworkSettings(NetworkSettingsDto networkSettings) {
        this.networkSettings = networkSettings;
    }

    public SecuritySettingsDto getSecuritySettings() {
        return securitySettings;
    }

    public void setSecuritySettings(SecuritySettingsDto securitySettings) {
        this.securitySettings = securitySettings;
    }

    public PerformanceSettingsDto getPerformanceSettings() {
        return performanceSettings;
    }

    public void setPerformanceSettings(PerformanceSettingsDto performanceSettings) {
        this.performanceSettings = performanceSettings;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
