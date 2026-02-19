package com.example.backend.controller;

import com.example.backend.entity.EmailProviderConfig;
import com.example.backend.repository.EmailProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/email")
public class EmailWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(EmailWebhookController.class);

    private final EmailProviderConfigRepository providerConfigRepository;
    private final ObjectMapper objectMapper;

    public EmailWebhookController(
            EmailProviderConfigRepository providerConfigRepository, ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/{orgId}/delivery")
    public ResponseEntity<Map<String, Object>> handleDeliveryCallback(
            @PathVariable String orgId,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        logger.info("Received email delivery webhook for orgId={}: {}", orgId, payload);

        try {
            EmailProviderConfig config = providerConfigRepository.findByOrgId(orgId).orElse(null);

            if (config == null) {
                logger.warn("No email provider config found for orgId={}", orgId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Provider config not found"));
            }

            if (signature != null && config.getWebhookSecretEncrypted() != null) {
                if (!verifyWebhookSignature(
                        payload, signature, config.getWebhookSecretEncrypted())) {
                    logger.warn("Invalid webhook signature for orgId={}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Invalid signature"));
                }
            }

            processDeliveryEvent(orgId, payload);

            return ResponseEntity.ok(Map.of("status", "processed"));

        } catch (Exception e) {
            logger.error("Error processing email delivery webhook for orgId={}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/{orgId}/bounce")
    public ResponseEntity<Map<String, Object>> handleBounceCallback(
            @PathVariable String orgId,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        logger.info("Received email bounce webhook for orgId={}: {}", orgId, payload);

        try {
            EmailProviderConfig config = providerConfigRepository.findByOrgId(orgId).orElse(null);

            if (config == null) {
                logger.warn("No email provider config found for orgId={}", orgId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Provider config not found"));
            }

            if (signature != null && config.getWebhookSecretEncrypted() != null) {
                if (!verifyWebhookSignature(
                        payload, signature, config.getWebhookSecretEncrypted())) {
                    logger.warn("Invalid webhook signature for orgId={}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Invalid signature"));
                }
            }

            processBounceEvent(orgId, payload);

            return ResponseEntity.ok(Map.of("status", "processed"));

        } catch (Exception e) {
            logger.error("Error processing email bounce webhook for orgId={}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/{orgId}/complaint")
    public ResponseEntity<Map<String, Object>> handleComplaintCallback(
            @PathVariable String orgId,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        logger.info("Received email complaint webhook for orgId={}: {}", orgId, payload);

        try {
            EmailProviderConfig config = providerConfigRepository.findByOrgId(orgId).orElse(null);

            if (config == null) {
                logger.warn("No email provider config found for orgId={}", orgId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Provider config not found"));
            }

            if (signature != null && config.getWebhookSecretEncrypted() != null) {
                if (!verifyWebhookSignature(
                        payload, signature, config.getWebhookSecretEncrypted())) {
                    logger.warn("Invalid webhook signature for orgId={}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Invalid signature"));
                }
            }

            processComplaintEvent(orgId, payload);

            return ResponseEntity.ok(Map.of("status", "processed"));

        } catch (Exception e) {
            logger.error("Error processing email complaint webhook for orgId={}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    private boolean verifyWebhookSignature(
            Map<String, Object> payload, String signature, String secret) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);

            byte[] hmacBytes = mac.doFinal(payloadJson.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hmacBytes);

            return computedSignature.equals(signature);

        } catch (Exception e) {
            logger.error("Error verifying webhook signature", e);
            return false;
        }
    }

    private void processDeliveryEvent(String orgId, Map<String, Object> payload) {
        String messageId = (String) payload.get("messageId");
        String status = (String) payload.get("status");

        logger.info(
                "Processing delivery event for orgId={}, messageId={}, status={}",
                orgId,
                messageId,
                status);
    }

    private void processBounceEvent(String orgId, Map<String, Object> payload) {
        String messageId = (String) payload.get("messageId");
        String bounceType = (String) payload.get("bounceType");

        logger.info(
                "Processing bounce event for orgId={}, messageId={}, bounceType={}",
                orgId,
                messageId,
                bounceType);
    }

    private void processComplaintEvent(String orgId, Map<String, Object> payload) {
        String messageId = (String) payload.get("messageId");
        String complaintType = (String) payload.get("complaintType");

        logger.info(
                "Processing complaint event for orgId={}, messageId={}, complaintType={}",
                orgId,
                messageId,
                complaintType);
    }
}
