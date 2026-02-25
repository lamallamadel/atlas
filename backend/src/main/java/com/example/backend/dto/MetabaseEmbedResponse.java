package com.example.backend.dto;

public class MetabaseEmbedResponse {
    private String embedUrl;
    private String token;
    private Long expiresAt;

    public MetabaseEmbedResponse() {}

    public MetabaseEmbedResponse(String embedUrl, String token, Long expiresAt) {
        this.embedUrl = embedUrl;
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public String getEmbedUrl() {
        return embedUrl;
    }

    public void setEmbedUrl(String embedUrl) {
        this.embedUrl = embedUrl;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Long expiresAt) {
        this.expiresAt = expiresAt;
    }
}
