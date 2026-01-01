package com.example.backend.entity;

import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossier")
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private String orgId;

    @Column(name = "annonce_id")
    private Long annonceId;

    @Column(name = "lead_phone", length = 50)
    private String leadPhone;

    @Column(name = "lead_name", length = 255)
    private String leadName;

    @Column(name = "lead_source", length = 100)
    private String leadSource;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private DossierStatus status;

    @Column(name = "score")
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 50)
    private DossierSource source;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PartiePrenanteEntity> parties = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 255)
    private String createdBy;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

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
}
