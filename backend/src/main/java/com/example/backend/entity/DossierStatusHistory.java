package com.example.backend.entity;

import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.security.DossierScope;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "dossier_status_history")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@Filter(
        name = DossierScope.FILTER,
        condition = DossierScope.CHILD_CONDITION,
        deduceAliasInjectionPoints = false)
public class DossierStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "org_id", nullable = false, updatable = false)
    private String orgId;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "from_status", length = 50)
    private DossierStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "to_status", nullable = false, length = 50)
    private DossierStatus toStatus;

    /** Code de nomenclature de départ (ADR 0004) ; l'enum reste une projection. */
    @Column(name = "from_code", length = 50)
    private String fromCode;

    @Column(name = "to_code", length = 50)
    private String toCode;

    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(name = "transitioned_at", nullable = false, updatable = false)
    private LocalDateTime transitionedAt;

    @UpdateTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getFromCode() {
        return fromCode;
    }

    public void setFromCode(String fromCode) {
        this.fromCode = fromCode;
    }

    public String getToCode() {
        return toCode;
    }

    public void setToCode(String toCode) {
        this.toCode = toCode;
    }
}
