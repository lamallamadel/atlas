package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class IntegrationTestRequest {

    @NotBlank(message = "Provider type is required (whatsapp, email, sms)")
    private String providerType;

    @NotNull(message = "Credentials are required")
    private Map<String, String> credentials;

    private Map<String, Object> config;

    public IntegrationTestRequest() {
    }

    public IntegrationTestRequest(String providerType, Map<String, String> credentials, Map<String, Object> config) {
        this.providerType = providerType;
        this.credentials = credentials;
        this.config = config;
    }

    public String getProviderType() {
        return providerType;
    }

    public void setProviderType(String providerType) {
        this.providerType = providerType;
    }

    public Map<String, String> getCredentials() {
        return credentials;
    }

    public void setCredentials(Map<String, String> credentials) {
        this.credentials = credentials;
    }

    public Map<String, Object> getConfig() {
        return config;
    }

    public void setConfig(Map<String, Object> config) {
        this.config = config;
    }
}
