package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.ApiKeyEntity;
import com.example.backend.entity.WebhookSubscriptionEntity;
import com.example.backend.service.ApiKeyService;
import com.example.backend.service.ApiUsageTrackingService;
import com.example.backend.service.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/developer")
@Tag(name = "Developer Portal", description = "API key and webhook management for developers")
@PreAuthorize("isAuthenticated()")
public class DeveloperPortalController {

    private final ApiKeyService apiKeyService;
    private final WebhookService webhookService;
    private final ApiUsageTrackingService usageTrackingService;

    public DeveloperPortalController(ApiKeyService apiKeyService, 
                                    WebhookService webhookService,
                                    ApiUsageTrackingService usageTrackingService) {
        this.apiKeyService = apiKeyService;
        this.webhookService = webhookService;
        this.usageTrackingService = usageTrackingService;
    }

    @PostMapping("/api-keys")
    @Operation(summary = "Create API key", description = "Generate a new API key")
    public ResponseEntity<ApiKeyResponse> createApiKey(
        @RequestAttribute("orgId") String orgId,
        @Valid @RequestBody CreateApiKeyRequest request
    ) {
        ApiKeyService.ApiKeyCreateResult result = apiKeyService.createApiKey(
            orgId, 
            request.getName(), 
            request.getDescription(),
            request.getTier(),
            request.getScopes(),
            request.getExpiresAt()
        );

        ApiKeyResponse response = ApiKeyResponse.from(result.getEntity());
        response.setPlainTextKey(result.getPlainTextKey());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api-keys")
    @Operation(summary = "List API keys", description = "Get all API keys for the organization")
    public ResponseEntity<List<ApiKeyResponse>> listApiKeys(
        @RequestAttribute("orgId") String orgId
    ) {
        List<ApiKeyResponse> keys = apiKeyService.getApiKeysByOrg(orgId).stream()
            .map(ApiKeyResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(keys);
    }

    @GetMapping("/api-keys/{id}")
    @Operation(summary = "Get API key", description = "Get details of a specific API key")
    public ResponseEntity<ApiKeyResponse> getApiKey(
        @RequestAttribute("orgId") String orgId,
        @PathVariable Long id
    ) {
        return apiKeyService.getApiKey(id, orgId)
            .map(ApiKeyResponse::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api-keys/{id}")
    @Operation(summary = "Revoke API key", description = "Revoke an API key")
    public ResponseEntity<Void> revokeApiKey(
        @RequestAttribute("orgId") String orgId,
        @PathVariable Long id
    ) {
        apiKeyService.revokeApiKey(id, orgId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api-keys/{id}/usage")
    @Operation(summary = "Get API key usage", description = "Get usage statistics for an API key")
    public ResponseEntity<List<Map<String, Object>>> getApiKeyUsage(
        @RequestAttribute("orgId") String orgId,
        @PathVariable Long id,
        @RequestParam(required = false, defaultValue = "30") int days
    ) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        List<Map<String, Object>> usage = usageTrackingService.getUsageByApiKey(id, startDate, endDate)
            .stream()
            .map(u -> Map.<String, Object>of(
                "date", u.getUsageDate(),
                "endpoint", u.getEndpoint(),
                "requestCount", u.getRequestCount(),
                "successCount", u.getSuccessCount(),
                "errorCount", u.getErrorCount(),
                "avgResponseTimeMs", u.getAvgResponseTimeMs()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(usage);
    }

    @PostMapping("/webhooks")
    @Operation(summary = "Create webhook subscription", description = "Subscribe to webhook events")
    public ResponseEntity<WebhookSubscriptionResponse> createWebhookSubscription(
        @RequestAttribute("orgId") String orgId,
        @Valid @RequestBody CreateWebhookSubscriptionRequest request
    ) {
        WebhookSubscriptionEntity subscription = webhookService.createSubscription(
            orgId,
            request.getName(),
            request.getUrl(),
            request.getEventType(),
            request.getDescription(),
            request.getRetryPolicy()
        );

        return ResponseEntity.ok(WebhookSubscriptionResponse.from(subscription, true));
    }

    @GetMapping("/webhooks")
    @Operation(summary = "List webhook subscriptions", description = "Get all webhook subscriptions")
    public ResponseEntity<List<WebhookSubscriptionResponse>> listWebhookSubscriptions(
        @RequestAttribute("orgId") String orgId
    ) {
        List<WebhookSubscriptionResponse> subscriptions = webhookService.getSubscriptionsByOrg(orgId)
            .stream()
            .map(s -> WebhookSubscriptionResponse.from(s, false))
            .collect(Collectors.toList());
        return ResponseEntity.ok(subscriptions);
    }

    @GetMapping("/webhooks/{id}")
    @Operation(summary = "Get webhook subscription", description = "Get details of a webhook subscription")
    public ResponseEntity<WebhookSubscriptionResponse> getWebhookSubscription(
        @RequestAttribute("orgId") String orgId,
        @PathVariable Long id
    ) {
        return webhookService.getSubscription(id, orgId)
            .map(s -> WebhookSubscriptionResponse.from(s, true))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/webhooks/{id}/status")
    @Operation(summary = "Update webhook status", description = "Enable or disable a webhook subscription")
    public ResponseEntity<Void> updateWebhookStatus(
        @RequestAttribute("orgId") String orgId,
        @PathVariable Long id,
        @RequestBody Map<String, String> body
    ) {
        WebhookSubscriptionEntity.WebhookStatus status = 
            WebhookSubscriptionEntity.WebhookStatus.valueOf(body.get("status"));
        webhookService.updateSubscriptionStatus(id, orgId, status);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/webhooks/{id}")
    @Operation(summary = "Delete webhook subscription", description = "Remove a webhook subscription")
    public ResponseEntity<Void> deleteWebhookSubscription(
        @RequestAttribute("orgId") String orgId,
        @PathVariable Long id
    ) {
        webhookService.deleteSubscription(id, orgId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/webhooks/{id}/deliveries")
    @Operation(summary = "Get webhook deliveries", description = "Get delivery history for a webhook")
    public ResponseEntity<Page<Map<String, Object>>> getWebhookDeliveries(
        @RequestAttribute("orgId") String orgId,
        @PathVariable Long id,
        Pageable pageable
    ) {
        Page<Map<String, Object>> deliveries = webhookService.getDeliveries(id, orgId, pageable)
            .map(d -> Map.<String, Object>of(
                "id", d.getId(),
                "eventType", d.getEventType(),
                "status", d.getStatus(),
                "attemptCount", d.getAttemptCount(),
                "lastAttemptAt", d.getLastAttemptAt(),
                "responseStatusCode", d.getResponseStatusCode() != null ? d.getResponseStatusCode() : 0,
                "errorMessage", d.getErrorMessage() != null ? d.getErrorMessage() : ""
            ));
        return ResponseEntity.ok(deliveries);
    }
}
