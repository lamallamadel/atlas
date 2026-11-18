package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/** Acheteur (dossier) dont les critères de recherche correspondent à une annonce. */
@Entity
@Table(name = "annonce_dossier_match")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class AnnonceDossierMatch extends BaseEntity {

    /** Nouvelle correspondance, pas encore vue par l'agent. */
    public static final String STATUS_NEW = "NEW";

    public static final String STATUS_SEEN = "SEEN";

    /** Écartée par l'agent : ne réapparaît pas aux calculs suivants. */
    public static final String STATUS_DISMISSED = "DISMISSED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "annonce_id", nullable = false)
    private Long annonceId;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "score", nullable = false)
    private Integer score;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reasons")
    private List<String> reasons;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "alerts")
    private List<String> alerts;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

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

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }

    public List<String> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<String> alerts) {
        this.alerts = alerts;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getNotifiedAt() {
        return notifiedAt;
    }

    public void setNotifiedAt(LocalDateTime notifiedAt) {
        this.notifiedAt = notifiedAt;
    }
}
