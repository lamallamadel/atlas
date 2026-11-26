package com.example.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Demande d'accompagnement d'un propriétaire (UC-P5). Objet inter-organisations : pas de filtre
 * d'organisation, accès vérifié par {@code MandateAccess}.
 */
@Entity
@Table(name = "mandate_request")
public class MandateRequestEntity {

    public static final String MREQ_DRAFT = "MREQ_DRAFT";
    public static final String MREQ_OPEN = "MREQ_OPEN";
    public static final String MREQ_AWARDED = "MREQ_AWARDED";
    public static final String MREQ_EXPIRED = "MREQ_EXPIRED";
    public static final String MREQ_CANCELLED = "MREQ_CANCELLED";
    public static final String MREQ_OPEN_MARKET = "MREQ_OPEN_MARKET";
    public static final String MREQ_DIRECT = "MREQ_DIRECT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_org_id", nullable = false, updatable = false)
    private String ownerOrgId;

    @Column(name = "property_id", nullable = false, updatable = false)
    private Long propertyId;

    @Column(name = "visibility", nullable = false, length = 20)
    private String visibility;

    @Column(name = "target_agency_org_id")
    private String targetAgencyOrgId;

    @Column(name = "objective", nullable = false, length = 8)
    private String objective;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    @Column(name = "district", length = 120)
    private String district;

    @Column(name = "expected_price", precision = 15, scale = 2)
    private BigDecimal expectedPrice;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "deadline", length = 40)
    private String deadline;

    @Column(name = "mandate_types", nullable = false, length = 40)
    private String mandateTypes;

    @Column(name = "services", length = 500)
    private String services;

    @Column(name = "commission_note", length = 255)
    private String commissionNote;

    @Column(name = "availability", length = 255)
    private String availability;

    @Column(name = "languages", length = 120)
    private String languages;

    @Column(name = "message", length = 2000)
    private String message;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "max_proposals", nullable = false)
    private Integer maxProposals;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "target_declined_at")
    private LocalDateTime targetDeclinedAt;

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

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public String getTargetAgencyOrgId() {
        return targetAgencyOrgId;
    }

    public void setTargetAgencyOrgId(String targetAgencyOrgId) {
        this.targetAgencyOrgId = targetAgencyOrgId;
    }

    public String getObjective() {
        return objective;
    }

    public void setObjective(String objective) {
        this.objective = objective;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public BigDecimal getExpectedPrice() {
        return expectedPrice;
    }

    public void setExpectedPrice(BigDecimal expectedPrice) {
        this.expectedPrice = expectedPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getMandateTypes() {
        return mandateTypes;
    }

    public void setMandateTypes(String mandateTypes) {
        this.mandateTypes = mandateTypes;
    }

    public String getServices() {
        return services;
    }

    public void setServices(String services) {
        this.services = services;
    }

    public String getCommissionNote() {
        return commissionNote;
    }

    public void setCommissionNote(String commissionNote) {
        this.commissionNote = commissionNote;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public String getLanguages() {
        return languages;
    }

    public void setLanguages(String languages) {
        this.languages = languages;
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

    public Integer getMaxProposals() {
        return maxProposals;
    }

    public void setMaxProposals(Integer maxProposals) {
        this.maxProposals = maxProposals;
    }

    public LocalDateTime getOpenedAt() {
        return openedAt;
    }

    public void setOpenedAt(LocalDateTime openedAt) {
        this.openedAt = openedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getTargetDeclinedAt() {
        return targetDeclinedAt;
    }

    public void setTargetDeclinedAt(LocalDateTime targetDeclinedAt) {
        this.targetDeclinedAt = targetDeclinedAt;
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
