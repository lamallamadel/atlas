package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "tenant_provisioning",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_tenant_provisioning_org_id",
                    columnNames = {"org_id"})
        })
public class TenantProvisioningEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 255)
    private String orgId;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "pending";

    @Column(name = "provisioning_step", length = 100)
    private String provisioningStep;

    @Column(name = "progress_percent")
    private Integer progressPercent = 0;

    @Column(name = "plan_tier", nullable = false, length = 50)
    private String planTier = "starter";

    @Column(name = "admin_user_email", nullable = false, length = 255)
    private String adminUserEmail;

    @Column(name = "admin_user_name", length = 255)
    private String adminUserName;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "include_sample_data")
    private Boolean includeSampleData = true;

    @Column(name = "sample_data_generated")
    private Boolean sampleDataGenerated = false;

    @Column(name = "provisioning_started_at")
    private LocalDateTime provisioningStartedAt;

    @Column(name = "provisioning_completed_at")
    private LocalDateTime provisioningCompletedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProvisioningStep() {
        return provisioningStep;
    }

    public void setProvisioningStep(String provisioningStep) {
        this.provisioningStep = provisioningStep;
    }

    public Integer getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(Integer progressPercent) {
        this.progressPercent = progressPercent;
    }

    public String getPlanTier() {
        return planTier;
    }

    public void setPlanTier(String planTier) {
        this.planTier = planTier;
    }

    public String getAdminUserEmail() {
        return adminUserEmail;
    }

    public void setAdminUserEmail(String adminUserEmail) {
        this.adminUserEmail = adminUserEmail;
    }

    public String getAdminUserName() {
        return adminUserName;
    }

    public void setAdminUserName(String adminUserName) {
        this.adminUserName = adminUserName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public Boolean getIncludeSampleData() {
        return includeSampleData;
    }

    public void setIncludeSampleData(Boolean includeSampleData) {
        this.includeSampleData = includeSampleData;
    }

    public Boolean getSampleDataGenerated() {
        return sampleDataGenerated;
    }

    public void setSampleDataGenerated(Boolean sampleDataGenerated) {
        this.sampleDataGenerated = sampleDataGenerated;
    }

    public LocalDateTime getProvisioningStartedAt() {
        return provisioningStartedAt;
    }

    public void setProvisioningStartedAt(LocalDateTime provisioningStartedAt) {
        this.provisioningStartedAt = provisioningStartedAt;
    }

    public LocalDateTime getProvisioningCompletedAt() {
        return provisioningCompletedAt;
    }

    public void setProvisioningCompletedAt(LocalDateTime provisioningCompletedAt) {
        this.provisioningCompletedAt = provisioningCompletedAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
