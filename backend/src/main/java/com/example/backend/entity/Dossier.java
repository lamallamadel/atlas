package com.example.backend.entity;

import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.security.DossierScope;
import com.example.backend.workflow.DossierStatusCodes;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "dossier")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
@Filter(
        name = DossierScope.FILTER,
        condition = DossierScope.DOSSIER_CONDITION,
        deduceAliasInjectionPoints = false)
public class Dossier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "annonce_id")
    private Long annonceId;

    @Column(name = "lead_phone", length = 50)
    private String leadPhone;

    @Column(name = "lead_email", length = 255)
    private String leadEmail;

    @Column(name = "lead_name", length = 255)
    private String leadName;

    @Column(name = "lead_source", length = 100)
    private String leadSource;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 50)
    private DossierStatus status;

    @Column(name = "case_type", length = 100)
    private String caseType;

    @Column(name = "status_code", length = 100)
    private String statusCode;

    /** Agent assigné (identifiant Keycloak) ; {@code null} = dossier à attribuer. */
    @Column(name = "assigned_to")
    private String assignedTo;

    /** Nom de l'agent au moment de l'assignation, pour l'affichage. */
    @Column(name = "assigned_to_name")
    private String assignedToName;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "workflow_definition_id")
    private Long workflowDefinitionId;

    @Column(name = "workflow_version")
    private Integer workflowVersion;

    @Column(name = "loss_reason", length = 100)
    private String lossReason;

    @Column(name = "won_reason", length = 100)
    private String wonReason;

    @Column(name = "score")
    private Integer score;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "source", length = 50)
    private DossierSource source;

    /** Critères de recherche de l'acheteur ou du locataire (voir DossierSearchCriteria). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "search_criteria")
    private Map<String, Object> searchCriteria;

    /** Informations de qualification saisies par le prospect (formulaire de démo de la vitrine). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "lead_details")
    private Map<String, Object> leadDetails;

    @Column(name = "search_criteria_updated_at")
    private LocalDateTime searchCriteriaUpdatedAt;

    @Column(name = "locale", length = 10)
    private String locale;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PartiePrenanteEntity> parties = new ArrayList<>();

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppointmentEntity> appointments = new ArrayList<>();

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LeadActivity> activities = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    /**
     * Met à jour le statut et, pendant la migration ADR 0004, le {@code status_code} correspondant
     * de la nomenclature. Un code explicite peut être posé ensuite par {@link #setStatusCode}.
     */
    public void setStatus(DossierStatus status) {
        this.status = status;
        if (status != null) {
            this.statusCode = DossierStatusCodes.toCode(status);
        }
    }

    /** Type par défaut et code de statut cohérents avant écriture (ADR 0004, phase A). */
    @PrePersist
    @PreUpdate
    void applyWorkflowDefaults() {
        if (caseType == null || caseType.isBlank()) {
            caseType = DossierStatusCodes.DEFAULT_CASE_TYPE;
        }
        if (statusCode == null || statusCode.isBlank()) {
            statusCode = DossierStatusCodes.toCode(status);
        } else {
            statusCode = DossierStatusCodes.normalize(statusCode);
        }
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

    public List<PartiePrenanteEntity> getParties() {
        return parties;
    }

    public void setParties(List<PartiePrenanteEntity> parties) {
        this.parties = parties;
    }

    public void addParty(PartiePrenanteEntity party) {
        parties.add(party);
        party.setDossier(this);
    }

    public void removeParty(PartiePrenanteEntity party) {
        parties.remove(party);
        party.setDossier(null);
    }

    public List<AppointmentEntity> getAppointments() {
        return appointments;
    }

    public void setAppointments(List<AppointmentEntity> appointments) {
        this.appointments = appointments;
    }

    public void addAppointment(AppointmentEntity appointment) {
        appointments.add(appointment);
        appointment.setDossier(this);
    }

    public void removeAppointment(AppointmentEntity appointment) {
        appointments.remove(appointment);
        appointment.setDossier(null);
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

    public Long getWorkflowDefinitionId() {
        return workflowDefinitionId;
    }

    public void setWorkflowDefinitionId(Long workflowDefinitionId) {
        this.workflowDefinitionId = workflowDefinitionId;
    }

    public Integer getWorkflowVersion() {
        return workflowVersion;
    }

    public void setWorkflowVersion(Integer workflowVersion) {
        this.workflowVersion = workflowVersion;
    }

    public List<LeadActivity> getActivities() {
        return activities;
    }

    public void setActivities(List<LeadActivity> activities) {
        this.activities = activities;
    }

    public void addActivity(LeadActivity activity) {
        activities.add(activity);
        activity.setDossier(this);
    }

    public void removeActivity(LeadActivity activity) {
        activities.remove(activity);
        activity.setDossier(null);
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public Map<String, Object> getLeadDetails() {
        return leadDetails;
    }

    public void setLeadDetails(Map<String, Object> leadDetails) {
        this.leadDetails = leadDetails;
    }

    public Map<String, Object> getSearchCriteria() {
        return searchCriteria;
    }

    public void setSearchCriteria(Map<String, Object> searchCriteria) {
        this.searchCriteria = searchCriteria;
    }

    public LocalDateTime getSearchCriteriaUpdatedAt() {
        return searchCriteriaUpdatedAt;
    }

    public void setSearchCriteriaUpdatedAt(LocalDateTime searchCriteriaUpdatedAt) {
        this.searchCriteriaUpdatedAt = searchCriteriaUpdatedAt;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getAssignedToName() {
        return assignedToName;
    }

    public void setAssignedToName(String assignedToName) {
        this.assignedToName = assignedToName;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
}
