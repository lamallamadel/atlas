package com.example.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public class SystemConfigUpdateRequest {

    @NotBlank(message = "Key is required")
    private String key;

    private String value;

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

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
