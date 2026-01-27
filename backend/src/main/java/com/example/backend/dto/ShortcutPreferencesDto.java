package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;

@Schema(description = "Keyboard shortcut preferences data transfer object")
public class ShortcutPreferencesDto {

    @Schema(description = "Custom key bindings map (action -> key combination)", example = "{\"save\": \"Ctrl+S\", \"search\": \"Ctrl+F\"}")
    @Size(max = 50, message = "Custom key bindings must not exceed 50 entries")
    private Map<
        @Pattern(regexp = "^[a-zA-Z0-9_-]{1,50}$", message = "Action name must be alphanumeric with underscores/hyphens, max 50 characters")
        String,
        @Pattern(
            regexp = "^(Ctrl|Alt|Shift|Meta)(\\+(Ctrl|Alt|Shift|Meta))*(\\+[A-Za-z0-9])?$",
            message = "Key combination must be in format: Modifier+Key (e.g., Ctrl+S, Ctrl+Shift+F)"
        )
        String
    > customKeyBindings;

    public ShortcutPreferencesDto() {
    }

    public ShortcutPreferencesDto(Map<String, String> customKeyBindings) {
        this.customKeyBindings = customKeyBindings;
    }

    public Map<String, String> getCustomKeyBindings() {
        return customKeyBindings;
    }

    public void setCustomKeyBindings(Map<String, String> customKeyBindings) {
        this.customKeyBindings = customKeyBindings;
    }
}
