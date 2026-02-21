package com.example.backend.dto.v2;

import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Schema(description = "Dossier response representation (API v2)")
public class DossierResponseV2 {

    @Schema(description = "Unique identifier of the dossier", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Associated annonce information")
    private AnnonceInfoV2 annonce;

    @Schema(description = "Lead contact information")
    private LeadInfoV2 lead;

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
    private List<PartiePrenanteResponseV2> parties = new ArrayList<>();

    @Schema(description = "Audit information")
    private AuditInfoV2 audit;

    @Schema(description = "Additional metadata")
    private Map<String, Object> metadata;
    private List<com.example.backend.dto.LeadActivityResponse> recentActivities;

    public static class AnnonceInfoV2 {
        @Schema(description = "Annonce ID", example = "1")
        private Long id;

        @Schema(description = "Annonce title", example = "Beautiful Apartment")
        private String title;

        @Schema(description = "Annonce city", example = "Paris")
        private String city;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }
    }

    public static class LeadInfoV2 {
        @Schema(description = "Lead phone number", example = "+33612345678")
        private String phone;

        @Schema(description = "Lead name", example = "John Doe")
        private String name;

        @Schema(description = "Lead source", example = "Website")
        private String source;

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }
    }

    public static class AuditInfoV2 {
        @Schema(description = "Timestamp when created (ISO-8601)", example = "2024-01-01T12:00:00Z")
        private Instant createdAt;

        @Schema(description = "Timestamp when last updated (ISO-8601)", example = "2024-01-01T12:00:00Z")
        private Instant updatedAt;

        @Schema(description = "User who created the resource")
        private String createdBy;

        @Schema(description = "User who last updated the resource")
        private String updatedBy;

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }

        public Instant getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(Instant updatedAt) {
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

    public AnnonceInfoV2 getAnnonce() {
        return annonce;
    }

    public void setAnnonce(AnnonceInfoV2 annonce) {
        this.annonce = annonce;
    }

    public LeadInfoV2 getLead() {
        return lead;
    }

    public void setLead(LeadInfoV2 lead) {
        this.lead = lead;
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

    public List<PartiePrenanteResponseV2> getParties() {
        return parties;
    }

    public void setParties(List<PartiePrenanteResponseV2> parties) {
        this.parties = parties;
    }

    public AuditInfoV2 getAudit() {
        return audit;
    }

    public void setAudit(AuditInfoV2 audit) {
        this.audit = audit;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public List<com.example.backend.dto.LeadActivityResponse> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<com.example.backend.dto.LeadActivityResponse> recentActivities) {
        this.recentActivities = recentActivities;
    }
}
