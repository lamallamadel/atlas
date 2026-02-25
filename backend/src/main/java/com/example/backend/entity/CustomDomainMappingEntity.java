package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "custom_domain_mapping",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_custom_domain_domain",
                    columnNames = {"domain"})
        })
public class CustomDomainMappingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private String orgId;

    @Column(name = "domain", nullable = false)
    private String domain;

    @Column(name = "subdomain", length = 100)
    private String subdomain;

    @Column(name = "is_primary")
    private Boolean isPrimary = false;

    @Column(name = "dns_configured")
    private Boolean dnsConfigured = false;

    @Column(name = "dns_verified_at")
    private LocalDateTime dnsVerifiedAt;

    @Column(name = "cname_target")
    private String cnameTarget;

    @Column(name = "txt_verification_code")
    private String txtVerificationCode;

    @Column(name = "ssl_enabled")
    private Boolean sslEnabled = false;

    @Column(name = "ssl_provider", length = 50)
    private String sslProvider = "letsencrypt";

    @Column(name = "ssl_certificate_arn", length = 500)
    private String sslCertificateArn;

    @Column(name = "ssl_issued_at")
    private LocalDateTime sslIssuedAt;

    @Column(name = "ssl_expires_at")
    private LocalDateTime sslExpiresAt;

    @Column(name = "ssl_auto_renew")
    private Boolean sslAutoRenew = true;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "pending_verification";

    @Column(name = "last_verification_attempt")
    private LocalDateTime lastVerificationAttempt;

    @Column(name = "verification_attempts")
    private Integer verificationAttempts = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getSubdomain() {
        return subdomain;
    }

    public void setSubdomain(String subdomain) {
        this.subdomain = subdomain;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public Boolean getDnsConfigured() {
        return dnsConfigured;
    }

    public void setDnsConfigured(Boolean dnsConfigured) {
        this.dnsConfigured = dnsConfigured;
    }

    public LocalDateTime getDnsVerifiedAt() {
        return dnsVerifiedAt;
    }

    public void setDnsVerifiedAt(LocalDateTime dnsVerifiedAt) {
        this.dnsVerifiedAt = dnsVerifiedAt;
    }

    public String getCnameTarget() {
        return cnameTarget;
    }

    public void setCnameTarget(String cnameTarget) {
        this.cnameTarget = cnameTarget;
    }

    public String getTxtVerificationCode() {
        return txtVerificationCode;
    }

    public void setTxtVerificationCode(String txtVerificationCode) {
        this.txtVerificationCode = txtVerificationCode;
    }

    public Boolean getSslEnabled() {
        return sslEnabled;
    }

    public void setSslEnabled(Boolean sslEnabled) {
        this.sslEnabled = sslEnabled;
    }

    public String getSslProvider() {
        return sslProvider;
    }

    public void setSslProvider(String sslProvider) {
        this.sslProvider = sslProvider;
    }

    public String getSslCertificateArn() {
        return sslCertificateArn;
    }

    public void setSslCertificateArn(String sslCertificateArn) {
        this.sslCertificateArn = sslCertificateArn;
    }

    public LocalDateTime getSslIssuedAt() {
        return sslIssuedAt;
    }

    public void setSslIssuedAt(LocalDateTime sslIssuedAt) {
        this.sslIssuedAt = sslIssuedAt;
    }

    public LocalDateTime getSslExpiresAt() {
        return sslExpiresAt;
    }

    public void setSslExpiresAt(LocalDateTime sslExpiresAt) {
        this.sslExpiresAt = sslExpiresAt;
    }

    public Boolean getSslAutoRenew() {
        return sslAutoRenew;
    }

    public void setSslAutoRenew(Boolean sslAutoRenew) {
        this.sslAutoRenew = sslAutoRenew;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastVerificationAttempt() {
        return lastVerificationAttempt;
    }

    public void setLastVerificationAttempt(LocalDateTime lastVerificationAttempt) {
        this.lastVerificationAttempt = lastVerificationAttempt;
    }

    public Integer getVerificationAttempts() {
        return verificationAttempts;
    }

    public void setVerificationAttempts(Integer verificationAttempts) {
        this.verificationAttempts = verificationAttempts;
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
}
