package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "tenant_onboarding", uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenant_onboarding_org_user", columnNames = {"org_id", "user_id"})
})
public class TenantOnboardingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private String orgId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "completed_steps", columnDefinition = "jsonb")
    private Map<String, Object> completedSteps;

    @Column(name = "current_step", length = 100)
    private String currentStep;

    @Column(name = "total_steps")
    private Integer totalSteps = 8;

    @Column(name = "progress_percent")
    private Integer progressPercent = 0;

    @Column(name = "onboarding_started_at", nullable = false)
    private LocalDateTime onboardingStartedAt;

    @Column(name = "onboarding_completed_at")
    private LocalDateTime onboardingCompletedAt;

    @Column(name = "profile_completed")
    private Boolean profileCompleted = false;

    @Column(name = "branding_configured")
    private Boolean brandingConfigured = false;

    @Column(name = "first_dossier_created")
    private Boolean firstDossierCreated = false;

    @Column(name = "team_member_invited")
    private Boolean teamMemberInvited = false;

    @Column(name = "integration_configured")
    private Boolean integrationConfigured = false;

    @Column(name = "workflow_configured")
    private Boolean workflowConfigured = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dismissed_tooltips", columnDefinition = "jsonb")
    private Map<String, Object> dismissedTooltips;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "watched_tutorials", columnDefinition = "jsonb")
    private Map<String, Object> watchedTutorials;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (onboardingStartedAt == null) {
            onboardingStartedAt = LocalDateTime.now();
        }
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Map<String, Object> getCompletedSteps() { return completedSteps; }
    public void setCompletedSteps(Map<String, Object> completedSteps) { this.completedSteps = completedSteps; }
    public String getCurrentStep() { return currentStep; }
    public void setCurrentStep(String currentStep) { this.currentStep = currentStep; }
    public Integer getTotalSteps() { return totalSteps; }
    public void setTotalSteps(Integer totalSteps) { this.totalSteps = totalSteps; }
    public Integer getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }
    public LocalDateTime getOnboardingStartedAt() { return onboardingStartedAt; }
    public void setOnboardingStartedAt(LocalDateTime onboardingStartedAt) { this.onboardingStartedAt = onboardingStartedAt; }
    public LocalDateTime getOnboardingCompletedAt() { return onboardingCompletedAt; }
    public void setOnboardingCompletedAt(LocalDateTime onboardingCompletedAt) { this.onboardingCompletedAt = onboardingCompletedAt; }
    public Boolean getProfileCompleted() { return profileCompleted; }
    public void setProfileCompleted(Boolean profileCompleted) { this.profileCompleted = profileCompleted; }
    public Boolean getBrandingConfigured() { return brandingConfigured; }
    public void setBrandingConfigured(Boolean brandingConfigured) { this.brandingConfigured = brandingConfigured; }
    public Boolean getFirstDossierCreated() { return firstDossierCreated; }
    public void setFirstDossierCreated(Boolean firstDossierCreated) { this.firstDossierCreated = firstDossierCreated; }
    public Boolean getTeamMemberInvited() { return teamMemberInvited; }
    public void setTeamMemberInvited(Boolean teamMemberInvited) { this.teamMemberInvited = teamMemberInvited; }
    public Boolean getIntegrationConfigured() { return integrationConfigured; }
    public void setIntegrationConfigured(Boolean integrationConfigured) { this.integrationConfigured = integrationConfigured; }
    public Boolean getWorkflowConfigured() { return workflowConfigured; }
    public void setWorkflowConfigured(Boolean workflowConfigured) { this.workflowConfigured = workflowConfigured; }
    public Map<String, Object> getDismissedTooltips() { return dismissedTooltips; }
    public void setDismissedTooltips(Map<String, Object> dismissedTooltips) { this.dismissedTooltips = dismissedTooltips; }
    public Map<String, Object> getWatchedTutorials() { return watchedTutorials; }
    public void setWatchedTutorials(Map<String, Object> watchedTutorials) { this.watchedTutorials = watchedTutorials; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
