package com.example.backend.dto;

import java.time.LocalDateTime;

public class OrganizationSettingsResponse {

    private Long id;
    private String orgId;
    private BrandingSettingsDto branding;
    private IntegrationSettingsDto integrations;
    private WorkflowSettingsDto workflow;
    private QuotaSettingsDto quotas;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OrganizationSettingsResponse() {
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

    public BrandingSettingsDto getBranding() {
        return branding;
    }

    public void setBranding(BrandingSettingsDto branding) {
        this.branding = branding;
    }

    public IntegrationSettingsDto getIntegrations() {
        return integrations;
    }

    public void setIntegrations(IntegrationSettingsDto integrations) {
        this.integrations = integrations;
    }

    public WorkflowSettingsDto getWorkflow() {
        return workflow;
    }

    public void setWorkflow(WorkflowSettingsDto workflow) {
        this.workflow = workflow;
    }

    public QuotaSettingsDto getQuotas() {
        return quotas;
    }

    public void setQuotas(QuotaSettingsDto quotas) {
        this.quotas = quotas;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
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
