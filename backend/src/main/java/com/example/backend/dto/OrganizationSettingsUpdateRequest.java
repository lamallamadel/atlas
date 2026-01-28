package com.example.backend.dto;

import jakarta.validation.Valid;

public class OrganizationSettingsUpdateRequest {

    @Valid
    private BrandingSettingsDto branding;

    @Valid
    private IntegrationSettingsDto integrations;

    @Valid
    private WorkflowSettingsDto workflow;

    @Valid
    private QuotaSettingsDto quotas;

    public OrganizationSettingsUpdateRequest() {
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
}
