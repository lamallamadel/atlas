package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DossierCreateRequest {

    @NotBlank(message = "Organization ID is required")
    @Size(max = 255, message = "Organization ID must not exceed 255 characters")
    private String orgId;

    private Long annonceId;

    @Size(max = 50, message = "Lead phone must not exceed 50 characters")
    private String leadPhone;

    @Size(max = 255, message = "Lead name must not exceed 255 characters")
    private String leadName;

    @Size(max = 100, message = "Lead source must not exceed 100 characters")
    private String leadSource;

    public DossierCreateRequest() {
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public Long getAnnonceId() {
        return annonceId;
    }

    public void setAnnonceId(Long annonceId) {
        this.annonceId = annonceId;
    }

    public String getLeadPhone() {
        return leadPhone;
    }

    public void setLeadPhone(String leadPhone) {
        this.leadPhone = leadPhone;
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public String getLeadSource() {
        return leadSource;
    }

    public void setLeadSource(String leadSource) {
        this.leadSource = leadSource;
    }
}
