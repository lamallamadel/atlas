package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Registre des organisations (ADR 0005). Pas de filtre {@code orgIdFilter} : c'est la table qui dit
 * ce qu'est une organisation, lue par la plateforme.
 */
@Entity
@Table(name = "organization")
public class OrganizationEntity {

    public static final String TYPE_AGENCY = "AGENCY";
    public static final String TYPE_OWNER = "OWNER";
    public static final String TYPE_PLATFORM = "PLATFORM";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, unique = true, length = 255)
    private String orgId;

    @Column(name = "org_type", nullable = false, length = 16)
    private String orgType;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "verified", nullable = false)
    private boolean verified;

    @Column(name = "owner_user_id", length = 255)
    private String ownerUserId;

    @Column(name = "owner_phone", length = 32, unique = true)
    private String ownerPhone;

    @Column(name = "terms_version", length = 32)
    private String termsVersion;

    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isOwner() {
        return TYPE_OWNER.equals(orgType);
    }

    public Long getId() {
        return id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getOrgType() {
        return orgType;
    }

    public void setOrgType(String orgType) {
        this.orgType = orgType;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(String ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public String getOwnerPhone() {
        return ownerPhone;
    }

    public void setOwnerPhone(String ownerPhone) {
        this.ownerPhone = ownerPhone;
    }

    public String getTermsVersion() {
        return termsVersion;
    }

    public void setTermsVersion(String termsVersion) {
        this.termsVersion = termsVersion;
    }

    public LocalDateTime getTermsAcceptedAt() {
        return termsAcceptedAt;
    }

    public void setTermsAcceptedAt(LocalDateTime termsAcceptedAt) {
        this.termsAcceptedAt = termsAcceptedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
