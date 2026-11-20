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

    /**
     * Organisation d'un webhook Meta, retrouvée par son numéro WhatsApp ; absent dans certains
     * tests.
     */
    private com.example.backend.repository.WhatsAppProviderConfigRepository
            providerConfigRepository;

    /**
     * « Verify token » saisi dans Meta (WhatsApp > Configuration). Vide : tout jeton accepté, avec
     * un avertissement (à éviter hors développement).
     */
    @org.springframework.beans.factory.annotation.Value("${whatsapp.webhook.verify-token:}")
    private String verifyTokenExpected = "";

    public WhatsAppWebhookController(
            WhatsAppMessageProcessingService messageProcessingService,
            WhatsAppWebhookSignatureValidator signatureValidator,
            ObjectMapper objectMapper) {
        this.messageProcessingService = messageProcessingService;
        this.signatureValidator = signatureValidator;
        this.objectMapper = objectMapper;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setProviderConfigRepository(
            com.example.backend.repository.WhatsAppProviderConfigRepository repository) {
        this.providerConfigRepository = repository;
    }

    @GetMapping("/inbound")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String verifyToken,
            @RequestParam("hub.challenge") String challenge) {

        log.info("WhatsApp webhook verification request received, mode={}", mode);

        if ("subscribe".equalsIgnoreCase(mode)) {
            if (verifyTokenExpected == null || verifyTokenExpected.isBlank()) {
                log.warn(
                        "whatsapp.webhook.verify-token non configuré : jeton de vérification accepté"
                                + " sans contrôle");
                return ResponseEntity.ok(challenge);
            }
            if (verifyTokenExpected.equals(verifyToken)) {
                return ResponseEntity.ok(challenge);
            }
            log.warn("WhatsApp webhook verification failed: verify token mismatch");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
        }

        log.warn("WhatsApp webhook verification failed, mode={}", mode);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
    }

    @PostMapping("/inbound")
    public ResponseEntity<String> receiveInboundWebhook(
            @RequestBody String payload,
            @RequestHeader(value = ORG_ID_HEADER, required = false) String orgId,
            @RequestHeader(value = SIGNATURE_HEADER, required = false) String signature) {

        // Meta n'envoie pas X-Org-Id : l'organisation est celle du numéro WhatsApp qui a reçu le
        // message (metadata.phone_number_id). Dans ce cas la signature Meta est obligatoire.
        boolean resolvedFromPayload = false;
        if (orgId == null || orgId.isBlank()) {
            orgId = orgFromPayload(payload);
            resolvedFromPayload = orgId != null;
        }
        log.info("WhatsApp inbound webhook received for orgId={}", orgId);

        if (orgId == null || orgId.isBlank()) {
            log.warn("Missing organization context for WhatsApp webhook");
            return ResponseEntity.badRequest().body("Missing organization context");
        }
        if (resolvedFromPayload && (signature == null || signature.isBlank())) {
            log.warn("Unsigned WhatsApp webhook rejected for orgId={}", orgId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature");
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

    /** Organisation configurée pour le phone_number_id du premier changement du webhook. */
    private String orgFromPayload(String payload) {
        if (providerConfigRepository == null || payload == null) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.JsonNode id =
                    objectMapper
                            .readTree(payload)
                            .path("entry")
                            .path(0)
                            .path("changes")
                            .path(0)
                            .path("value")
                            .path("metadata")
                            .path("phone_number_id");
            if (!id.isTextual() || id.asText().isBlank()) {
                return null;
            }
            return providerConfigRepository
                    .findFirstByPhoneNumberIdAndEnabledTrue(id.asText())
                    .map(com.example.backend.entity.WhatsAppProviderConfig::getOrgId)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
