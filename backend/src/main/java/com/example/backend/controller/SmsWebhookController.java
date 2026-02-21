package com.example.backend.controller;

import com.example.backend.entity.SmsProviderConfig;
import com.example.backend.repository.SmsProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/sms")
public class SmsWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(SmsWebhookController.class);

    private final SmsProviderConfigRepository providerConfigRepository;
    private final ObjectMapper objectMapper;

    public SmsWebhookController(
            SmsProviderConfigRepository providerConfigRepository, ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/{orgId}/twilio/status")
    public ResponseEntity<String> handleTwilioStatusCallback(
            @PathVariable String orgId,
            @RequestHeader(value = "X-Twilio-Signature", required = false) String signature,
            @RequestParam Map<String, String> params) {

        logger.info("Received Twilio status webhook for orgId={}: {}", orgId, params);

        try {
            SmsProviderConfig config = providerConfigRepository.findByOrgId(orgId).orElse(null);

            if (config == null) {
                logger.warn("No SMS provider config found for orgId={}", orgId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Provider config not found");
            }

            if (signature != null && config.getWebhookSecretEncrypted() != null) {
                if (!verifyTwilioSignature(params, signature, config.getWebhookSecretEncrypted())) {
                    logger.warn("Invalid Twilio webhook signature for orgId={}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
                }
            }

            processTwilioStatusEvent(orgId, params);

            return ResponseEntity.ok("OK");

        } catch (Exception e) {
            logger.error("Error processing Twilio status webhook for orgId={}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error");
        }
    }

    @PostMapping(
            value = "/{orgId}/aws-sns/delivery",
            consumes = {MediaType.APPLICATION_JSON_VALUE, "text/plain"})
    public ResponseEntity<Map<String, Object>> handleAwsSnsDeliveryCallback(
            @PathVariable String orgId,
            @RequestHeader(value = "x-amz-sns-message-type", required = false) String messageType,
            @RequestBody String rawPayload) {

        logger.info(
                "Received AWS SNS delivery webhook for orgId={}, messageType={}",
                orgId,
                messageType);

        try {
            SmsProviderConfig config = providerConfigRepository.findByOrgId(orgId).orElse(null);

            if (config == null) {
                logger.warn("No SMS provider config found for orgId={}", orgId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Provider config not found"));
            }

            Map<String, Object> payload = objectMapper.readValue(rawPayload, Map.class);

            if ("SubscriptionConfirmation".equals(messageType)) {
                String subscribeUrl = (String) payload.get("SubscribeURL");
                logger.info(
                        "AWS SNS subscription confirmation for orgId={}, URL={}",
                        orgId,
                        subscribeUrl);
                return ResponseEntity.ok(
                        Map.of("status", "confirmed", "subscribeUrl", subscribeUrl));
            }

            if ("Notification".equals(messageType)) {
                processAwsSnsNotification(orgId, payload);
            }

            return ResponseEntity.ok(Map.of("status", "processed"));

        } catch (Exception e) {
            logger.error("Error processing AWS SNS delivery webhook for orgId={}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/{orgId}/delivery")
    public ResponseEntity<Map<String, Object>> handleGenericDeliveryCallback(
            @PathVariable String orgId,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        logger.info("Received generic SMS delivery webhook for orgId={}: {}", orgId, payload);

        try {
            SmsProviderConfig config = providerConfigRepository.findByOrgId(orgId).orElse(null);

            if (config == null) {
                logger.warn("No SMS provider config found for orgId={}", orgId);
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

            processGenericDeliveryEvent(orgId, payload);

            return ResponseEntity.ok(Map.of("status", "processed"));

        } catch (Exception e) {
            logger.error("Error processing generic SMS delivery webhook for orgId={}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    private boolean verifyTwilioSignature(
            Map<String, String> params, String signature, String authToken) {
        try {
            StringBuilder data = new StringBuilder();
            params.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> data.append(entry.getKey()).append(entry.getValue()));

            Mac mac = Mac.getInstance("HmacSHA1");
            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(authToken.getBytes(StandardCharsets.UTF_8), "HmacSHA1");
            mac.init(secretKeySpec);

            byte[] hmacBytes = mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hmacBytes);

            return computedSignature.equals(signature);

        } catch (Exception e) {
            logger.error("Error verifying Twilio webhook signature", e);
            return false;
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

    private void processTwilioStatusEvent(String orgId, Map<String, String> params) {
        String messageSid = params.get("MessageSid");
        String messageStatus = params.get("MessageStatus");
        String errorCode = params.get("ErrorCode");

        logger.info(
                "Processing Twilio status event for orgId={}, sid={}, status={}, errorCode={}",
                orgId,
                messageSid,
                messageStatus,
                errorCode);

        if ("delivered".equalsIgnoreCase(messageStatus)) {
            logger.info("SMS delivered successfully: sid={}", messageSid);
        } else if ("failed".equalsIgnoreCase(messageStatus)
                || "undelivered".equalsIgnoreCase(messageStatus)) {
            logger.warn(
                    "SMS delivery failed: sid={}, status={}, errorCode={}",
                    messageSid,
                    messageStatus,
                    errorCode);
        }
    }

    private void processAwsSnsNotification(String orgId, Map<String, Object> payload) {
        String message = (String) payload.get("Message");

        logger.info("Processing AWS SNS notification for orgId={}: {}", orgId, message);

        try {
            Map<String, Object> messageData = objectMapper.readValue(message, Map.class);
            String status = (String) messageData.get("status");
            String messageId = (String) messageData.get("messageId");

            logger.info(
                    "AWS SNS delivery status for orgId={}, messageId={}, status={}",
                    orgId,
                    messageId,
                    status);

        } catch (Exception e) {
            logger.debug("Could not parse AWS SNS message data", e);
        }
    }

    private void processGenericDeliveryEvent(String orgId, Map<String, Object> payload) {
        String messageId = (String) payload.get("messageId");
        String status = (String) payload.get("status");

        logger.info(
                "Processing generic delivery event for orgId={}, messageId={}, status={}",
                orgId,
                messageId,
                status);
    }
}
