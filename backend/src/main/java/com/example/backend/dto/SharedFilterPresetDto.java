package com.example.backend.dto;

import java.time.Instant;
import java.util.Map;

public class SharedFilterPresetDto {
    private Long id;
    private String name;
    private String description;
    private Map<String, Object> filters;
    private String sharedBy;
    private String sharedByUsername;
    private Instant sharedAt;
    private String[] sharedWithUserIds;

    public SharedFilterPresetDto() {
    }

    public SharedFilterPresetDto(Long id, String name, String description, Map<String, Object> filters, String sharedBy, String sharedByUsername) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.filters = filters;
        this.sharedBy = sharedBy;
        this.sharedByUsername = sharedByUsername;
        this.sharedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Object> getFilters() {
        return filters;
    }

    public void setFilters(Map<String, Object> filters) {
        this.filters = filters;
    }

    public String getSharedBy() {
        return sharedBy;
    }

    public void setSharedBy(String sharedBy) {
        this.sharedBy = sharedBy;
    }

    public String getSharedByUsername() {
        return sharedByUsername;
    }

    public void setSharedByUsername(String sharedByUsername) {
        this.sharedByUsername = sharedByUsername;
    }

    public Instant getSharedAt() {
        return sharedAt;
    }

    public void setSharedAt(Instant sharedAt) {
        this.sharedAt = sharedAt;
    }

    public String[] getSharedWithUserIds() {
        return sharedWithUserIds;
    }

    public void setSharedWithUserIds(String[] sharedWithUserIds) {
        this.sharedWithUserIds = sharedWithUserIds;
    }
}
