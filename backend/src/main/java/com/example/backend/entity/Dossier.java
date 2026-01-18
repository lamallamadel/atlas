package com.example.backend.entity;

import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossier")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class Dossier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "annonce_id")
    private Long annonceId;

    @Column(name = "lead_phone", length = 50)
    private String leadPhone;

    @Column(name = "lead_name", length = 255)
    private String leadName;

    @Column(name = "lead_source", length = 100)
    private String leadSource;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private DossierStatus status;

    @Column(name = "case_type", length = 100)
    private String caseType;

    @Column(name = "status_code", length = 100)
    private String statusCode;

    @Column(name = "loss_reason", length = 100)
    private String lossReason;

    @Column(name = "won_reason", length = 100)
    private String wonReason;

    @Column(name = "score")
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 50)
    private DossierSource source;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PartiePrenanteEntity> parties = new ArrayList<>();

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppointmentEntity> appointments = new ArrayList<>();

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
}
