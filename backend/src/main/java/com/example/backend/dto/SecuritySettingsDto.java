package com.example.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class SecuritySettingsDto {

    @Min(60)
    private Integer sessionTimeout;

    @NotBlank private String passwordPolicy;

    private Boolean mfaEnabled;

    @Min(1)
    private Integer maxLoginAttempts;

    public SecuritySettingsDto() {}

    public SecuritySettingsDto(
            Integer sessionTimeout,
            String passwordPolicy,
            Boolean mfaEnabled,
            Integer maxLoginAttempts) {
        this.sessionTimeout = sessionTimeout;
        this.passwordPolicy = passwordPolicy;
        this.mfaEnabled = mfaEnabled;
        this.maxLoginAttempts = maxLoginAttempts;
    }

    public Integer getSessionTimeout() {
        return sessionTimeout;
    }

    public void setSessionTimeout(Integer sessionTimeout) {
        this.sessionTimeout = sessionTimeout;
    }

    public String getPasswordPolicy() {
        return passwordPolicy;
    }

    public void setPasswordPolicy(String passwordPolicy) {
        this.passwordPolicy = passwordPolicy;
    }

    public Boolean getMfaEnabled() {
        return mfaEnabled;
    }

    public void setMfaEnabled(Boolean mfaEnabled) {
        this.mfaEnabled = mfaEnabled;
    }

    public Integer getMaxLoginAttempts() {
        return maxLoginAttempts;
    }

    public void setMaxLoginAttempts(Integer maxLoginAttempts) {
        this.maxLoginAttempts = maxLoginAttempts;
    }
}
