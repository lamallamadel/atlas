package com.example.backend.dto;

import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;

import java.time.LocalDateTime;
import java.util.List;

public class DossierResponse {

    private Long id;
    private String orgId;
    private Long annonceId;
    private String annonceTitle;
    private String leadPhone;
    private String leadEmail;
    private String leadName;
    private String leadSource;
    private String notes;
    private DossierStatus status;
    private String caseType;
    private String statusCode;
    private String lossReason;
    private String wonReason;
    private Integer score;
    private DossierSource source;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private List<PartiePrenanteResponse> parties;
    private Long existingOpenDossierId;

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

    public Long getAnnonceId() {
        return annonceId;
    }

    public void setAnnonceId(Long annonceId) {
        this.annonceId = annonceId;
    }

    public String getAnnonceTitle() {
        return annonceTitle;
    }

    public void setAnnonceTitle(String annonceTitle) {
        this.annonceTitle = annonceTitle;
    }

    public String getLeadPhone() {
        return leadPhone;
    }

    public void setLeadPhone(String leadPhone) {
        this.leadPhone = leadPhone;
    }

    public String getLeadEmail() {
        return leadEmail;
    }

    public void setLeadEmail(String leadEmail) {
        this.leadEmail = leadEmail;
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public String getLeadSource() {
        return leadSource;
    }

    public void setLeadSource(String leadSource) {
        this.leadSource = leadSource;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public DossierStatus getStatus() {
        return status;
    }

    public void setStatus(DossierStatus status) {
        this.status = status;
    }

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String caseType) {
        this.caseType = caseType;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public String getLossReason() {
        return lossReason;
    }

    public void setLossReason(String lossReason) {
        this.lossReason = lossReason;
    }

    public String getWonReason() {
        return wonReason;
    }

    public void setWonReason(String wonReason) {
        this.wonReason = wonReason;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public DossierSource getSource() {
        return source;
    }

    public void setSource(DossierSource source) {
        this.source = source;
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

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public List<PartiePrenanteResponse> getParties() {
        return parties;
    }

    public void setParties(List<PartiePrenanteResponse> parties) {
        this.parties = parties;
    }

    public Long getExistingOpenDossierId() {
        return existingOpenDossierId;
    }

    public void setExistingOpenDossierId(Long existingOpenDossierId) {
        this.existingOpenDossierId = existingOpenDossierId;
    }
}
