package com.example.backend.dto;

import com.example.backend.entity.enums.ActivityVisibility;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

@Schema(description = "Request to update an activity")
public class ActivityUpdateRequest {

    @Schema(description = "Activity content", example = "Updated note content")
    private String content;

    @Schema(description = "Activity visibility", example = "CLIENT_VISIBLE")
    private ActivityVisibility visibility;

    @Schema(description = "Additional metadata for the activity in JSON format")
    private Map<String, Object> metadata;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public ActivityVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(ActivityVisibility visibility) {
        this.visibility = visibility;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
