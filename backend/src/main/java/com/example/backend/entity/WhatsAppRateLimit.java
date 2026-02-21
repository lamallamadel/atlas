package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.Filter;

@Entity
@Table(
        name = "whatsapp_rate_limit",
        indexes = {@Index(name = "idx_rate_limit_org_reset", columnList = "org_id,reset_at")},
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_rate_limit_org",
                    columnNames = {"org_id"})
        })
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class WhatsAppRateLimit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "messages_sent_count", nullable = false)
    private Integer messagesSentCount = 0;

    @Column(name = "quota_limit", nullable = false)
    private Integer quotaLimit = 1000;

    @Column(name = "reset_at", nullable = false)
    private LocalDateTime resetAt;

    @Column(name = "rate_limit_window_seconds", nullable = false)
    private Integer rateLimitWindowSeconds = 86400;

    @Column(name = "last_request_at")
    private LocalDateTime lastRequestAt;

    @Column(name = "throttle_until")
    private LocalDateTime throttleUntil;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getMessagesSentCount() {
        return messagesSentCount;
    }

    public void setMessagesSentCount(Integer messagesSentCount) {
        this.messagesSentCount = messagesSentCount;
    }

    public Integer getQuotaLimit() {
        return quotaLimit;
    }

    public void setQuotaLimit(Integer quotaLimit) {
        this.quotaLimit = quotaLimit;
    }

    public LocalDateTime getResetAt() {
        return resetAt;
    }

    public void setResetAt(LocalDateTime resetAt) {
        this.resetAt = resetAt;
    }

    public Integer getRateLimitWindowSeconds() {
        return rateLimitWindowSeconds;
    }

    public void setRateLimitWindowSeconds(Integer rateLimitWindowSeconds) {
        this.rateLimitWindowSeconds = rateLimitWindowSeconds;
    }

    public LocalDateTime getLastRequestAt() {
        return lastRequestAt;
    }

    public void setLastRequestAt(LocalDateTime lastRequestAt) {
        this.lastRequestAt = lastRequestAt;
    }

    public LocalDateTime getThrottleUntil() {
        return throttleUntil;
    }

    public void setThrottleUntil(LocalDateTime throttleUntil) {
        this.throttleUntil = throttleUntil;
    }

    public boolean isQuotaAvailable() {
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(resetAt)) {
            return true;
        }
        return messagesSentCount < quotaLimit;
    }

    public boolean isThrottled() {
        if (throttleUntil == null) {
            return false;
        }
        return LocalDateTime.now().isBefore(throttleUntil);
    }

    public void incrementCount() {
        this.messagesSentCount++;
        this.lastRequestAt = LocalDateTime.now();
    }

    public void resetQuota() {
        this.messagesSentCount = 0;
        this.resetAt = LocalDateTime.now().plusSeconds(rateLimitWindowSeconds);
    }
}
