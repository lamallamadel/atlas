package com.example.backend.brain.dto;

import java.util.List;
import java.util.Map;

public class MatchRequest {
    private Long clientId;
    private Map<String, Object> preferences;
    private List<Map<String, Object>> biens;

    // Getters
    public Long getClientId() {
        return clientId;
    }

    public Map<String, Object> getPreferences() {
        return preferences;
    }

    public List<Map<String, Object>> getBiens() {
        return biens;
    }

    // Setters
    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public void setPreferences(Map<String, Object> preferences) {
        this.preferences = preferences;
    }

    public void setBiens(List<Map<String, Object>> biens) {
        this.biens = biens;
    }
}
