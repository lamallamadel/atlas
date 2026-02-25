package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Queued WhatsApp message awaiting retry")
public class WhatsAppQueuedMessageDto {

    @Schema(description = "Message ID", example = "123")
    private Long messageId;

    @Schema(description = "Dossier ID", example = "456")
    private Long dossierId;

    @Schema(description = "Recipient phone number", example = "+14155551234")
    private String toPhone;

    @Schema(description = "Template code", example = "appointment_reminder")
    private String templateCode;

    @Schema(description = "Message status", example = "QUEUED")
    private String status;

    @Schema(description = "Number of attempts made", example = "2")
    private Integer attemptCount;

    @Schema(description = "Maximum attempts allowed", example = "5")
    private Integer maxAttempts;

    @Schema(description = "When the message was created")
    private LocalDateTime createdAt;

    @Schema(description = "When the message was last updated")
    private LocalDateTime updatedAt;

    @Schema(description = "Next retry timestamp")
    private LocalDateTime nextRetryAt;

    @Schema(description = "Error code from last attempt", example = "131047")
    private String errorCode;

    @Schema(description = "Error message from last attempt")
    private String errorMessage;

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getToPhone() {
        return toPhone;
    }

    public void setToPhone(String toPhone) {
        this.toPhone = toPhone;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
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

    public LocalDateTime getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(LocalDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
