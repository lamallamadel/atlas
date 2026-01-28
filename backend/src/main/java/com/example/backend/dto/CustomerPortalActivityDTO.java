package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class CustomerPortalActivityDTO {
    private Long id;
    private String type;
    private String content;
    private String friendlyDescription;
    private LocalDateTime createdAt;
    private Map<String, Object> metadata;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getFriendlyDescription() {
        return friendlyDescription;
    }

    public void setFriendlyDescription(String friendlyDescription) {
        this.friendlyDescription = friendlyDescription;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
