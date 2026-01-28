package com.example.backend.controller;

import com.example.backend.entity.StripeSubscriptionEntity;
import com.example.backend.entity.TenantUsageEntity;
import com.example.backend.service.StripeIntegrationService;
import com.example.backend.service.TenantUsageTrackingService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/billing")
@Tag(name = "Billing", description = "Billing and subscription management APIs")
public class BillingController {

    private final StripeIntegrationService stripeService;
    private final TenantUsageTrackingService usageService;

    public BillingController(
            StripeIntegrationService stripeService,
            TenantUsageTrackingService usageService) {
        this.stripeService = stripeService;
        this.usageService = usageService;
    }

    @GetMapping("/subscription")
    @Operation(summary = "Get current subscription details")
    public ResponseEntity<StripeSubscriptionEntity> getSubscription() {
        String orgId = TenantContext.getOrgId();
        Optional<StripeSubscriptionEntity> subscription = stripeService.getSubscriptionByOrgId(orgId);
        return subscription.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/subscription/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new subscription")
    public ResponseEntity<StripeSubscriptionEntity> createSubscription(
            @RequestBody Map<String, String> request) {
        
        String orgId = TenantContext.getOrgId();
        String planTier = request.get("planTier");
        String billingPeriod = request.getOrDefault("billingPeriod", "monthly");
        String customerEmail = request.get("customerEmail");

        StripeSubscriptionEntity subscription = stripeService.createSubscription(
            orgId, planTier, billingPeriod, customerEmail
        );

        return ResponseEntity.ok(subscription);
    }

    @GetMapping("/usage/current")
    @Operation(summary = "Get current period usage")
    public ResponseEntity<Map<String, Object>> getCurrentUsage() {
        String orgId = TenantContext.getOrgId();
        Map<String, Object> usage = usageService.getCurrentPeriodUsage(orgId);
        return ResponseEntity.ok(usage);
    }

    @GetMapping("/usage/history")
    @Operation(summary = "Get usage history")
    public ResponseEntity<List<TenantUsageEntity>> getUsageHistory() {
        String orgId = TenantContext.getOrgId();
        List<TenantUsageEntity> history = usageService.getUsageHistory(orgId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/estimate")
    @Operation(summary = "Calculate estimated bill for current period")
    public ResponseEntity<Map<String, Object>> getEstimatedBill() {
        String orgId = TenantContext.getOrgId();
        Map<String, Object> bill = stripeService.calculateMonthlyBill(orgId);
        return ResponseEntity.ok(bill);
    }

    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook endpoint")
    public ResponseEntity<Void> handleStripeWebhook(@RequestBody Map<String, Object> payload) {
        String eventType = (String) payload.get("type");
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) payload.get("data");
        
        stripeService.handleWebhook(eventType, data);
        return ResponseEntity.ok().build();
    }
}
