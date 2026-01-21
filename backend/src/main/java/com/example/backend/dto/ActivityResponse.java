package com.example.backend.dto;

import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ActivityVisibility;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Activity response representation")
public class ActivityResponse {

    @Schema(description = "Unique identifier of the activity", example = "1")
    private Long id;

    @Schema(description = "Activity type", example = "NOTE")
    private ActivityType type;

    @Schema(description = "Activity content", example = "Client called to confirm appointment")
    private String content;

    @Schema(description = "Associated dossier ID", example = "1")
    private Long dossierId;

    @Schema(description = "Activity visibility", example = "INTERNAL")
    private ActivityVisibility visibility;

    @Schema(description = "Timestamp when the activity was created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "User who created the activity", example = "john.doe@example.com")
    private String createdBy;

    @Schema(description = "Display name of the user who created the activity", example = "John Doe")
    private String createdByName;

    @Schema(description = "Additional metadata for the activity in JSON format")
    private Map<String, Object> metadata;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ActivityType getType() {
        return type;
    }

    public void setType(ActivityType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public ActivityVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(ActivityVisibility visibility) {
        this.visibility = visibility;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
