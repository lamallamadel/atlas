package com.example.backend.dto;

import com.example.backend.entity.WebhookSubscriptionEntity;

import java.time.LocalDateTime;

public class WebhookSubscriptionResponse {

    private Long id;
    private String name;
    private String url;
    private String eventType;
    private WebhookSubscriptionEntity.WebhookStatus status;
    private String description;
    private WebhookSubscriptionEntity.RetryPolicy retryPolicy;
    private LocalDateTime lastTriggeredAt;
    private LocalDateTime lastSuccessAt;
    private LocalDateTime lastFailureAt;
    private Integer failureCount;
    private Integer successCount;
    private LocalDateTime createdAt;
    private String secret;

    public static WebhookSubscriptionResponse from(WebhookSubscriptionEntity entity, boolean includeSecret) {
        WebhookSubscriptionResponse response = new WebhookSubscriptionResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setUrl(entity.getUrl());
        response.setEventType(entity.getEventType());
        response.setStatus(entity.getStatus());
        response.setDescription(entity.getDescription());
        response.setRetryPolicy(entity.getRetryPolicy());
        response.setLastTriggeredAt(entity.getLastTriggeredAt());
        response.setLastSuccessAt(entity.getLastSuccessAt());
        response.setLastFailureAt(entity.getLastFailureAt());
        response.setFailureCount(entity.getFailureCount());
        response.setSuccessCount(entity.getSuccessCount());
        response.setCreatedAt(entity.getCreatedAt());
        if (includeSecret) {
            response.setSecret(entity.getSecret());
        }
        return response;
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

    public WebhookSubscriptionEntity.WebhookStatus getStatus() {
        return status;
    }

    public void setStatus(WebhookSubscriptionEntity.WebhookStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public WebhookSubscriptionEntity.RetryPolicy getRetryPolicy() {
        return retryPolicy;
    }

    public void setRetryPolicy(WebhookSubscriptionEntity.RetryPolicy retryPolicy) {
        this.retryPolicy = retryPolicy;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
}
