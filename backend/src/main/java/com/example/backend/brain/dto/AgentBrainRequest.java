package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AgentBrainRequest {
    private String query;

    @JsonProperty("conversation_id")
    private String conversationId;

    private String context;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }
}
