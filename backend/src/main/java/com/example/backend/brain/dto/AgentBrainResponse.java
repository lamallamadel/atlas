package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class AgentBrainResponse {
    @JsonProperty("intent_type")
    private String intentType;

    private Double confidence;
    private Map<String, Object> params;
    private String answer;
    private List<Map<String, Object>> actions;
    private String engine;

    public String getIntentType() {
        return intentType;
    }

    public void setIntentType(String intentType) {
        this.intentType = intentType;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public void setParams(Map<String, Object> params) {
        this.params = params;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<Map<String, Object>> getActions() {
        return actions;
    }

    public void setActions(List<Map<String, Object>> actions) {
        this.actions = actions;
    }

    public String getEngine() {
        return engine;
    }

    public void setEngine(String engine) {
        this.engine = engine;
    }
}
