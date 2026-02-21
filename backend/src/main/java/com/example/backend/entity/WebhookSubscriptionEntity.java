package com.example.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "webhook_subscription", indexes = {
    @Index(name = "idx_webhook_subscription_org_status", columnList = "org_id, status"),
    @Index(name = "idx_webhook_subscription_event_type", columnList = "event_type")
})
public class WebhookSubscriptionEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @NotBlank
    @Column(name = "url", nullable = false, length = 2048)
    private String url;

    @NotBlank
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WebhookStatus status = WebhookStatus.ACTIVE;

    @NotBlank
    @Column(name = "secret", nullable = false, length = 255)
    private String secret;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "retry_policy", columnDefinition = "jsonb")
    @Type(JsonType.class)
    private RetryPolicy retryPolicy;

    @Column(name = "headers", columnDefinition = "jsonb")
    @Type(JsonType.class)
    private List<WebhookHeader> headers;

    @Column(name = "last_triggered_at")
    private LocalDateTime lastTriggeredAt;

    @Column(name = "last_success_at")
    private LocalDateTime lastSuccessAt;

    @Column(name = "last_failure_at")
    private LocalDateTime lastFailureAt;

    @Column(name = "failure_count")
    private Integer failureCount = 0;

    @Column(name = "success_count")
    private Integer successCount = 0;

    public enum WebhookStatus {
        ACTIVE, PAUSED, DISABLED
    }

    public static class RetryPolicy {
        private Integer maxRetries = 3;
        private Integer retryDelaySeconds = 60;
        private String backoffStrategy = "exponential";

        public Integer getMaxRetries() {
            return maxRetries;
        }

        public void setMaxRetries(Integer maxRetries) {
            this.maxRetries = maxRetries;
        }

        public Integer getRetryDelaySeconds() {
            return retryDelaySeconds;
        }

        public void setRetryDelaySeconds(Integer retryDelaySeconds) {
            this.retryDelaySeconds = retryDelaySeconds;
        }

        public String getBackoffStrategy() {
            return backoffStrategy;
        }

        public void setBackoffStrategy(String backoffStrategy) {
            this.backoffStrategy = backoffStrategy;
        }
    }

    public static class WebhookHeader {
        private String name;
        private String value;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public WebhookStatus getStatus() {
        return status;
    }

    public void setStatus(WebhookStatus status) {
        this.status = status;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public RetryPolicy getRetryPolicy() {
        return retryPolicy;
    }

    public void setRetryPolicy(RetryPolicy retryPolicy) {
        this.retryPolicy = retryPolicy;
    }

    public List<WebhookHeader> getHeaders() {
        return headers;
    }

    public void setHeaders(List<WebhookHeader> headers) {
        this.headers = headers;
    }

    public LocalDateTime getLastTriggeredAt() {
        return lastTriggeredAt;
    }

    public void setLastTriggeredAt(LocalDateTime lastTriggeredAt) {
        this.lastTriggeredAt = lastTriggeredAt;
    }

    public LocalDateTime getLastSuccessAt() {
        return lastSuccessAt;
    }

    public void setLastSuccessAt(LocalDateTime lastSuccessAt) {
        this.lastSuccessAt = lastSuccessAt;
    }

    public LocalDateTime getLastFailureAt() {
        return lastFailureAt;
    }

    public void setLastFailureAt(LocalDateTime lastFailureAt) {
        this.lastFailureAt = lastFailureAt;
    }

    public Integer getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(Integer failureCount) {
        this.failureCount = failureCount;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }
}
