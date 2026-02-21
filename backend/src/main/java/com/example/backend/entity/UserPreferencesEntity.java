package com.example.backend.entity;

import jakarta.persistence.*;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "user_preferences",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_user_preferences_user_org",
                    columnNames = {"user_id", "org_id"})
        })
public class UserPreferencesEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dashboard_layout", columnDefinition = "jsonb")
    private Map<String, Object> dashboardLayout;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "widget_settings", columnDefinition = "jsonb")
    private Map<String, Object> widgetSettings;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "general_preferences", columnDefinition = "jsonb")
    private Map<String, Object> generalPreferences;

    @Column(name = "theme", length = 50)
    private String theme;

    @Column(name = "language", length = 10)
    private String language;

    @Column(name = "role_template", length = 50)
    private String roleTemplate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tour_progress", columnDefinition = "jsonb")
    private Map<String, Object> tourProgress;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Map<String, Object> getTourProgress() {
        return tourProgress;
    }

    public void setTourProgress(Map<String, Object> tourProgress) {
        this.tourProgress = tourProgress;
    }
}
