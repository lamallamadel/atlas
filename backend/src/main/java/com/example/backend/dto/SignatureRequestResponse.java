package com.example.backend.dto;

import com.example.backend.entity.enums.SignatureStatus;
import java.time.LocalDateTime;

public class SignatureRequestResponse {

    private Long id;
    private Long dossierId;
    private Long templateId;
    private String envelopeId;
    private SignatureStatus status;
    private String signers;
    private String subject;
    private String emailMessage;
    private LocalDateTime sentAt;
    private LocalDateTime viewedAt;
    private LocalDateTime signedAt;
    private LocalDateTime completedAt;
    private LocalDateTime declinedAt;
    private LocalDateTime voidedAt;
    private String declinedReason;
    private String voidedReason;
    private Long signedDocumentId;
    private String certificatePath;
    private String auditTrail;
    private Boolean workflowTriggered;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getEnvelopeId() {
        return envelopeId;
    }

    public void setEnvelopeId(String envelopeId) {
        this.envelopeId = envelopeId;
    }

    public SignatureStatus getStatus() {
        return status;
    }

    public void setStatus(SignatureStatus status) {
        this.status = status;
    }

    public String getSigners() {
        return signers;
    }

    public void setSigners(String signers) {
        this.signers = signers;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getEmailMessage() {
        return emailMessage;
    }

    public void setEmailMessage(String emailMessage) {
        this.emailMessage = emailMessage;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }

    public LocalDateTime getSignedAt() {
        return signedAt;
    }

    public void setSignedAt(LocalDateTime signedAt) {
        this.signedAt = signedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getDeclinedAt() {
        return declinedAt;
    }

    public void setDeclinedAt(LocalDateTime declinedAt) {
        this.declinedAt = declinedAt;
    }

    public LocalDateTime getVoidedAt() {
        return voidedAt;
    }

    public void setVoidedAt(LocalDateTime voidedAt) {
        this.voidedAt = voidedAt;
    }

    public String getDeclinedReason() {
        return declinedReason;
    }

    public void setDeclinedReason(String declinedReason) {
        this.declinedReason = declinedReason;
    }

    public String getVoidedReason() {
        return voidedReason;
    }

    public void setVoidedReason(String voidedReason) {
        this.voidedReason = voidedReason;
    }

    public Long getSignedDocumentId() {
        return signedDocumentId;
    }

    public void setSignedDocumentId(Long signedDocumentId) {
        this.signedDocumentId = signedDocumentId;
    }

    public String getCertificatePath() {
        return certificatePath;
    }

    public void setCertificatePath(String certificatePath) {
        this.certificatePath = certificatePath;
    }

    public String getAuditTrail() {
        return auditTrail;
    }

    public void setAuditTrail(String auditTrail) {
        this.auditTrail = auditTrail;
    }

    public Boolean getWorkflowTriggered() {
        return workflowTriggered;
    }

    public void setWorkflowTriggered(Boolean workflowTriggered) {
        this.workflowTriggered = workflowTriggered;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
