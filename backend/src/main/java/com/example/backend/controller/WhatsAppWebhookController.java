package com.example.backend.controller;

import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.service.WhatsAppMessageProcessingService;
import com.example.backend.service.WhatsAppWebhookSignatureValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String SIGNATURE_HEADER = "X-Hub-Signature-256";

    private final WhatsAppMessageProcessingService messageProcessingService;
    private final WhatsAppWebhookSignatureValidator signatureValidator;
    private final ObjectMapper objectMapper;

    public WhatsAppWebhookController(
            WhatsAppMessageProcessingService messageProcessingService,
            WhatsAppWebhookSignatureValidator signatureValidator,
            ObjectMapper objectMapper) {
        this.messageProcessingService = messageProcessingService;
        this.signatureValidator = signatureValidator;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/inbound")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String verifyToken,
            @RequestParam("hub.challenge") String challenge) {

        log.info("WhatsApp webhook verification request received, mode={}", mode);

        if ("subscribe".equalsIgnoreCase(mode)) {
            return ResponseEntity.ok(challenge);
        }

        log.warn("WhatsApp webhook verification failed, mode={}", mode);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
    }

    @PostMapping("/inbound")
    public ResponseEntity<String> receiveInboundWebhook(
            @RequestBody String payload,
            @RequestHeader(value = ORG_ID_HEADER, required = false) String orgId,
            @RequestHeader(value = SIGNATURE_HEADER, required = false) String signature) {

        log.info("WhatsApp inbound webhook received for orgId={}", orgId);

        if (orgId == null || orgId.isBlank()) {
            log.warn("Missing organization context for WhatsApp webhook");
            return ResponseEntity.badRequest().body("Missing organization context");
        }

        try {
            if (signature != null && !signature.isBlank()) {
                boolean valid = signatureValidator.validateSignature(payload, signature, orgId);
                if (!valid) {
                    log.warn("Invalid WhatsApp webhook signature for orgId={}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
                }
            }

            WhatsAppWebhookPayload webhookPayload =
                    objectMapper.readValue(payload, WhatsAppWebhookPayload.class);

            messageProcessingService.processInboundMessage(webhookPayload, orgId);

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing WhatsApp inbound webhook for orgId={}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

