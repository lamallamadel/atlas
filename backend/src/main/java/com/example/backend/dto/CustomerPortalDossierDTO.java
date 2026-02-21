package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CustomerPortalDossierDTO {
    private Long id;
    private String leadName;
    private String leadEmail;
    private String leadPhone;
    private String statusDisplay;
    private String progressPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CustomerPortalActivityDTO> activities;
    private List<CustomerPortalDocumentDTO> documents;
    private Long unreadMessagesCount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getStatusDisplay() {
        return statusDisplay;
    }

    public void setStatusDisplay(String statusDisplay) {
        this.statusDisplay = statusDisplay;
    }

    public String getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(String progressPercentage) {
        this.progressPercentage = progressPercentage;
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

    public List<CustomerPortalActivityDTO> getActivities() {
        return activities;
    }

    public void setActivities(List<CustomerPortalActivityDTO> activities) {
        this.activities = activities;
    }

    public List<CustomerPortalDocumentDTO> getDocuments() {
        return documents;
    }

    public void setDocuments(List<CustomerPortalDocumentDTO> documents) {
        this.documents = documents;
    }

    public Long getUnreadMessagesCount() {
        return unreadMessagesCount;
    }

    public void setUnreadMessagesCount(Long unreadMessagesCount) {
        this.unreadMessagesCount = unreadMessagesCount;
    }
}
