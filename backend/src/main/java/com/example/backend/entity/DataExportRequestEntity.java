package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_export_request")
public class DataExportRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private String orgId;

    @Column(name = "request_type", nullable = false, length = 50)
    private String requestType;

    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    @Column(name = "requester_user_id")
    private String requesterUserId;

    @Column(name = "export_format", length = 20)
    private String exportFormat = "json";

    @Column(name = "include_documents")
    private Boolean includeDocuments = true;

    @Column(name = "include_audit_logs")
    private Boolean includeAuditLogs = false;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "pending";

    @Column(name = "processing_started_at")
    private LocalDateTime processingStartedAt;

    @Column(name = "processing_completed_at")
    private LocalDateTime processingCompletedAt;

    @Column(name = "export_file_path", length = 500)
    private String exportFilePath;

    @Column(name = "export_file_size_bytes")
    private Long exportFileSizeBytes;

    @Column(name = "download_url", length = 1000)
    private String downloadUrl;

    @Column(name = "download_url_expires_at")
    private LocalDateTime downloadUrlExpiresAt;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Column(name = "max_downloads")
    private Integer maxDownloads = 3;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public String getRequesterUserId() { return requesterUserId; }
    public void setRequesterUserId(String requesterUserId) { this.requesterUserId = requesterUserId; }
    public String getExportFormat() { return exportFormat; }
    public void setExportFormat(String exportFormat) { this.exportFormat = exportFormat; }
    public Boolean getIncludeDocuments() { return includeDocuments; }
    public void setIncludeDocuments(Boolean includeDocuments) { this.includeDocuments = includeDocuments; }
    public Boolean getIncludeAuditLogs() { return includeAuditLogs; }
    public void setIncludeAuditLogs(Boolean includeAuditLogs) { this.includeAuditLogs = includeAuditLogs; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getProcessingStartedAt() { return processingStartedAt; }
    public void setProcessingStartedAt(LocalDateTime processingStartedAt) { this.processingStartedAt = processingStartedAt; }
    public LocalDateTime getProcessingCompletedAt() { return processingCompletedAt; }
    public void setProcessingCompletedAt(LocalDateTime processingCompletedAt) { this.processingCompletedAt = processingCompletedAt; }
    public String getExportFilePath() { return exportFilePath; }
    public void setExportFilePath(String exportFilePath) { this.exportFilePath = exportFilePath; }
    public Long getExportFileSizeBytes() { return exportFileSizeBytes; }
    public void setExportFileSizeBytes(Long exportFileSizeBytes) { this.exportFileSizeBytes = exportFileSizeBytes; }
    public String getDownloadUrl() { return downloadUrl; }
    public void setDownloadUrl(String downloadUrl) { this.downloadUrl = downloadUrl; }
    public LocalDateTime getDownloadUrlExpiresAt() { return downloadUrlExpiresAt; }
    public void setDownloadUrlExpiresAt(LocalDateTime downloadUrlExpiresAt) { this.downloadUrlExpiresAt = downloadUrlExpiresAt; }
    public Integer getDownloadCount() { return downloadCount; }
    public void setDownloadCount(Integer downloadCount) { this.downloadCount = downloadCount; }
    public Integer getMaxDownloads() { return maxDownloads; }
    public void setMaxDownloads(Integer maxDownloads) { this.maxDownloads = maxDownloads; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
