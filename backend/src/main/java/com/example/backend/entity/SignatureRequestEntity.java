package com.example.backend.entity;

import com.example.backend.entity.enums.SignatureStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "signature_request")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class SignatureRequestEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "envelope_id", length = 255)
    private String envelopeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private SignatureStatus status = SignatureStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "signers")
    private String signers;

    @Column(name = "subject", length = 500)
    private String subject;

    @Column(name = "email_message", columnDefinition = "TEXT")
    private String emailMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "declined_at")
    private LocalDateTime declinedAt;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @Column(name = "declined_reason", length = 1000)
    private String declinedReason;

    @Column(name = "voided_reason", length = 1000)
    private String voidedReason;

    @Column(name = "signed_document_id")
    private Long signedDocumentId;

    @Column(name = "certificate_path", length = 1000)
    private String certificatePath;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "audit_trail")
    private String auditTrail;

    @Column(name = "workflow_triggered", nullable = false)
    private Boolean workflowTriggered = false;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", insertable = false, updatable = false)
    private Dossier dossier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", insertable = false, updatable = false)
    private ContractTemplateEntity template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_document_id", insertable = false, updatable = false)
    private DocumentEntity signedDocument;

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

    public Dossier getDossier() {
        return dossier;
    }

    public void setDossier(Dossier dossier) {
        this.dossier = dossier;
    }

    public ContractTemplateEntity getTemplate() {
        return template;
    }

    public void setTemplate(ContractTemplateEntity template) {
        this.template = template;
    }

    public DocumentEntity getSignedDocument() {
        return signedDocument;
    }

    public void setSignedDocument(DocumentEntity signedDocument) {
        this.signedDocument = signedDocument;
    }
}
