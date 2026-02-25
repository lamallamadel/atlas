package com.example.backend.service;

import com.example.backend.entity.StripeSubscriptionEntity;
import com.example.backend.repository.StripeSubscriptionRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(StripeIntegrationService.class);

    @Value("${stripe.api.key:}")
    private String stripeApiKey;

    private final StripeSubscriptionRepository subscriptionRepository;
    private final TenantUsageTrackingService usageTrackingService;

    public StripeIntegrationService(
            StripeSubscriptionRepository subscriptionRepository,
            TenantUsageTrackingService usageTrackingService) {
        this.subscriptionRepository = subscriptionRepository;
        this.usageTrackingService = usageTrackingService;
    }

    @Transactional
    public StripeSubscriptionEntity createSubscription(
            String orgId, String planTier, String billingPeriod, String customerEmail) {

        logger.info("Creating Stripe subscription for orgId={}, plan={}", orgId, planTier);

        String customerId = createStripeCustomer(customerEmail, orgId);
        String subscriptionId = createStripeSubscription(customerId, planTier, billingPeriod);

        StripeSubscriptionEntity subscription = new StripeSubscriptionEntity();
        subscription.setOrgId(orgId);
        subscription.setStripeCustomerId(customerId);
        subscription.setStripeSubscriptionId(subscriptionId);
        subscription.setStatus("active");
        subscription.setPlanTier(planTier);
        subscription.setBillingPeriod(billingPeriod);

        setPricingByPlan(subscription, planTier);

        LocalDateTime now = LocalDateTime.now();
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(now.plusMonths(billingPeriod.equals("monthly") ? 1 : 12));
        subscription.setNextBillingDate(subscription.getCurrentPeriodEnd());

        subscription.setMetadata(new HashMap<>());

        return subscriptionRepository.save(subscription);
    }

    private void setPricingByPlan(StripeSubscriptionEntity subscription, String planTier) {
        switch (planTier.toLowerCase()) {
            case "starter":
                subscription.setBasePriceCents(2900);
                subscription.setIncludedMessages(1000);
                subscription.setIncludedStorageGb(10);
                subscription.setMaxUsers(5);
                subscription.setMessageOveragePriceCents(10);
                subscription.setStorageOveragePriceCents(50);
                break;
            case "professional":
                subscription.setBasePriceCents(9900);
                subscription.setIncludedMessages(10000);
                subscription.setIncludedStorageGb(50);
                subscription.setMaxUsers(20);
                subscription.setMessageOveragePriceCents(5);
                subscription.setStorageOveragePriceCents(30);
                break;
            case "enterprise":
                subscription.setBasePriceCents(29900);
                subscription.setIncludedMessages(100000);
                subscription.setIncludedStorageGb(500);
                subscription.setMaxUsers(-1);
                subscription.setMessageOveragePriceCents(2);
                subscription.setStorageOveragePriceCents(20);
                break;
        }
    }

    private String createStripeCustomer(String email, String orgId) {
        logger.debug("Creating Stripe customer for email={}, orgId={}", email, orgId);
        return "cus_mock_" + orgId.replace("-", "").substring(0, 14);
    }

    private String createStripeSubscription(
            String customerId, String planTier, String billingPeriod) {
        logger.debug("Creating Stripe subscription for customer={}", customerId);
        return "sub_mock_" + System.currentTimeMillis();
    }

    @Transactional
    public void handleWebhook(String eventType, Map<String, Object> data) {
        logger.info("Processing Stripe webhook: {}", eventType);

        switch (eventType) {
            case "customer.subscription.updated":
                handleSubscriptionUpdated(data);
                break;
            case "customer.subscription.deleted":
                handleSubscriptionDeleted(data);
                break;
            case "invoice.payment_succeeded":
                handlePaymentSucceeded(data);
                break;
            case "invoice.payment_failed":
                handlePaymentFailed(data);
                break;
            default:
                logger.debug("Unhandled webhook event type: {}", eventType);
        }
    }

    private void handleSubscriptionUpdated(Map<String, Object> data) {
        String subscriptionId = (String) data.get("subscriptionId");
        Optional<StripeSubscriptionEntity> subOpt =
                subscriptionRepository.findByStripeSubscriptionId(subscriptionId);

        if (subOpt.isPresent()) {
            StripeSubscriptionEntity subscription = subOpt.get();
            subscription.setStatus((String) data.getOrDefault("status", subscription.getStatus()));
            subscriptionRepository.save(subscription);
            logger.info("Subscription updated: {}", subscriptionId);
        }
    }

    private void handleSubscriptionDeleted(Map<String, Object> data) {
        String subscriptionId = (String) data.get("subscriptionId");
        Optional<StripeSubscriptionEntity> subOpt =
                subscriptionRepository.findByStripeSubscriptionId(subscriptionId);

        if (subOpt.isPresent()) {
            StripeSubscriptionEntity subscription = subOpt.get();
            subscription.setStatus("canceled");
            subscription.setCanceledAt(LocalDateTime.now());
            subscription.setEndedAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
            logger.info("Subscription canceled: {}", subscriptionId);
        }
    }

    private void handlePaymentSucceeded(Map<String, Object> data) {
        String customerId = (String) data.get("customerId");
        Optional<StripeSubscriptionEntity> subOpt =
                subscriptionRepository.findByStripeCustomerId(customerId);

        if (subOpt.isPresent()) {
            StripeSubscriptionEntity subscription = subOpt.get();
            subscription.setLastPaymentStatus("succeeded");
            subscription.setLastPaymentAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
            logger.info("Payment succeeded for customer: {}", customerId);
        }
    }

    private void handlePaymentFailed(Map<String, Object> data) {
        String customerId = (String) data.get("customerId");
        Optional<StripeSubscriptionEntity> subOpt =
                subscriptionRepository.findByStripeCustomerId(customerId);

        if (subOpt.isPresent()) {
            StripeSubscriptionEntity subscription = subOpt.get();
            subscription.setLastPaymentStatus("failed");
            subscription.setLastPaymentAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
            logger.warn("Payment failed for customer: {}", customerId);
        }
    }

    public Optional<StripeSubscriptionEntity> getSubscriptionByOrgId(String orgId) {
        return subscriptionRepository.findByOrgId(orgId);
    }

    @Transactional
    public Map<String, Object> calculateMonthlyBill(String orgId) {
        StripeSubscriptionEntity subscription =
                subscriptionRepository
                        .findByOrgId(orgId)
                        .orElseThrow(
                                () ->
                                        new IllegalStateException(
                                                "No subscription found for orgId: " + orgId));

        Map<String, Object> usage = usageTrackingService.getCurrentPeriodUsage(orgId);

        int totalMessages = (int) usage.getOrDefault("totalMessages", 0);
        long totalStorageBytes = (long) usage.getOrDefault("totalStorageBytes", 0L);
        long totalStorageGb = totalStorageBytes / (1024L * 1024L * 1024L);

        int messageOverage = Math.max(0, totalMessages - subscription.getIncludedMessages());
        long storageOverage = Math.max(0, totalStorageGb - subscription.getIncludedStorageGb());

        int messageOverageCost = messageOverage * subscription.getMessageOveragePriceCents();
        int storageOverageCost =
                (int) (storageOverage * subscription.getStorageOveragePriceCents());

        int totalCents = subscription.getBasePriceCents() + messageOverageCost + storageOverageCost;

        Map<String, Object> bill = new HashMap<>();
        bill.put("basePriceCents", subscription.getBasePriceCents());
        bill.put("messageOverageCents", messageOverageCost);
        bill.put("storageOverageCents", storageOverageCost);
        bill.put("totalCents", totalCents);
        bill.put("totalDollars", totalCents / 100.0);
        bill.put("includedMessages", subscription.getIncludedMessages());
        bill.put("usedMessages", totalMessages);
        bill.put("overageMessages", messageOverage);
        bill.put("includedStorageGb", subscription.getIncludedStorageGb());
        bill.put("usedStorageGb", totalStorageGb);
        bill.put("overageStorageGb", storageOverage);

        return bill;
    }
}
