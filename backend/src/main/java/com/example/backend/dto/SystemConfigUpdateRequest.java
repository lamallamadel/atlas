package com.example.backend.dto;

import jakarta.validation.Valid;

public class SystemConfigUpdateRequest {

    @Valid
    private NetworkSettingsDto networkSettings;

    @Valid
    private SecuritySettingsDto securitySettings;

    @Valid
    private PerformanceSettingsDto performanceSettings;

    public SystemConfigUpdateRequest() {
    }

    public SystemConfigUpdateRequest(NetworkSettingsDto networkSettings, SecuritySettingsDto securitySettings, 
                                    PerformanceSettingsDto performanceSettings) {
        this.networkSettings = networkSettings;
        this.securitySettings = securitySettings;
        this.performanceSettings = performanceSettings;
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
}
