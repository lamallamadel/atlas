package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Avis vérifié d'un propriétaire sur une agence, rattaché à un mandat terminé (UC-P9, R-PROP-13).
 */
@Entity
@Table(name = "agency_review")
public class AgencyReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mandate_id", nullable = false, updatable = false)
    private Long mandateId;

    @Column(name = "owner_org_id", nullable = false, updatable = false)
    private String ownerOrgId;

    @Column(name = "agency_org_id", nullable = false, updatable = false)
    private String agencyOrgId;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public Long getMandateId() {
        return mandateId;
    }

    public void setMandateId(Long mandateId) {
        this.mandateId = mandateId;
    }

    public String getOwnerOrgId() {
        return ownerOrgId;
    }

    public void setOwnerOrgId(String ownerOrgId) {
        this.ownerOrgId = ownerOrgId;
    }

    public String getAgencyOrgId() {
        return agencyOrgId;
    }

    public void setAgencyOrgId(String agencyOrgId) {
        this.agencyOrgId = agencyOrgId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
