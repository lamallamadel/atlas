package com.example.backend.dto;

import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Schema(description = "Dossier response representation")
public class DossierResponse {

    @Schema(description = "Unique identifier of the dossier", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Associated annonce ID", example = "1", nullable = true)
    private Long annonceId;

    @Schema(description = "Associated annonce title", example = "Beautiful Apartment", nullable = true)
    private String annonceTitle;

    @Schema(description = "Lead phone number", example = "+33612345678", nullable = true)
    private String leadPhone;

    @Schema(description = "Lead email address", example = "john.doe@example.com", nullable = true)
    private String leadEmail;

    @Schema(description = "Lead name", example = "John Doe", nullable = true)
    private String leadName;

    @Schema(description = "Lead source", example = "Website", nullable = true)
    private String leadSource;

    @Schema(description = "Dossier notes", example = "Customer interested in property X", nullable = true)
    private String notes;

    @Schema(description = "Current status of the dossier", example = "NEW")
    private DossierStatus status;

    @Schema(description = "Case type code", example = "CRM_LEAD_BUY", nullable = true)
    private String caseType;

    @Schema(description = "Status code", example = "CRM_NEW", nullable = true)
    private String statusCode;

    @Schema(description = "Loss reason code", example = "PRICE_TOO_HIGH", nullable = true)
    private String lossReason;

    @Schema(description = "Won reason code", example = "SIGNED", nullable = true)
    private String wonReason;

    @Schema(description = "Dossier score (0-100)", example = "75", nullable = true)
    private Integer score;

    @Schema(description = "Dossier source", example = "WEB", nullable = true)
    private DossierSource source;

    @Schema(description = "List of parties associated with the dossier")
    private List<PartiePrenanteResponse> parties = new ArrayList<>();

    @Schema(description = "Timestamp when the dossier was created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the dossier was last updated", example = "2024-01-01T12:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "User who created the dossier", nullable = true)
    private String createdBy;

    @Schema(description = "User who last updated the dossier", nullable = true)
    private String updatedBy;

    @Schema(description = "ID of existing open dossier if duplicate found", nullable = true)
    private Long existingOpenDossierId;

    public DossierResponse() {
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

    public DossierStatus getStatus() {
        return status;
    }

    public void setStatus(DossierStatus status) {
        this.status = status;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
}
