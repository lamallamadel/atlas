package com.example.backend.dto;

import com.example.backend.entity.enums.DossierSource;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@Schema(description = "Request body for creating a new dossier")
public class DossierCreateRequest {

    @Schema(description = "Associated annonce ID", example = "1", nullable = true)
    private Long annonceId;

    @Schema(description = "Lead phone number", example = "+33612345678", nullable = true)
    @Size(max = 50, message = "Lead phone must not exceed 50 characters")
    private String leadPhone;

    @Schema(description = "Lead name", example = "John Doe", nullable = true)
    @Size(max = 255, message = "Lead name must not exceed 255 characters")
    private String leadName;

    @Schema(description = "Lead source", example = "Website", nullable = true)
    @Size(max = 100, message = "Lead source must not exceed 100 characters")
    private String leadSource;

    @Schema(
            description = "Dossier notes",
            example = "Customer interested in property X",
            nullable = true)
    private String notes;

    @Schema(description = "Dossier score (0-100)", example = "75", nullable = true)
    @Min(value = 0, message = "Score must be between 0 and 100")
    @Max(value = 100, message = "Score must be between 0 and 100")
    private Integer score;

    @Schema(
            description = "Dossier source",
            example = "WEB",
            nullable = true,
            defaultValue = "UNKNOWN")
    private DossierSource source;

    @Schema(description = "Case type code", example = "CRM_LEAD_BUY", nullable = true)
    @Size(max = 100, message = "Case type must not exceed 100 characters")
    private String caseType;

    @Schema(description = "Status code", example = "CRM_NEW", nullable = true)
    @Size(max = 100, message = "Status code must not exceed 100 characters")
    private String statusCode;

    @Schema(description = "Loss reason code", example = "PRICE_TOO_HIGH", nullable = true)
    @Size(max = 100, message = "Loss reason must not exceed 100 characters")
    private String lossReason;

    @Schema(description = "Won reason code", example = "SIGNED", nullable = true)
    @Size(max = 100, message = "Won reason must not exceed 100 characters")
    private String wonReason;

    @Schema(description = "Initial party to create with the dossier", nullable = true)
    @Valid
    private PartiePrenanteRequest initialParty;

    @Schema(description = "Preferred locale for communications", example = "fr_FR", nullable = true)
    @Size(max = 10, message = "Locale must not exceed 10 characters")
    private String locale;

    public DossierCreateRequest() {}

    public Long getAnnonceId() {
        return annonceId;
    }

    public void setAnnonceId(Long annonceId) {
        this.annonceId = annonceId;
    }

    public String getLeadPhone() {
        return leadPhone;
    }

    public void setLeadPhone(String leadPhone) {
        this.leadPhone = leadPhone;
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

    public PartiePrenanteRequest getInitialParty() {
        return initialParty;
    }

    public void setInitialParty(PartiePrenanteRequest initialParty) {
        this.initialParty = initialParty;
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

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }
}
