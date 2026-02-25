package com.example.backend.controller;

import com.example.backend.service.ConversationStateManager;
import com.example.backend.util.TenantContext;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/whatsapp")
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    private final ConversationStateManager conversationStateManager;

    public WhatsAppWebhookController(ConversationStateManager conversationStateManager) {
        this.conversationStateManager = conversationStateManager;
    }

    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {
        
        log.info("WhatsApp webhook verification request received");

        if ("subscribe".equals(mode) && "your_verify_token".equals(token)) {
            log.info("Webhook verified successfully");
            return ResponseEntity.ok(challenge);
        }

        log.warn("Webhook verification failed");
        return ResponseEntity.status(403).body("Verification failed");
    }

    @PostMapping
    public ResponseEntity<Void> receiveWebhook(@RequestBody Map<String, Object> payload) {
        log.info("WhatsApp webhook received: {}", payload);

        try {
            processWebhookPayload(payload);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error processing WhatsApp webhook", e);
            return ResponseEntity.status(500).build();
        }
    }

    private void processWebhookPayload(Map<String, Object> payload) {
        if (payload.get("entry") instanceof java.util.List<?> entries) {
            for (Object entryObj : entries) {
                if (entryObj instanceof Map<?, ?> entry) {
                    processEntry((Map<String, Object>) entry);
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void processEntry(Map<String, Object> entry) {
        if (entry.get("changes") instanceof java.util.List<?> changes) {
            for (Object changeObj : changes) {
                if (changeObj instanceof Map<?, ?> change) {
                    Map<String, Object> value = (Map<String, Object>) ((Map<?, ?>) change).get("value");
                    if (value != null) {
                        processValue(value);
                    }
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void processValue(Map<String, Object> value) {
        if (value.get("messages") instanceof java.util.List<?> messages) {
            for (Object messageObj : messages) {
                if (messageObj instanceof Map<?, ?> message) {
                    processMessage((Map<String, Object>) message);
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void processMessage(Map<String, Object> message) {
        String from = (String) message.get("from");
        String messageId = (String) message.get("id");
        String type = (String) message.get("type");

        if ("text".equals(type) && message.get("text") instanceof Map<?, ?> textObj) {
            Map<String, Object> text = (Map<String, Object>) textObj;
            String body = (String) text.get("body");

            if (body != null && from != null) {
                String orgId = extractOrgIdFromContext();
                if (orgId != null) {
                    conversationStateManager.processInboundMessage(orgId, from, body, messageId);
                } else {
                    log.warn("Could not extract orgId from webhook, using default");
                    conversationStateManager.processInboundMessage("default", from, body, messageId);
                }
            }
        }
    }

    private String extractOrgIdFromContext() {
        try {
            return TenantContext.getOrgId();
        } catch (Exception e) {
            log.debug("Could not extract orgId from TenantContext", e);
            return null;
        }
    }
}
