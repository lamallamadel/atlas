package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Response from dry-run message send validation")
public class WhatsAppDryRunResponse {

    @Schema(description = "Phone number validated", example = "+14155551234")
    private String phoneNumber;

    @Schema(description = "Template code validated", example = "appointment_reminder")
    private String templateCode;

    @Schema(description = "Whether the session window is currently active", example = "true")
    private boolean sessionWindowActive;

    @Schema(description = "When the session window expires")
    private LocalDateTime sessionWindowExpiresAt;

    @Schema(description = "Whether the message can be sent", example = "true")
    private boolean canSend;

    @Schema(description = "Whether a duplicate message was detected", example = "false")
    private boolean duplicateDetected;

    @Schema(description = "Overall validation result", example = "true")
    private boolean valid;

    @Schema(description = "Validation message with details")
    private String validationMessage;

    @Schema(description = "Response timestamp")
    private LocalDateTime timestamp;

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

    public boolean isSessionWindowActive() {
        return sessionWindowActive;
    }

    public void setSessionWindowActive(boolean sessionWindowActive) {
        this.sessionWindowActive = sessionWindowActive;
    }

    public LocalDateTime getSessionWindowExpiresAt() {
        return sessionWindowExpiresAt;
    }

    public void setSessionWindowExpiresAt(LocalDateTime sessionWindowExpiresAt) {
        this.sessionWindowExpiresAt = sessionWindowExpiresAt;
    }

    public boolean isCanSend() {
        return canSend;
    }

    public void setCanSend(boolean canSend) {
        this.canSend = canSend;
    }

    public boolean isDuplicateDetected() {
        return duplicateDetected;
    }

    public void setDuplicateDetected(boolean duplicateDetected) {
        this.duplicateDetected = duplicateDetected;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getValidationMessage() {
        return validationMessage;
    }

    public void setValidationMessage(String validationMessage) {
        this.validationMessage = validationMessage;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
