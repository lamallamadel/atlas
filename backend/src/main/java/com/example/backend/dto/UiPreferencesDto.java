package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "UI preferences data transfer object")
public class UiPreferencesDto {

    @Schema(description = "Theme preference (light, dark, auto)", example = "dark")
    @Pattern(regexp = "^(light|dark|auto)$", message = "Theme must be one of: light, dark, auto")
    private String theme;

    @Schema(description = "Language preference (ISO 639-1 code)", example = "fr")
    @Pattern(regexp = "^[a-z]{2}$", message = "Language must be a valid ISO 639-1 two-letter code")
    private String language;

    @Schema(description = "UI density (compact, comfortable, spacious)", example = "comfortable")
    @Pattern(
            regexp = "^(compact|comfortable|spacious)$",
            message = "Density must be one of: compact, comfortable, spacious")
    private String density;

    @Schema(description = "Default route on login", example = "/dashboard")
    @Size(max = 200, message = "Default route must not exceed 200 characters")
    @Pattern(regexp = "^/.*$", message = "Default route must start with /")
    private String defaultRoute;

    public UiPreferencesDto() {}

    public UiPreferencesDto(String theme, String language, String density, String defaultRoute) {
        this.theme = theme;
        this.language = language;
        this.density = density;
        this.defaultRoute = defaultRoute;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getDensity() {
        return density;
    }

    public void setDensity(String density) {
        this.density = density;
    }

    public String getDefaultRoute() {
        return defaultRoute;
    }

    public void setDefaultRoute(String defaultRoute) {
        this.defaultRoute = defaultRoute;
    }
}
