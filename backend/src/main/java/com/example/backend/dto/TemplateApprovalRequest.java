package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request body for approving a template")
public class TemplateApprovalRequest {

    @Schema(
            description = "WhatsApp Business API template ID",
            example = "123456789",
            required = true)
    @NotBlank(message = "WhatsApp template ID is required")
    private String whatsAppTemplateId;

    public String getWhatsAppTemplateId() {
        return whatsAppTemplateId;
    }

    public void setWhatsAppTemplateId(String whatsAppTemplateId) {
        this.whatsAppTemplateId = whatsAppTemplateId;
    }
}
