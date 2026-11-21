package com.example.backend.entity;

import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Demande de confirmation envoyée au client. Lue sans contexte d'organisation (page publique) :
 * elle n'hérite donc pas du filtre multi-tenant, et l'organisation est portée par la ligne.
 */
@Entity
@Table(name = "consent_request")
public class ConsentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private String orgId;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 50)
    private ConsentementChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 50)
    private ConsentementType consentType;

    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Column(name = "decision", length = 20)
    private String decision;

    @Column(name = "consentement_id")
    private Long consentementId;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public ConsentementChannel getChannel() {
        return channel;
    }

    public void setChannel(ConsentementChannel channel) {
        this.channel = channel;
    }

    public ConsentementType getConsentType() {
        return consentType;
    }

    public void setConsentType(ConsentementType consentType) {
        this.consentType = consentType;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getAnsweredAt() {
        return answeredAt;
    }

    public void setAnsweredAt(LocalDateTime answeredAt) {
        this.answeredAt = answeredAt;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public Long getConsentementId() {
        return consentementId;
    }

    public void setConsentementId(Long consentementId) {
        this.consentementId = consentementId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
