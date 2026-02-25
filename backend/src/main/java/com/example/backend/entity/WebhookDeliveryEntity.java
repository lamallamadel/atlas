package com.example.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.Type;

@Entity
@Table(
        name = "webhook_delivery",
        indexes = {
            @Index(name = "idx_webhook_delivery_subscription", columnList = "subscription_id"),
            @Index(name = "idx_webhook_delivery_status", columnList = "status"),
            @Index(name = "idx_webhook_delivery_next_retry", columnList = "next_retry_at")
        })
public class WebhookDeliveryEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "subscription_id", nullable = false)
    private Long subscriptionId;

    @NotBlank
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload", columnDefinition = "jsonb")
    @Type(JsonType.class)
    private Map<String, Object> payload;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DeliveryStatus status = DeliveryStatus.PENDING;

    @Column(name = "attempt_count")
    private Integer attemptCount = 0;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "response_status_code")
    private Integer responseStatusCode;

    @Column(name = "response_body", columnDefinition = "text")
    private String responseBody;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    public enum DeliveryStatus {
        PENDING,
        SUCCESS,
        FAILED,
        RETRY
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }

    public LocalDateTime getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(LocalDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }

    public LocalDateTime getLastAttemptAt() {
        return lastAttemptAt;
    }

    public void setLastAttemptAt(LocalDateTime lastAttemptAt) {
        this.lastAttemptAt = lastAttemptAt;
    }

    public Integer getResponseStatusCode() {
        return responseStatusCode;
    }

    public void setResponseStatusCode(Integer responseStatusCode) {
        this.responseStatusCode = responseStatusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
