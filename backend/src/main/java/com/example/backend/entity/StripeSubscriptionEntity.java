package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "stripe_subscription",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_stripe_subscription_org_id",
                    columnNames = {"org_id"}),
            @UniqueConstraint(
                    name = "uk_stripe_customer_id",
                    columnNames = {"stripe_customer_id"}),
            @UniqueConstraint(
                    name = "uk_stripe_subscription_id",
                    columnNames = {"stripe_subscription_id"})
        })
public class StripeSubscriptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 255)
    private String orgId;

    @Column(name = "stripe_customer_id", nullable = false, length = 255)
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id", nullable = false, length = 255)
    private String stripeSubscriptionId;

    @Column(name = "stripe_price_id", length = 255)
    private String stripePriceId;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "plan_tier", nullable = false, length = 50)
    private String planTier;

    @Column(name = "billing_period", length = 20)
    private String billingPeriod = "monthly";

    @Column(name = "base_price_cents")
    private Integer basePriceCents;

    @Column(name = "message_overage_price_cents")
    private Integer messageOveragePriceCents;

    @Column(name = "storage_overage_price_cents")
    private Integer storageOveragePriceCents;

    @Column(name = "included_messages")
    private Integer includedMessages;

    @Column(name = "included_storage_gb")
    private Integer includedStorageGb;

    @Column(name = "max_users")
    private Integer maxUsers;

    @Column(name = "current_period_start")
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "trial_start")
    private LocalDateTime trialStart;

    @Column(name = "trial_end")
    private LocalDateTime trialEnd;

    @Column(name = "cancel_at")
    private LocalDateTime cancelAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "last_payment_status", length = 50)
    private String lastPaymentStatus;

    @Column(name = "last_payment_at")
    private LocalDateTime lastPaymentAt;

    @Column(name = "next_billing_date")
    private LocalDateTime nextBillingDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

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

    public String getStripeCustomerId() {
        return stripeCustomerId;
    }

    public void setStripeCustomerId(String stripeCustomerId) {
        this.stripeCustomerId = stripeCustomerId;
    }

    public String getStripeSubscriptionId() {
        return stripeSubscriptionId;
    }

    public void setStripeSubscriptionId(String stripeSubscriptionId) {
        this.stripeSubscriptionId = stripeSubscriptionId;
    }

    public String getStripePriceId() {
        return stripePriceId;
    }

    public void setStripePriceId(String stripePriceId) {
        this.stripePriceId = stripePriceId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPlanTier() {
        return planTier;
    }

    public void setPlanTier(String planTier) {
        this.planTier = planTier;
    }

    public String getBillingPeriod() {
        return billingPeriod;
    }

    public void setBillingPeriod(String billingPeriod) {
        this.billingPeriod = billingPeriod;
    }

    public Integer getBasePriceCents() {
        return basePriceCents;
    }

    public void setBasePriceCents(Integer basePriceCents) {
        this.basePriceCents = basePriceCents;
    }

    public Integer getMessageOveragePriceCents() {
        return messageOveragePriceCents;
    }

    public void setMessageOveragePriceCents(Integer messageOveragePriceCents) {
        this.messageOveragePriceCents = messageOveragePriceCents;
    }

    public Integer getStorageOveragePriceCents() {
        return storageOveragePriceCents;
    }

    public void setStorageOveragePriceCents(Integer storageOveragePriceCents) {
        this.storageOveragePriceCents = storageOveragePriceCents;
    }

    public Integer getIncludedMessages() {
        return includedMessages;
    }

    public void setIncludedMessages(Integer includedMessages) {
        this.includedMessages = includedMessages;
    }

    public Integer getIncludedStorageGb() {
        return includedStorageGb;
    }

    public void setIncludedStorageGb(Integer includedStorageGb) {
        this.includedStorageGb = includedStorageGb;
    }

    public Integer getMaxUsers() {
        return maxUsers;
    }

    public void setMaxUsers(Integer maxUsers) {
        this.maxUsers = maxUsers;
    }

    public LocalDateTime getCurrentPeriodStart() {
        return currentPeriodStart;
    }

    public void setCurrentPeriodStart(LocalDateTime currentPeriodStart) {
        this.currentPeriodStart = currentPeriodStart;
    }

    public LocalDateTime getCurrentPeriodEnd() {
        return currentPeriodEnd;
    }

    public void setCurrentPeriodEnd(LocalDateTime currentPeriodEnd) {
        this.currentPeriodEnd = currentPeriodEnd;
    }

    public LocalDateTime getTrialStart() {
        return trialStart;
    }

    public void setTrialStart(LocalDateTime trialStart) {
        this.trialStart = trialStart;
    }

    public LocalDateTime getTrialEnd() {
        return trialEnd;
    }

    public void setTrialEnd(LocalDateTime trialEnd) {
        this.trialEnd = trialEnd;
    }

    public LocalDateTime getCancelAt() {
        return cancelAt;
    }

    public void setCancelAt(LocalDateTime cancelAt) {
        this.cancelAt = cancelAt;
    }

    public LocalDateTime getCanceledAt() {
        return canceledAt;
    }

    public void setCanceledAt(LocalDateTime canceledAt) {
        this.canceledAt = canceledAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public String getLastPaymentStatus() {
        return lastPaymentStatus;
    }

    public void setLastPaymentStatus(String lastPaymentStatus) {
        this.lastPaymentStatus = lastPaymentStatus;
    }

    public LocalDateTime getLastPaymentAt() {
        return lastPaymentAt;
    }

    public void setLastPaymentAt(LocalDateTime lastPaymentAt) {
        this.lastPaymentAt = lastPaymentAt;
    }

    public LocalDateTime getNextBillingDate() {
        return nextBillingDate;
    }

    public void setNextBillingDate(LocalDateTime nextBillingDate) {
        this.nextBillingDate = nextBillingDate;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
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
