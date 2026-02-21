package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_usage", uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenant_usage_org_period", columnNames = {"org_id", "period_start"})
})
public class TenantUsageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 255)
    private String orgId;

    @Column(name = "period_start", nullable = false)
    private LocalDateTime periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDateTime periodEnd;

    @Column(name = "email_messages_sent")
    private Integer emailMessagesSent = 0;

    @Column(name = "sms_messages_sent")
    private Integer smsMessagesSent = 0;

    @Column(name = "whatsapp_messages_sent")
    private Integer whatsappMessagesSent = 0;

    @Column(name = "total_messages_sent")
    private Integer totalMessagesSent = 0;

    @Column(name = "documents_storage_bytes")
    private Long documentsStorageBytes = 0L;

    @Column(name = "attachments_storage_bytes")
    private Long attachmentsStorageBytes = 0L;

    @Column(name = "total_storage_bytes")
    private Long totalStorageBytes = 0L;

    @Column(name = "active_users")
    private Integer activeUsers = 0;

    @Column(name = "api_calls")
    private Integer apiCalls = 0;

    @Column(name = "dossiers_created")
    private Integer dossiersCreated = 0;

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

    public LocalDateTime getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(LocalDateTime periodStart) {
        this.periodStart = periodStart;
    }

    public LocalDateTime getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(LocalDateTime periodEnd) {
        this.periodEnd = periodEnd;
    }

    public Integer getEmailMessagesSent() {
        return emailMessagesSent;
    }

    public void setEmailMessagesSent(Integer emailMessagesSent) {
        this.emailMessagesSent = emailMessagesSent;
    }

    public Integer getSmsMessagesSent() {
        return smsMessagesSent;
    }

    public void setSmsMessagesSent(Integer smsMessagesSent) {
        this.smsMessagesSent = smsMessagesSent;
    }

    public Integer getWhatsappMessagesSent() {
        return whatsappMessagesSent;
    }

    public void setWhatsappMessagesSent(Integer whatsappMessagesSent) {
        this.whatsappMessagesSent = whatsappMessagesSent;
    }

    public Integer getTotalMessagesSent() {
        return totalMessagesSent;
    }

    public void setTotalMessagesSent(Integer totalMessagesSent) {
        this.totalMessagesSent = totalMessagesSent;
    }

    public Long getDocumentsStorageBytes() {
        return documentsStorageBytes;
    }

    public void setDocumentsStorageBytes(Long documentsStorageBytes) {
        this.documentsStorageBytes = documentsStorageBytes;
    }

    public Long getAttachmentsStorageBytes() {
        return attachmentsStorageBytes;
    }

    public void setAttachmentsStorageBytes(Long attachmentsStorageBytes) {
        this.attachmentsStorageBytes = attachmentsStorageBytes;
    }

    public Long getTotalStorageBytes() {
        return totalStorageBytes;
    }

    public void setTotalStorageBytes(Long totalStorageBytes) {
        this.totalStorageBytes = totalStorageBytes;
    }

    public Integer getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(Integer activeUsers) {
        this.activeUsers = activeUsers;
    }

    public Integer getApiCalls() {
        return apiCalls;
    }

    public void setApiCalls(Integer apiCalls) {
        this.apiCalls = apiCalls;
    }

    public Integer getDossiersCreated() {
        return dossiersCreated;
    }

    public void setDossiersCreated(Integer dossiersCreated) {
        this.dossiersCreated = dossiersCreated;
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
