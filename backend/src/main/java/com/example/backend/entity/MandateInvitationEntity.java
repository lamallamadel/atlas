package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Agence rapprochée d'une demande (lot C) : recommandée par le score ou invitée par le
 * propriétaire. Inter-organisations, sans filtre d'organisation.
 */
@Entity
@Table(name = "mandate_invitation")
public class MandateInvitationEntity {

    public static final String MATCHED = "MATCHED";
    public static final String INVITED = "INVITED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, updatable = false)
    private Long requestId;

    @Column(name = "agency_org_id", nullable = false, updatable = false)
    private String agencyOrgId;

    @Column(name = "kind", nullable = false, length = 16)
    private String kind;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "seen_at")
    private LocalDateTime seenAt;

    public Long getId() {
        return id;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getAgencyOrgId() {
        return agencyOrgId;
    }

    public void setAgencyOrgId(String agencyOrgId) {
        this.agencyOrgId = agencyOrgId;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getSeenAt() {
        return seenAt;
    }

    public void setSeenAt(LocalDateTime seenAt) {
        this.seenAt = seenAt;
    }
}
