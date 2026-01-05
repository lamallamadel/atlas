package com.example.backend.entity;

import com.example.backend.entity.enums.DossierStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;

@Entity
@Table(name = "dossier_status_history")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class DossierStatusHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 50)
    private DossierStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 50)
    private DossierStatus toStatus;

    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(name = "transitioned_at", nullable = false, updatable = false)
    private LocalDateTime transitionedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public DossierStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(DossierStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public DossierStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(DossierStatus toStatus) {
        this.toStatus = toStatus;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getTransitionedAt() {
        return transitionedAt;
    }

    public void setTransitionedAt(LocalDateTime transitionedAt) {
        this.transitionedAt = transitionedAt;
    }
}
