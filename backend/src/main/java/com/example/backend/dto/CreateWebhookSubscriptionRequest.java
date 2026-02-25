package com.example.backend.dto;

import com.example.backend.entity.WebhookSubscriptionEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateWebhookSubscriptionRequest {

    @NotBlank private String name;

    @NotBlank
    @Pattern(regexp = "^https?://.*", message = "URL must start with http:// or https://")
    private String url;

    @NotBlank private String eventType;

    private String description;

    private WebhookSubscriptionEntity.RetryPolicy retryPolicy;

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
}
