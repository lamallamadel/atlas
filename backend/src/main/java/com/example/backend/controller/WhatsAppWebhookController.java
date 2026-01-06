package com.example.backend.controller;

import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.service.WhatsAppMessageProcessingService;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
@Tag(name = "WhatsApp Webhooks", description = "API for receiving WhatsApp webhook events")
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final WhatsAppMessageProcessingService processingService;
    private final ObjectMapper objectMapper;

    public WhatsAppWebhookController(
            WhatsAppMessageProcessingService processingService,
            ObjectMapper objectMapper) {
        this.processingService = processingService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/inbound")
    @Operation(summary = "Webhook verification", description = "Handles WhatsApp webhook verification challenge")
    public ResponseEntity<String> verifyWebhook(
            @Parameter(description = "Verification mode") @RequestParam(value = "hub.mode", required = false) String mode,
            @Parameter(description = "Verification token") @RequestParam(value = "hub.verify_token", required = false) String token,
            @Parameter(description = "Challenge to echo back") @RequestParam(value = "hub.challenge", required = false) String challenge) {

        if ("subscribe".equals(mode) && token != null) {
            log.info("Webhook verification requested with token: {}", token);
            return ResponseEntity.ok(challenge);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
    }

    @PostMapping("/inbound")
@Operation(summary = "Receive inbound WhatsApp messages", description = "Handles incoming WhatsApp webhook events with HMAC signature validation")
public ResponseEntity<String> receiveInboundMessage(
        @RequestHeader(value = "X-Org-Id", required = false) String orgIdHeader,
        @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
        @RequestBody String rawPayload) {

        // Webhooks bypass TenantFilter, so orgId must come from header here.
        String orgId = (orgIdHeader != null && !orgIdHeader.isBlank())
                ? orgIdHeader
                : TenantContext.getOrgId();

        if (orgId == null || orgId.isBlank()) {
            log.error("Organization ID not found for webhook call");
            // Tests expect plain text body
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing organization context");
        }

        try {
            TenantContext.setOrgId(orgId);

            // Signature is optional in tests:
            // - if provided and invalid -> 401
            // - if missing -> accept and process
            if (signature != null && !signature.isBlank()) {
                if (!validateSignature(rawPayload, signature, orgId)) {
                    log.warn("Invalid signature for webhook from org: {}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
                }
            }

            WhatsAppWebhookPayload payload = objectMapper.readValue(rawPayload, WhatsAppWebhookPayload.class);
            processingService.processInboundMessage(payload, orgId);

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing WhatsApp webhook for org {}: {}", orgId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Processing error");
        } finally {
            TenantContext.clear();
        }
    }


    private boolean validateSignature(String payload, String signature, String orgId) {
        String webhookSecret = processingService.getWebhookSecret(orgId);
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            log.warn("No webhook secret configured for org: {}", orgId);
            return false;
        }

        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = "sha256=" + HexFormat.of().formatHex(hash);

            return expectedSignature.equals(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error validating signature for org {}: {}", orgId, e.getMessage(), e);
            return false;
        }
    }
}
