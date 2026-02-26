package com.example.backend.controller;

import com.example.backend.dto.TemplateStatusWebhookPayload;
import com.example.backend.entity.enums.TemplateStatus;
import com.example.backend.service.WhatsAppTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/whatsapp/webhooks")
@Tag(name = "WhatsApp Webhooks", description = "Webhook handlers for WhatsApp Business API")
public class WhatsAppTemplateWebhookController {

    private static final Logger logger =
            LoggerFactory.getLogger(WhatsAppTemplateWebhookController.class);

    private final WhatsAppTemplateService templateService;

    public WhatsAppTemplateWebhookController(WhatsAppTemplateService templateService) {
        this.templateService = templateService;
    }

    @PostMapping("/template-status")
    @Operation(
            summary = "Handle template status webhook",
            description = "Receives template approval/rejection events from Meta Business API")
    public ResponseEntity<Void> handleTemplateStatusWebhook(
            @Parameter(description = "Webhook payload from Meta") @RequestBody
                    TemplateStatusWebhookPayload payload) {

        logger.info("Received template status webhook: {}", payload);

        try {
            processTemplateStatusWebhook(payload);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error processing template status webhook", e);
            return ResponseEntity.status(500).build();
        }
    }

    private void processTemplateStatusWebhook(TemplateStatusWebhookPayload payload) {
        if (payload.getEntry() == null || payload.getEntry().isEmpty()) {
            logger.warn("Received webhook with no entries");
            return;
        }

        for (TemplateStatusWebhookPayload.Entry entry : payload.getEntry()) {
            if (entry.getChanges() == null) {
                continue;
            }

            for (TemplateStatusWebhookPayload.Change change : entry.getChanges()) {
                if (!"message_template_status_update".equals(change.getField())) {
                    continue;
                }

                TemplateStatusWebhookPayload.Value value = change.getValue();
                if (value == null) {
                    continue;
                }

                processTemplateStatusUpdate(value);
            }
        }
    }

    private void processTemplateStatusUpdate(TemplateStatusWebhookPayload.Value value) {
        String event = value.getEvent();
        String messageTemplateId = value.getMessageTemplateId();
        String messageTemplateName = value.getMessageTemplateName();
        String messageTemplateLanguage = value.getMessageTemplateLanguage();
        String reason = value.getReason();

        if (event == null) {
            logger.warn("Received webhook with missing event");
            return;
        }

        TemplateStatus status = mapEventToStatus(event);
        if (status == null) {
            logger.warn("Unknown template status event: {}", event);
            return;
        }

        try {
            if (messageTemplateId != null) {
                templateService.updateTemplateStatus(messageTemplateId, status, reason);
                logger.info(
                        "Updated template {} to status {} (reason: {})",
                        messageTemplateId,
                        status,
                        reason);
            } else if (messageTemplateName != null && messageTemplateLanguage != null) {
                templateService.updateTemplateStatusByNameAndLanguage(
                        messageTemplateName,
                        messageTemplateLanguage,
                        status,
                        messageTemplateId,
                        reason);
                logger.info(
                        "Updated template {}/{} to status {} (reason: {})",
                        messageTemplateName,
                        messageTemplateLanguage,
                        status,
                        reason);
            } else {
                logger.warn(
                        "Received webhook with insufficient template identification information");
            }
        } catch (Exception e) {
            logger.error("Failed to update template status to {}: {}", status, e.getMessage());
        }
    }

    private TemplateStatus mapEventToStatus(String event) {
        return switch (event.toUpperCase()) {
            case "APPROVED" -> TemplateStatus.APPROVED;
            case "REJECTED" -> TemplateStatus.REJECTED;
            case "PENDING" -> TemplateStatus.PENDING;
            case "PAUSED" -> TemplateStatus.PAUSED;
            case "DISABLED" -> TemplateStatus.INACTIVE;
            default -> null;
        };
    }

    @GetMapping("/template-status")
    @Operation(
            summary = "Verify webhook endpoint",
            description = "Handles webhook verification challenge from Meta")
    public ResponseEntity<String> verifyWebhook(
            @Parameter(description = "Hub mode") @RequestParam("hub.mode") String mode,
            @Parameter(description = "Verify token") @RequestParam("hub.verify_token") String token,
            @Parameter(description = "Challenge string") @RequestParam("hub.challenge")
                    String challenge) {

        logger.info("Template status webhook verification request received");

        if ("subscribe".equals(mode) && verifyToken(token)) {
            logger.info("Template status webhook verified successfully");
            return ResponseEntity.ok(challenge);
        }

        logger.warn("Template status webhook verification failed");
        return ResponseEntity.status(403).body("Verification failed");
    }

    private boolean verifyToken(String token) {
        return "your_verify_token".equals(token);
    }
}
