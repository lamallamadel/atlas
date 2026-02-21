package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.HashMap;
import java.util.Map;

public class IntegrationCredentialsDto {

    private Boolean enabled;
    
    @JsonIgnore
    private Map<String, String> credentials;
    
    private Map<String, Object> config;

    public IntegrationCredentialsDto() {
        this.credentials = new HashMap<>();
        this.config = new HashMap<>();
    }

    public IntegrationCredentialsDto(Boolean enabled, Map<String, String> credentials, Map<String, Object> config) {
        this.enabled = enabled;
        this.credentials = credentials != null ? credentials : new HashMap<>();
        this.config = config != null ? config : new HashMap<>();
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
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
