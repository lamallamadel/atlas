package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ConsentAuditReportResponse {

    private Long dossierId;
    private String leadName;
    private String leadEmail;
    private String leadPhone;
    private LocalDateTime reportGeneratedAt;
    private List<ConsentAuditEntry> consentHistory;
    private ConsentAuditSummary summary;

    public static class ConsentAuditEntry {
        private Long eventId;
        private Long consentementId;
        private String eventType;
        private String channel;
        private String consentType;
        private String oldStatus;
        private String newStatus;
        private LocalDateTime timestamp;
        private String performedBy;
        private String description;

        public Long getEventId() {
            return eventId;
        }

        public void setEventId(Long eventId) {
            this.eventId = eventId;
        }

        public Long getConsentementId() {
            return consentementId;
        }

        public void setConsentementId(Long consentementId) {
            this.consentementId = consentementId;
        }

        public String getEventType() {
            return eventType;
        }

        public void setEventType(String eventType) {
            this.eventType = eventType;
        }

        public String getChannel() {
            return channel;
        }

        public void setChannel(String channel) {
            this.channel = channel;
        }

        public String getConsentType() {
            return consentType;
        }

        public void setConsentType(String consentType) {
            this.consentType = consentType;
        }

        public String getOldStatus() {
            return oldStatus;
        }

        public void setOldStatus(String oldStatus) {
            this.oldStatus = oldStatus;
        }

        public String getNewStatus() {
            return newStatus;
        }

        public void setNewStatus(String newStatus) {
            this.newStatus = newStatus;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public String getPerformedBy() {
            return performedBy;
        }

        public void setPerformedBy(String performedBy) {
            this.performedBy = performedBy;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    public static class ConsentAuditSummary {
        private long totalEvents;
        private long grantedCount;
        private long revokedCount;
        private long expiredCount;
        private long renewedCount;
        private LocalDateTime firstConsentDate;
        private LocalDateTime lastModifiedDate;

        public long getTotalEvents() {
            return totalEvents;
        }

        public void setTotalEvents(long totalEvents) {
            this.totalEvents = totalEvents;
        }

        public long getGrantedCount() {
            return grantedCount;
        }

        public void setGrantedCount(long grantedCount) {
            this.grantedCount = grantedCount;
        }

        public long getRevokedCount() {
            return revokedCount;
        }

        public void setRevokedCount(long revokedCount) {
            this.revokedCount = revokedCount;
        }

        public long getExpiredCount() {
            return expiredCount;
        }

        public void setExpiredCount(long expiredCount) {
            this.expiredCount = expiredCount;
        }

        public long getRenewedCount() {
            return renewedCount;
        }

        public void setRenewedCount(long renewedCount) {
            this.renewedCount = renewedCount;
        }

        public LocalDateTime getFirstConsentDate() {
            return firstConsentDate;
        }

        public void setFirstConsentDate(LocalDateTime firstConsentDate) {
            this.firstConsentDate = firstConsentDate;
        }

        public LocalDateTime getLastModifiedDate() {
            return lastModifiedDate;
        }

        public void setLastModifiedDate(LocalDateTime lastModifiedDate) {
            this.lastModifiedDate = lastModifiedDate;
        }
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public String getLeadEmail() {
        return leadEmail;
    }

    public void setLeadEmail(String leadEmail) {
        this.leadEmail = leadEmail;
    }

    public String getLeadPhone() {
        return leadPhone;
    }

    public void setLeadPhone(String leadPhone) {
        this.leadPhone = leadPhone;
    }

    public LocalDateTime getReportGeneratedAt() {
        return reportGeneratedAt;
    }

    public void setReportGeneratedAt(LocalDateTime reportGeneratedAt) {
        this.reportGeneratedAt = reportGeneratedAt;
    }

    public List<ConsentAuditEntry> getConsentHistory() {
        return consentHistory;
    }

    public void setConsentHistory(List<ConsentAuditEntry> consentHistory) {
        this.consentHistory = consentHistory;
    }

    public ConsentAuditSummary getSummary() {
        return summary;
    }

    public void setSummary(ConsentAuditSummary summary) {
        this.summary = summary;
    }
}
