package com.example.backend.entity;

import com.example.backend.security.DossierScope;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Créneau de visite proposé au prospect (cas d'usage n°1, UC-P4). Les créneaux d'un même envoi
 * partagent un {@code batchId} ; quand le prospect en choisit un, un rendez-vous est créé et les
 * autres sont annulés.
 */
@Entity
@Table(name = "visit_proposal")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@Filter(
        name = DossierScope.FILTER,
        condition = DossierScope.CHILD_CONDITION,
        deduceAliasInjectionPoints = false)
@EntityListeners(AuditingEntityListener.class)
public class VisitProposalEntity extends BaseEntity {

    public static final String PROPOSED = "PROPOSED";
    public static final String ACCEPTED = "ACCEPTED";
    public static final String CANCELLED = "CANCELLED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false, updatable = false)
    private Long dossierId;

    @Column(name = "batch_id", nullable = false, updatable = false, length = 36)
    private String batchId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "appointment_id")
    private Long appointmentId;

    public Long getId() {
        return id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }
}
