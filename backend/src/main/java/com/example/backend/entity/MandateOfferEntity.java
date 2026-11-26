package com.example.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Offre d'un acquéreur transmise par l'agence mandatée au propriétaire, et sa décision (UC-P8). */
@Entity
@Table(name = "mandate_offer")
public class MandateOfferEntity {

    public static final String OFFER_PENDING = "OFFER_PENDING";
    public static final String OFFER_ACCEPTED = "OFFER_ACCEPTED";
    public static final String OFFER_REFUSED = "OFFER_REFUSED";
    public static final String OFFER_COUNTERED = "OFFER_COUNTERED";
    public static final String OFFER_WITHDRAWN = "OFFER_WITHDRAWN";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mandate_id", nullable = false, updatable = false)
    private Long mandateId;

    @Column(name = "owner_org_id", nullable = false, updatable = false)
    private String ownerOrgId;

    @Column(name = "agency_org_id", nullable = false, updatable = false)
    private String agencyOrgId;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "buyer_summary", length = 255)
    private String buyerSummary;

    @Column(name = "conditions", length = 1000)
    private String conditions;

    @Column(name = "valid_until")
    private java.time.LocalDate validUntil;

    @Column(name = "status", nullable = false, length = 24)
    private String status;

    @Column(name = "counter_amount", precision = 15, scale = 2)
    private BigDecimal counterAmount;

    @Column(name = "owner_comment", length = 1000)
    private String ownerComment;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getBuyerSummary() {
        return buyerSummary;
    }

    public void setBuyerSummary(String buyerSummary) {
        this.buyerSummary = buyerSummary;
    }

    public String getConditions() {
        return conditions;
    }

    public void setConditions(String conditions) {
        this.conditions = conditions;
    }

    public java.time.LocalDate getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(java.time.LocalDate validUntil) {
        this.validUntil = validUntil;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getCounterAmount() {
        return counterAmount;
    }

    public void setCounterAmount(BigDecimal counterAmount) {
        this.counterAmount = counterAmount;
    }

    public String getOwnerComment() {
        return ownerComment;
    }

    public void setOwnerComment(String ownerComment) {
        this.ownerComment = ownerComment;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
