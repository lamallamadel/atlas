package com.example.backend.dto;

import java.util.List;
import java.util.Map;

public class AiAgentResponse {
    private AgentIntent intent;
    private String answer;
    private List<Map<String, Object>> actions;
    private String conversationId;
    private String engine;

    public AgentIntent getIntent() {
        return intent;
    }

    public void setIntent(AgentIntent intent) {
        this.intent = intent;
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

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getEngine() {
        return engine;
    }

    public void setEngine(String engine) {
        this.engine = engine;
    }

    public static class AgentIntent {
        private String type;
        private Double confidence;
        private Map<String, Object> params;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
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
    }
}
