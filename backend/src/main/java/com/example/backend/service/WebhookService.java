package com.example.backend.service;

import com.example.backend.entity.WebhookDeliveryEntity;
import com.example.backend.entity.WebhookSubscriptionEntity;
import com.example.backend.repository.WebhookDeliveryRepository;
import com.example.backend.repository.WebhookSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
public class WebhookService {

    private static final Logger logger = LoggerFactory.getLogger(WebhookService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final WebhookSubscriptionRepository subscriptionRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public WebhookService(
            WebhookSubscriptionRepository subscriptionRepository,
            WebhookDeliveryRepository deliveryRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.subscriptionRepository = subscriptionRepository;
        this.deliveryRepository = deliveryRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WebhookSubscriptionEntity createSubscription(
            String orgId,
            String name,
            String url,
            String eventType,
            String description,
            WebhookSubscriptionEntity.RetryPolicy retryPolicy) {
        WebhookSubscriptionEntity subscription = new WebhookSubscriptionEntity();
        subscription.setOrgId(orgId);
        subscription.setName(name);
        subscription.setUrl(url);
        subscription.setEventType(eventType);
        subscription.setDescription(description);
        subscription.setSecret(generateSecret());
        subscription.setStatus(WebhookSubscriptionEntity.WebhookStatus.ACTIVE);
        subscription.setRetryPolicy(retryPolicy != null ? retryPolicy : createDefaultRetryPolicy());

        return subscriptionRepository.save(subscription);
    }

    public List<WebhookSubscriptionEntity> getSubscriptionsByOrg(String orgId) {
        return subscriptionRepository.findByOrgId(orgId);
    }

    public Optional<WebhookSubscriptionEntity> getSubscription(Long id, String orgId) {
        return subscriptionRepository.findById(id).filter(sub -> sub.getOrgId().equals(orgId));
    }

    @Transactional
    public void updateSubscriptionStatus(
            Long id, String orgId, WebhookSubscriptionEntity.WebhookStatus status) {
        subscriptionRepository
                .findById(id)
                .filter(sub -> sub.getOrgId().equals(orgId))
                .ifPresent(
                        sub -> {
                            sub.setStatus(status);
                            subscriptionRepository.save(sub);
                        });
    }

    @Transactional
    public void deleteSubscription(Long id, String orgId) {
        subscriptionRepository
                .findById(id)
                .filter(sub -> sub.getOrgId().equals(orgId))
                .ifPresent(subscriptionRepository::delete);
    }

    @Async
    public void triggerWebhook(String eventType, Map<String, Object> payload) {
        List<WebhookSubscriptionEntity> subscriptions =
                subscriptionRepository.findByEventTypeAndStatus(
                        eventType, WebhookSubscriptionEntity.WebhookStatus.ACTIVE);

        for (WebhookSubscriptionEntity subscription : subscriptions) {
            WebhookDeliveryEntity delivery = new WebhookDeliveryEntity();
            delivery.setOrgId(subscription.getOrgId());
            delivery.setSubscriptionId(subscription.getId());
            delivery.setEventType(eventType);
            delivery.setPayload(payload);
            delivery.setStatus(WebhookDeliveryEntity.DeliveryStatus.PENDING);
            delivery.setAttemptCount(0);

            WebhookDeliveryEntity saved = deliveryRepository.save(delivery);
            deliverWebhook(saved, subscription);
        }
    }

    @Transactional
    protected void deliverWebhook(
            WebhookDeliveryEntity delivery, WebhookSubscriptionEntity subscription) {
        try {
            String payloadJson = objectMapper.writeValueAsString(delivery.getPayload());
            String signature = generateSignature(payloadJson, subscription.getSecret());

            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("X-Webhook-Signature", signature);
            headers.set("X-Webhook-Event", delivery.getEventType());
            headers.set("X-Webhook-Delivery-Id", delivery.getId().toString());

            if (subscription.getHeaders() != null) {
                subscription.getHeaders().forEach(h -> headers.set(h.getName(), h.getValue()));
            }

            HttpEntity<String> request = new HttpEntity<>(payloadJson, headers);

            delivery.setAttemptCount(delivery.getAttemptCount() + 1);
            delivery.setLastAttemptAt(LocalDateTime.now());

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            subscription.getUrl(), HttpMethod.POST, request, String.class);

            delivery.setResponseStatusCode(response.getStatusCode().value());
            delivery.setResponseBody(response.getBody());

            if (response.getStatusCode().is2xxSuccessful()) {
                delivery.setStatus(WebhookDeliveryEntity.DeliveryStatus.SUCCESS);
                subscription.setLastSuccessAt(LocalDateTime.now());
                subscription.setSuccessCount(subscription.getSuccessCount() + 1);
                subscription.setFailureCount(0);
            } else {
                handleFailure(delivery, subscription, "HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error(
                    "Failed to deliver webhook for subscription {}: {}",
                    subscription.getId(),
                    e.getMessage());
            handleFailure(delivery, subscription, e.getMessage());
        }

        deliveryRepository.save(delivery);
        subscription.setLastTriggeredAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
    }

    private void handleFailure(
            WebhookDeliveryEntity delivery, WebhookSubscriptionEntity subscription, String error) {
        delivery.setErrorMessage(error);
        subscription.setLastFailureAt(LocalDateTime.now());
        subscription.setFailureCount(subscription.getFailureCount() + 1);

        WebhookSubscriptionEntity.RetryPolicy retryPolicy = subscription.getRetryPolicy();
        if (delivery.getAttemptCount() < retryPolicy.getMaxRetries()) {
            delivery.setStatus(WebhookDeliveryEntity.DeliveryStatus.RETRY);
            int delaySeconds = calculateRetryDelay(delivery.getAttemptCount(), retryPolicy);
            delivery.setNextRetryAt(LocalDateTime.now().plusSeconds(delaySeconds));
        } else {
            delivery.setStatus(WebhookDeliveryEntity.DeliveryStatus.FAILED);
        }
    }

    private int calculateRetryDelay(
            int attemptCount, WebhookSubscriptionEntity.RetryPolicy retryPolicy) {
        int baseDelay = retryPolicy.getRetryDelaySeconds();
        if ("exponential".equals(retryPolicy.getBackoffStrategy())) {
            return baseDelay * (int) Math.pow(2, attemptCount - 1);
        }
        return baseDelay;
    }

    public String generateSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to generate webhook signature", e);
        }
    }

    public boolean verifySignature(String payload, String signature, String secret) {
        String expectedSignature = generateSignature(payload, secret);
        return expectedSignature.equals(signature);
    }

    public Page<WebhookDeliveryEntity> getDeliveries(
            Long subscriptionId, String orgId, Pageable pageable) {
        return subscriptionRepository
                .findById(subscriptionId)
                .filter(sub -> sub.getOrgId().equals(orgId))
                .map(sub -> deliveryRepository.findBySubscriptionId(subscriptionId, pageable))
                .orElse(Page.empty());
    }

    private String generateSecret() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private WebhookSubscriptionEntity.RetryPolicy createDefaultRetryPolicy() {
        WebhookSubscriptionEntity.RetryPolicy policy = new WebhookSubscriptionEntity.RetryPolicy();
        policy.setMaxRetries(3);
        policy.setRetryDelaySeconds(60);
        policy.setBackoffStrategy("exponential");
        return policy;
    }
}
