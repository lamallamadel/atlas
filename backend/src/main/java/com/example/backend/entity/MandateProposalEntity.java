package com.example.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Proposition d'une agence sur une demande d'accompagnement (UC-P6), avec son fil de messages. */
@Entity
@Table(name = "mandate_proposal")
public class MandateProposalEntity {

    public static final String MPROP_SENT = "MPROP_SENT";
    public static final String MPROP_SHORTLISTED = "MPROP_SHORTLISTED";
    public static final String MPROP_ACCEPTED = "MPROP_ACCEPTED";
    public static final String MPROP_DECLINED = "MPROP_DECLINED";
    public static final String MPROP_WITHDRAWN = "MPROP_WITHDRAWN";
    public static final String MPROP_EXPIRED = "MPROP_EXPIRED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, updatable = false)
    private Long requestId;

    @Column(name = "agency_org_id", nullable = false, updatable = false)
    private String agencyOrgId;

    @Column(name = "agent_user_id", nullable = false)
    private String agentUserId;

    @Column(name = "agent_name")
    private String agentName;

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

    @Column(name = "services", length = 500)
    private String services;

    @Column(name = "estimate_min", precision = 15, scale = 2)
    private BigDecimal estimateMin;

    @Column(name = "estimate_max", precision = 15, scale = 2)
    private BigDecimal estimateMax;

    @Column(name = "message", length = 2000)
    private String message;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "owner_last_read_at")
    private LocalDateTime ownerLastReadAt;

    @Column(name = "agency_last_read_at")
    private LocalDateTime agencyLastReadAt;

    @Column(name = "owner_alerted_at")
    private LocalDateTime ownerAlertedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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

    public String getAgentUserId() {
        return agentUserId;
    }

    public void setAgentUserId(String agentUserId) {
        this.agentUserId = agentUserId;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
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

    public String getServices() {
        return services;
    }

    public void setServices(String services) {
        this.services = services;
    }

    public BigDecimal getEstimateMin() {
        return estimateMin;
    }

    public void setEstimateMin(BigDecimal estimateMin) {
        this.estimateMin = estimateMin;
    }

    public BigDecimal getEstimateMax() {
        return estimateMax;
    }

    public void setEstimateMax(BigDecimal estimateMax) {
        this.estimateMax = estimateMax;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }

    public LocalDateTime getOwnerLastReadAt() {
        return ownerLastReadAt;
    }

    public void setOwnerLastReadAt(LocalDateTime ownerLastReadAt) {
        this.ownerLastReadAt = ownerLastReadAt;
    }

    public LocalDateTime getAgencyLastReadAt() {
        return agencyLastReadAt;
    }

    public void setAgencyLastReadAt(LocalDateTime agencyLastReadAt) {
        this.agencyLastReadAt = agencyLastReadAt;
    }

    public LocalDateTime getOwnerAlertedAt() {
        return ownerAlertedAt;
    }

    public void setOwnerAlertedAt(LocalDateTime ownerAlertedAt) {
        this.ownerAlertedAt = ownerAlertedAt;
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
}
