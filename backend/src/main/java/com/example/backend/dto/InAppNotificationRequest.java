package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class InAppNotificationRequest {

    private Long dossierId;

    @NotBlank(message = "Recipient is required")
    private String recipient;

    @NotBlank(message = "Subject is required")
    private String subject;

    private String message;

    private String actionUrl;

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }
}
