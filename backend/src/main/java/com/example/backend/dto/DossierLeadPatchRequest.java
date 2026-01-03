package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request body for updating dossier lead information")
public class DossierLeadPatchRequest {

    @Schema(description = "Lead name", example = "John Doe", required = true)
    @NotBlank(message = "Lead name is required")
    @Size(max = 255, message = "Lead name must not exceed 255 characters")
    private String leadName;

    @Schema(description = "Lead phone number", example = "+33612345678", required = true)
    @NotBlank(message = "Lead phone is required")
    @Size(max = 50, message = "Lead phone must not exceed 50 characters")
    private String leadPhone;

    public DossierLeadPatchRequest() {
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public String getLeadPhone() {
        return leadPhone;
    }

    public void setLeadPhone(String leadPhone) {
        this.leadPhone = leadPhone;
    }
}
