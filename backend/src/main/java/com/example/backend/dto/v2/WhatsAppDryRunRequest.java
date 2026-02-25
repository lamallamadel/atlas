package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request for dry-run message send validation")
public class WhatsAppDryRunRequest {

    @NotBlank(message = "Phone number is required")
    @Schema(description = "Recipient phone number", example = "+14155551234", required = true)
    private String phoneNumber;

    @Schema(description = "Template code to validate", example = "appointment_reminder")
    private String templateCode;

    @Schema(description = "Dossier ID for duplicate detection", example = "123")
    private Long dossierId;

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }
}
