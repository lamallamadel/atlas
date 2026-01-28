package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "white_label_config", uniqueConstraints = {
    @UniqueConstraint(name = "uk_white_label_org_id", columnNames = {"org_id"}),
    @UniqueConstraint(name = "uk_white_label_custom_domain", columnNames = {"custom_domain"})
})
public class WhiteLabelConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 255)
    private String orgId;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "logo_url_dark", length = 500)
    private String logoUrlDark;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "primary_color", length = 7)
    private String primaryColor;

    @Column(name = "secondary_color", length = 7)
    private String secondaryColor;

    @Column(name = "accent_color", length = 7)
    private String accentColor;

    @Column(name = "custom_css", columnDefinition = "TEXT")
    private String customCss;

    @Column(name = "custom_domain", length = 255)
    private String customDomain;

    @Column(name = "ssl_certificate_status", length = 50)
    private String sslCertificateStatus = "pending";

    @Column(name = "ssl_certificate_issued_at")
    private LocalDateTime sslCertificateIssuedAt;

    @Column(name = "ssl_certificate_expires_at")
    private LocalDateTime sslCertificateExpiresAt;

    @Column(name = "email_from_name", length = 255)
    private String emailFromName;

    @Column(name = "email_from_address", length = 255)
    private String emailFromAddress;

    @Column(name = "email_footer_html", columnDefinition = "TEXT")
    private String emailFooterHtml;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "features", columnDefinition = "jsonb")
    private Map<String, Object> features;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version = 1;

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

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getLogoUrlDark() {
        return logoUrlDark;
    }

    public void setLogoUrlDark(String logoUrlDark) {
        this.logoUrlDark = logoUrlDark;
    }

    public String getFaviconUrl() {
        return faviconUrl;
    }

    public void setFaviconUrl(String faviconUrl) {
        this.faviconUrl = faviconUrl;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public String getSecondaryColor() {
        return secondaryColor;
    }

    public void setSecondaryColor(String secondaryColor) {
        this.secondaryColor = secondaryColor;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public void setAccentColor(String accentColor) {
        this.accentColor = accentColor;
    }

    public String getCustomCss() {
        return customCss;
    }

    public void setCustomCss(String customCss) {
        this.customCss = customCss;
    }

    public String getCustomDomain() {
        return customDomain;
    }

    public void setCustomDomain(String customDomain) {
        this.customDomain = customDomain;
    }

    public String getSslCertificateStatus() {
        return sslCertificateStatus;
    }

    public void setSslCertificateStatus(String sslCertificateStatus) {
        this.sslCertificateStatus = sslCertificateStatus;
    }

    public LocalDateTime getSslCertificateIssuedAt() {
        return sslCertificateIssuedAt;
    }

    public void setSslCertificateIssuedAt(LocalDateTime sslCertificateIssuedAt) {
        this.sslCertificateIssuedAt = sslCertificateIssuedAt;
    }

    public LocalDateTime getSslCertificateExpiresAt() {
        return sslCertificateExpiresAt;
    }

    public void setSslCertificateExpiresAt(LocalDateTime sslCertificateExpiresAt) {
        this.sslCertificateExpiresAt = sslCertificateExpiresAt;
    }

    public String getEmailFromName() {
        return emailFromName;
    }

    public void setEmailFromName(String emailFromName) {
        this.emailFromName = emailFromName;
    }

    public String getEmailFromAddress() {
        return emailFromAddress;
    }

    public void setEmailFromAddress(String emailFromAddress) {
        this.emailFromAddress = emailFromAddress;
    }

    public String getEmailFooterHtml() {
        return emailFooterHtml;
    }

    public void setEmailFooterHtml(String emailFooterHtml) {
        this.emailFooterHtml = emailFooterHtml;
    }

    public Map<String, Object> getFeatures() {
        return features;
    }

    public void setFeatures(Map<String, Object> features) {
        this.features = features;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
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
