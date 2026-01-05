package com.example.backend.dto;

import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ActivityVisibility;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to create a new activity")
public class ActivityCreateRequest {

    @NotNull(message = "Activity type is required")
    @Schema(description = "Activity type", example = "NOTE", required = true)
    private ActivityType type;

    @Schema(description = "Activity content", example = "Client called to confirm appointment")
    private String content;

    @NotNull(message = "Dossier ID is required")
    @Schema(description = "Associated dossier ID", example = "1", required = true)
    private Long dossierId;

    @NotNull(message = "Visibility is required")
    @Schema(description = "Activity visibility", example = "INTERNAL", required = true)
    private ActivityVisibility visibility;

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
}
