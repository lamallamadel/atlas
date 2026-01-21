package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;

@Entity
@Table(name = "sms_rate_limit")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class SmsRateLimit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "quota_limit", nullable = false)
    private Integer quotaLimit = 1000;

    @Column(name = "messages_sent_count", nullable = false)
    private Integer messagesSentCount = 0;

    @Column(name = "rate_limit_window_seconds", nullable = false)
    private Integer rateLimitWindowSeconds = 86400;

    @Column(name = "reset_at", nullable = false)
    private LocalDateTime resetAt;

    @Column(name = "throttle_until")
    private LocalDateTime throttleUntil;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getQuotaLimit() {
        return quotaLimit;
    }

    public void setQuotaLimit(Integer quotaLimit) {
        this.quotaLimit = quotaLimit;
    }

    public Integer getMessagesSentCount() {
        return messagesSentCount;
    }

    public void setMessagesSentCount(Integer messagesSentCount) {
        this.messagesSentCount = messagesSentCount;
    }

    public Integer getRateLimitWindowSeconds() {
        return rateLimitWindowSeconds;
    }

    public void setRateLimitWindowSeconds(Integer rateLimitWindowSeconds) {
        this.rateLimitWindowSeconds = rateLimitWindowSeconds;
    }

    public LocalDateTime getResetAt() {
        return resetAt;
    }

    public void setResetAt(LocalDateTime resetAt) {
        this.resetAt = resetAt;
    }

    public LocalDateTime getThrottleUntil() {
        return throttleUntil;
    }

    public void setThrottleUntil(LocalDateTime throttleUntil) {
        this.throttleUntil = throttleUntil;
    }

    public boolean isQuotaAvailable() {
        return messagesSentCount < quotaLimit;
    }

    public boolean isThrottled() {
        return throttleUntil != null && LocalDateTime.now().isBefore(throttleUntil);
    }

    public void incrementCount() {
        this.messagesSentCount++;
    }

    public void resetQuota() {
        this.messagesSentCount = 0;
        this.resetAt = LocalDateTime.now().plusSeconds(rateLimitWindowSeconds);
    }
}
