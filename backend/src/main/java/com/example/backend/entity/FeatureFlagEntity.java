package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "feature_flag", uniqueConstraints = {
    @UniqueConstraint(name = "uk_feature_flag_org_key", columnNames = {"org_id", "feature_key"})
})
public class FeatureFlagEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private String orgId;

    @Column(name = "feature_key", nullable = false, length = 100)
    private String featureKey;

    @Column(name = "feature_name", nullable = false)
    private String featureName;

    @Column(name = "feature_description", columnDefinition = "TEXT")
    private String featureDescription;

    @Column(name = "enabled")
    private Boolean enabled = false;

    @Column(name = "available_in_plans")
    private String availableInPlans;

    @Column(name = "requires_addon")
    private Boolean requiresAddon = false;

    @Column(name = "rollout_percentage")
    private Integer rolloutPercentage = 100;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "user_segments", columnDefinition = "jsonb")
    private Map<String, Object> userSegments;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
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
    public String getFeatureKey() { return featureKey; }
    public void setFeatureKey(String featureKey) { this.featureKey = featureKey; }
    public String getFeatureName() { return featureName; }
    public void setFeatureName(String featureName) { this.featureName = featureName; }
    public String getFeatureDescription() { return featureDescription; }
    public void setFeatureDescription(String featureDescription) { this.featureDescription = featureDescription; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getAvailableInPlans() { return availableInPlans; }
    public void setAvailableInPlans(String availableInPlans) { this.availableInPlans = availableInPlans; }
    public Boolean getRequiresAddon() { return requiresAddon; }
    public void setRequiresAddon(Boolean requiresAddon) { this.requiresAddon = requiresAddon; }
    public Integer getRolloutPercentage() { return rolloutPercentage; }
    public void setRolloutPercentage(Integer rolloutPercentage) { this.rolloutPercentage = rolloutPercentage; }
    public Map<String, Object> getUserSegments() { return userSegments; }
    public void setUserSegments(Map<String, Object> userSegments) { this.userSegments = userSegments; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
