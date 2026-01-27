package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

@Schema(description = "User preferences data transfer object")
public class UserPreferencesDTO {

    @Schema(description = "User ID", example = "user-123")
    private String userId;

    @Schema(description = "Dashboard layout configuration")
    private Map<String, Object> dashboardLayout;

    @Schema(description = "Widget-specific settings")
    private Map<String, Object> widgetSettings;

    @Schema(description = "General user preferences")
    private Map<String, Object> generalPreferences;

    @Schema(description = "Theme preference", example = "dark")
    private String theme;

    @Schema(description = "Language preference", example = "fr")
    private String language;

    @Schema(description = "Role-based template", example = "agent")
    private String roleTemplate;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Map<String, Object> getDashboardLayout() {
        return dashboardLayout;
    }

    public void setDashboardLayout(Map<String, Object> dashboardLayout) {
        this.dashboardLayout = dashboardLayout;
    }

    public Map<String, Object> getWidgetSettings() {
        return widgetSettings;
    }

    public void setWidgetSettings(Map<String, Object> widgetSettings) {
        this.widgetSettings = widgetSettings;
    }

    public Map<String, Object> getGeneralPreferences() {
        return generalPreferences;
    }

    public void setGeneralPreferences(Map<String, Object> generalPreferences) {
        this.generalPreferences = generalPreferences;
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

    public String getRoleTemplate() {
        return roleTemplate;
    }

    public void setRoleTemplate(String roleTemplate) {
        this.roleTemplate = roleTemplate;
    }
}
