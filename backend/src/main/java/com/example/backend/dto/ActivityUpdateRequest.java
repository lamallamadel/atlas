package com.example.backend.dto;

import com.example.backend.entity.enums.ActivityVisibility;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request to update an activity")
public class ActivityUpdateRequest {

    @Schema(description = "Activity content", example = "Updated note content")
    private String content;

    @Schema(description = "Activity visibility", example = "CLIENT_VISIBLE")
    private ActivityVisibility visibility;

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
}
