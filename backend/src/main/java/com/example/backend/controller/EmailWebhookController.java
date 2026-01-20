package com.example.backend.controller;

import com.example.backend.dto.EmailWebhookPayload;
import com.example.backend.dto.SendGridWebhookPayload;
import com.example.backend.entity.EmailProviderConfig;
import com.example.backend.repository.EmailProviderConfigRepository;
import com.example.backend.service.EmailMessageProcessingService;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks/email")
@Tag(name = "Email Webhooks", description = "API for receiving email webhook events from SendGrid and Mailgun")
public class EmailWebhookController {

    private static final Logger log = LoggerFactory.getLogger(EmailWebhookController.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final EmailMessageProcessingService processingService;
    private final EmailProviderConfigRepository configRepository;
    private final ObjectMapper objectMapper;

    public EmailWebhookController(
            EmailMessageProcessingService processingService,
            EmailProviderConfigRepository configRepository,
            ObjectMapper objectMapper) {
        this.processingService = processingService;
        this.configRepository = configRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/inbound/mailgun", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "Receive inbound emails from Mailgun", description = "Handles incoming email webhook events from Mailgun")
    public ResponseEntity<String> receiveMailgunWebhook(
            @RequestHeader(value = "X-Org-Id", required = false) String orgIdHeader,
            @RequestHeader(value = "X-Mailgun-Signature", required = false) String signature,
            @RequestHeader(value = "X-Mailgun-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-Mailgun-Token", required = false) String token,
            @RequestParam Map<String, String> formData) {

        String orgId = (orgIdHeader != null && !orgIdHeader.isBlank())
                ? orgIdHeader
                : TenantContext.getOrgId();

        if (orgId == null || orgId.isBlank()) {
            log.error("Organization ID not found for Mailgun webhook call");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing organization context");
        }

        try {
            TenantContext.setOrgId(orgId);

            if (signature != null && timestamp != null && token != null) {
                if (!validateMailgunSignature(timestamp, token, signature, orgId)) {
                    log.warn("Invalid Mailgun signature for org: {}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
                }
            }

            EmailWebhookPayload payload = convertMailgunPayload(formData);
            payload.setProvider("mailgun");

            processingService.processInboundEmail(payload, orgId);

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing Mailgun webhook for org {}: {}", orgId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Processing error");
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping(value = "/inbound/sendgrid", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Receive inbound emails from SendGrid", description = "Handles incoming email webhook events from SendGrid")
    public ResponseEntity<String> receiveSendGridWebhook(
            @RequestHeader(value = "X-Org-Id", required = false) String orgIdHeader,
            @RequestParam Map<String, String> formData) {

        String orgId = (orgIdHeader != null && !orgIdHeader.isBlank())
                ? orgIdHeader
                : TenantContext.getOrgId();

        if (orgId == null || orgId.isBlank()) {
            log.error("Organization ID not found for SendGrid webhook call");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing organization context");
        }

        try {
            TenantContext.setOrgId(orgId);

            EmailWebhookPayload payload = convertSendGridPayload(formData);
            payload.setProvider("sendgrid");

            processingService.processInboundEmail(payload, orgId);

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing SendGrid webhook for org {}: {}", orgId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Processing error");
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping(value = "/inbound/generic", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Receive inbound emails from generic provider", description = "Handles incoming email webhook events in JSON format")
    public ResponseEntity<String> receiveGenericWebhook(
            @RequestHeader(value = "X-Org-Id", required = false) String orgIdHeader,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestBody EmailWebhookPayload payload) {

        String orgId = (orgIdHeader != null && !orgIdHeader.isBlank())
                ? orgIdHeader
                : TenantContext.getOrgId();

        if (orgId == null || orgId.isBlank()) {
            log.error("Organization ID not found for generic email webhook call");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing organization context");
        }

        try {
            TenantContext.setOrgId(orgId);

            payload.setProvider("generic");
            processingService.processInboundEmail(payload, orgId);

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing generic email webhook for org {}: {}", orgId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Processing error");
        } finally {
            TenantContext.clear();
        }
    }

    private EmailWebhookPayload convertMailgunPayload(Map<String, String> formData) {
        EmailWebhookPayload payload = new EmailWebhookPayload();
        payload.setFrom(formData.get("sender"));
        payload.setTo(formData.get("recipient"));
        payload.setSubject(formData.get("subject"));
        payload.setText(formData.get("body-plain"));
        payload.setHtml(formData.get("body-html"));
        payload.setStrippedText(formData.get("stripped-text"));
        payload.setStrippedHtml(formData.get("stripped-html"));
        payload.setMessageId(formData.get("Message-Id"));

        String timestampStr = formData.get("timestamp");
        if (timestampStr != null) {
            try {
                payload.setTimestamp(Long.parseLong(timestampStr));
            } catch (NumberFormatException e) {
                log.warn("Failed to parse timestamp: {}", timestampStr);
            }
        }

        return payload;
    }

    private EmailWebhookPayload convertSendGridPayload(Map<String, String> formData) {
        EmailWebhookPayload payload = new EmailWebhookPayload();
        payload.setFrom(formData.get("from"));
        payload.setTo(formData.get("to"));
        payload.setSubject(formData.get("subject"));
        payload.setText(formData.get("text"));
        payload.setHtml(formData.get("html"));
        payload.setMessageId(formData.get("email"));

        return payload;
    }

    private boolean validateMailgunSignature(String timestamp, String token, String signature, String orgId) {
        EmailProviderConfig config = configRepository.findByOrgId(orgId).orElse(null);
        if (config == null || config.getWebhookSecretEncrypted() == null || config.getWebhookSecretEncrypted().isEmpty()) {
            log.warn("No webhook secret configured for org: {}", orgId);
            return false;
        }

        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                config.getWebhookSecretEncrypted().getBytes(StandardCharsets.UTF_8), 
                HMAC_SHA256
            );
            mac.init(secretKeySpec);
            
            String data = timestamp + token;
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(hash);

            return expectedSignature.equals(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error validating Mailgun signature for org {}: {}", orgId, e.getMessage(), e);
            return false;
        }
    }
}
