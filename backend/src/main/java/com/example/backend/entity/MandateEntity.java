package com.example.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Mandat confié par un propriétaire à une agence (UC-P7). Inter-organisations ; le dossier {@code
 * CRM_MANDATE_*} vit dans l'agence.
 */
@Entity
@Table(name = "mandate")
public class MandateEntity {

    public static final String MANDATE_PENDING_SIGNATURE = "MANDATE_PENDING_SIGNATURE";
    public static final String MANDATE_ACTIVE = "MANDATE_ACTIVE";
    public static final String MANDATE_COMPLETED = "MANDATE_COMPLETED";
    public static final String MANDATE_TERMINATED = "MANDATE_TERMINATED";
    public static final String MANDATE_EXPIRED = "MANDATE_EXPIRED";
    public static final String EXCLUSIVE = "EXCLUSIVE";
    public static final String SIMPLE = "SIMPLE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_org_id", nullable = false, updatable = false)
    private String ownerOrgId;

    @Column(name = "agency_org_id", nullable = false, updatable = false)
    private String agencyOrgId;

    @Column(name = "property_id", nullable = false, updatable = false)
    private Long propertyId;

    @Column(name = "request_id", nullable = false, updatable = false)
    private Long requestId;

    @Column(name = "proposal_id", nullable = false, updatable = false)
    private Long proposalId;

    @Column(name = "agent_user_id")
    private String agentUserId;

    @Column(name = "mandate_type", nullable = false, length = 16)
    private String mandateType;

    @Column(name = "duration_months", nullable = false)
    private Integer durationMonths;

    @Column(name = "commission_kind", nullable = false, length = 16)
    private String commissionKind;

    @Column(name = "commission_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal commissionValue;

    @Column(name = "commission_payer", nullable = false, length = 16)
    private String commissionPayer;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endsAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "end_reason", length = 40)
    private String endReason;

    @Column(name = "dossier_id")
    private Long dossierId;

    @Column(name = "ended_by", length = 8)
    private String endedBy;

    @Column(name = "expiry_alerted_at")
    private LocalDateTime expiryAlertedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
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

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public Long getProposalId() {
        return proposalId;
    }

    public void setProposalId(Long proposalId) {
        this.proposalId = proposalId;
    }

    public String getAgentUserId() {
        return agentUserId;
    }

    public void setAgentUserId(String agentUserId) {
        this.agentUserId = agentUserId;
    }

    public String getMandateType() {
        return mandateType;
    }

    public void setMandateType(String mandateType) {
        this.mandateType = mandateType;
    }

    public Integer getDurationMonths() {
        return durationMonths;
    }

    public void setDurationMonths(Integer durationMonths) {
        this.durationMonths = durationMonths;
    }

    public String getCommissionKind() {
        return commissionKind;
    }

    public void setCommissionKind(String commissionKind) {
        this.commissionKind = commissionKind;
    }

    public BigDecimal getCommissionValue() {
        return commissionValue;
    }

    public void setCommissionValue(BigDecimal commissionValue) {
        this.commissionValue = commissionValue;
    }

    public String getCommissionPayer() {
        return commissionPayer;
    }

    public void setCommissionPayer(String commissionPayer) {
        this.commissionPayer = commissionPayer;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(LocalDateTime startsAt) {
        this.startsAt = startsAt;
    }

    public LocalDateTime getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(LocalDateTime endsAt) {
        this.endsAt = endsAt;
    }

    public LocalDateTime getSignedAt() {
        return signedAt;
    }

    public void setSignedAt(LocalDateTime signedAt) {
        this.signedAt = signedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public String getEndReason() {
        return endReason;
    }

    public void setEndReason(String endReason) {
        this.endReason = endReason;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
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

    public String getEndedBy() {
        return endedBy;
    }

    public void setEndedBy(String endedBy) {
        this.endedBy = endedBy;
    }

    public LocalDateTime getExpiryAlertedAt() {
        return expiryAlertedAt;
    }

    public void setExpiryAlertedAt(LocalDateTime expiryAlertedAt) {
        this.expiryAlertedAt = expiryAlertedAt;
    }
}
