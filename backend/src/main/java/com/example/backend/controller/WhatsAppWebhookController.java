package com.example.backend.controller;

import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.service.WhatsAppMessageProcessingService;
import com.example.backend.service.WhatsAppWebhookSignatureValidator;
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

@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
@Tag(name = "WhatsApp Webhooks", description = "API for receiving WhatsApp webhook events")
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    private final WhatsAppMessageProcessingService processingService;
    private final WhatsAppWebhookSignatureValidator signatureValidator;
    private final ObjectMapper objectMapper;

    public WhatsAppWebhookController(
            WhatsAppMessageProcessingService processingService,
            WhatsAppWebhookSignatureValidator signatureValidator,
            ObjectMapper objectMapper) {
        this.processingService = processingService;
        this.signatureValidator = signatureValidator;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/inbound")
    @Operation(
            summary = "Webhook verification",
            description = "Handles WhatsApp webhook verification challenge")
    public ResponseEntity<String> verifyWebhook(
            @Parameter(description = "Verification mode")
                    @RequestParam(value = "hub.mode", required = false)
                    String mode,
            @Parameter(description = "Verification token")
                    @RequestParam(value = "hub.verify_token", required = false)
                    String token,
            @Parameter(description = "Challenge to echo back")
                    @RequestParam(value = "hub.challenge", required = false)
                    String challenge) {

        if ("subscribe".equals(mode) && token != null) {
            log.info("Webhook verification requested with token: {}", token);
            return ResponseEntity.ok(challenge);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
    }

    @PostMapping("/inbound")
    @Operation(
            summary = "Receive inbound WhatsApp messages and delivery status",
            description =
                    "Handles incoming WhatsApp webhook events including messages and delivery status updates with HMAC signature validation")
    public ResponseEntity<String> receiveWebhook(
            @RequestHeader(value = "X-Org-Id", required = false) String orgIdHeader,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String rawPayload) {

        String orgId =
                (orgIdHeader != null && !orgIdHeader.isBlank())
                        ? orgIdHeader
                        : TenantContext.getOrgId();

        if (orgId == null || orgId.isBlank()) {
            log.error("Organization ID not found for webhook call");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Missing organization context");
        }

        try {
            TenantContext.setOrgId(orgId);

            if (signature != null && !signature.isBlank()) {
                if (!signatureValidator.validateSignature(rawPayload, signature, orgId)) {
                    log.warn("Invalid signature for webhook from org: {}", orgId);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
                }
            }

            WhatsAppWebhookPayload payload =
                    objectMapper.readValue(rawPayload, WhatsAppWebhookPayload.class);
            processingService.processInboundMessage(payload, orgId);

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing WhatsApp webhook for org {}: {}", orgId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Processing error");
        } finally {
            TenantContext.clear();
        }
    }
}
