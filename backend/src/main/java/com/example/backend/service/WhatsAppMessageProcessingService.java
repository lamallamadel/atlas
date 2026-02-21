package com.example.backend.service;

import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppMessageProcessingService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppMessageProcessingService.class);

    private final MessageRepository messageRepository;
    private final DossierRepository dossierRepository;
    private final WhatsAppProviderConfigRepository configRepository;
    private final OutboundMessageRepository outboundMessageRepository;
    private final WhatsAppSessionWindowService sessionWindowService;
    private final AuditEventService auditEventService;
    private final ActivityService activityService;

    public WhatsAppMessageProcessingService(
            MessageRepository messageRepository,
            DossierRepository dossierRepository,
            WhatsAppProviderConfigRepository configRepository,
            OutboundMessageRepository outboundMessageRepository,
            WhatsAppSessionWindowService sessionWindowService,
            AuditEventService auditEventService,
            ActivityService activityService) {
        this.messageRepository = messageRepository;
        this.dossierRepository = dossierRepository;
        this.configRepository = configRepository;
        this.outboundMessageRepository = outboundMessageRepository;
        this.sessionWindowService = sessionWindowService;
        this.auditEventService = auditEventService;
        this.activityService = activityService;
    }

    @Transactional
    public void processInboundMessage(WhatsAppWebhookPayload payload, String orgId) {
        if (payload.getEntry() == null || payload.getEntry().isEmpty()) {
            log.warn("No entries in webhook payload for orgId: {}", orgId);
            return;
        }

        for (WhatsAppWebhookPayload.Entry entry : payload.getEntry()) {
            if (entry.getChanges() == null) {
                continue;
            }

            for (WhatsAppWebhookPayload.Change change : entry.getChanges()) {
                WhatsAppWebhookPayload.Value value = change.getValue();
                if (value == null) {
                    continue;
                }

                if ("messages".equals(change.getField()) && value.getMessages() != null) {
                    for (WhatsAppWebhookPayload.Message message : value.getMessages()) {
                        processMessage(message, value, orgId);
                    }
                }

                if ("messages".equals(change.getField()) && value.getStatuses() != null) {
                    for (WhatsAppWebhookPayload.Status status : value.getStatuses()) {
                        processDeliveryStatus(status, orgId);
                    }
                }
            }
        }
    }

    private void processMessage(
            WhatsAppWebhookPayload.Message message,
            WhatsAppWebhookPayload.Value value,
            String orgId) {
        String providerMessageId = message.getId();

        if (messageRepository.existsByProviderMessageId(providerMessageId)) {
            log.info("Message already processed, skipping: {}", providerMessageId);
            return;
        }

        String phoneNumber = message.getFrom();
        String messageContent = extractMessageContent(message);
        LocalDateTime timestamp = parseTimestamp(message.getTimestamp());

        String contactName = extractContactName(value);

        Dossier dossier = findOrCreateDossier(phoneNumber, contactName, orgId);

        MessageEntity messageEntity = new MessageEntity();
        messageEntity.setOrgId(orgId);
        messageEntity.setDossier(dossier);
        messageEntity.setChannel(MessageChannel.WHATSAPP);
        messageEntity.setDirection(MessageDirection.INBOUND);
        messageEntity.setContent(messageContent);
        messageEntity.setTimestamp(timestamp);
        messageEntity.setProviderMessageId(providerMessageId);

        LocalDateTime now = LocalDateTime.now();
        messageEntity.setCreatedAt(now);
        messageEntity.setUpdatedAt(now);

        messageRepository.save(messageEntity);

        sessionWindowService.updateSessionWindow(orgId, phoneNumber, timestamp);

        log.info(
                "Processed WhatsApp message {} for dossier {} in org {}",
                providerMessageId,
                dossier.getId(),
                orgId);
    }

    private String extractMessageContent(WhatsAppWebhookPayload.Message message) {
        if ("text".equals(message.getType()) && message.getText() != null) {
            return message.getText().getBody();
        }
        return "[" + message.getType() + " message]";
    }

    private String extractContactName(WhatsAppWebhookPayload.Value value) {
        if (value.getContacts() != null && !value.getContacts().isEmpty()) {
            WhatsAppWebhookPayload.Contact contact = value.getContacts().get(0);
            if (contact.getProfile() != null && contact.getProfile().getName() != null) {
                return contact.getProfile().getName();
            }
        }
        return null;
    }

    private LocalDateTime parseTimestamp(String timestamp) {
        try {
            long epochSeconds = Long.parseLong(timestamp);
            return LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(epochSeconds), ZoneId.systemDefault());
        } catch (NumberFormatException e) {
            log.warn("Failed to parse timestamp: {}, using current time", timestamp);
            return LocalDateTime.now();
        }
    }

    private Dossier findOrCreateDossier(String phoneNumber, String contactName, String orgId) {
        List<DossierStatus> excludedStatuses = List.of(DossierStatus.WON, DossierStatus.LOST);
        List<Dossier> existingDossiers = dossierRepository.findByLeadPhoneAndOrgIdAndStatusNotIn(
                phoneNumber, orgId, excludedStatuses);

        if (!existingDossiers.isEmpty()) {
            Dossier dossier = existingDossiers.get(0);

            if (contactName != null
                    && (dossier.getLeadName() == null || dossier.getLeadName().isEmpty())) {
                dossier.setLeadName(contactName);
                dossier.setUpdatedAt(LocalDateTime.now());
                dossierRepository.save(dossier);
            }

            return dossier;
        }

        Dossier newDossier = new Dossier();
        newDossier.setOrgId(orgId);
        newDossier.setLeadPhone(phoneNumber);
        newDossier.setLeadName(contactName);
        newDossier.setLeadSource("WhatsApp");
        newDossier.setStatus(DossierStatus.NEW);

        LocalDateTime now = LocalDateTime.now();
        newDossier.setCreatedAt(now);
        newDossier.setUpdatedAt(now);

        return dossierRepository.save(newDossier);
    }

    private void processDeliveryStatus(WhatsAppWebhookPayload.Status status, String orgId) {
        String providerMessageId = status.getId();
        String deliveryStatus = status.getStatus();
        String timestamp = status.getTimestamp();

        log.info("Processing delivery status for message {}: status={}, timestamp={}, orgId={}",
                providerMessageId, deliveryStatus, timestamp, orgId);

        log.info(
                "Processing delivery status for message {}: status={}, orgId={}",
                providerMessageId,
                deliveryStatus,
                orgId);

        Optional<OutboundMessageEntity> messageOpt = outboundMessageRepository
                .findByProviderMessageId(providerMessageId);

        if (messageOpt.isEmpty()) {
            log.warn("Outbound message not found for provider message ID: {}", providerMessageId);
            return;
        }

        OutboundMessageEntity message = messageOpt.get();

        if (!orgId.equals(message.getOrgId())) {
            log.warn(
                    "Organization mismatch for message {}: expected {}, got {}",
                    providerMessageId,
                    message.getOrgId(),
                    orgId);
            return;
        }

        OutboundMessageStatus newStatus = mapWhatsAppStatusToOutboundStatus(deliveryStatus);
        if (newStatus == null) {
            log.debug("Ignoring intermediate status: {}", deliveryStatus);
            return;
        }

        OutboundMessageStatus currentStatus = message.getStatus();
        if (shouldUpdateStatus(currentStatus, newStatus)) {
            LocalDateTime now = LocalDateTime.now();
            message.setStatus(newStatus);
            message.setUpdatedAt(now);

            if (newStatus == OutboundMessageStatus.FAILED
                    && status.getErrors() != null
                    && !status.getErrors().isEmpty()) {
                WhatsAppWebhookPayload.StatusError error = status.getErrors().get(0);
                String errorCode = String.valueOf(error.getCode());
                String errorMessage = error.getMessage();

                message.setErrorCode(errorCode);
                message.setErrorMessage(errorMessage != null ? errorMessage : error.getTitle());

                log.warn("Message {} failed with error code {}: {}",
                        message.getId(), errorCode, message.getErrorMessage());
            } else if (newStatus == OutboundMessageStatus.DELIVERED) {
                message.setErrorCode(null);
                message.setErrorMessage(null);
            }

            outboundMessageRepository.save(message);

            log.info("Updated outbound message {} status from {} to {} (webhook timestamp: {})",
                    message.getId(), currentStatus, newStatus, timestamp);

            log.info(
                    "Updated outbound message {} status from {} to {}",
                    message.getId(),
                    currentStatus,
                    newStatus);

            logDeliveryStatusAudit(message, deliveryStatus, status);
            logDeliveryStatusActivity(message, deliveryStatus, status);
        }
    }

    private OutboundMessageStatus mapWhatsAppStatusToOutboundStatus(String whatsappStatus) {
        return switch (whatsappStatus.toLowerCase()) {
            case "sent" -> OutboundMessageStatus.SENT;
            case "delivered" -> OutboundMessageStatus.DELIVERED;
            case "read" -> OutboundMessageStatus.DELIVERED;
            case "failed" -> OutboundMessageStatus.FAILED;
            default -> null;
        };
    }

    private boolean shouldUpdateStatus(
            OutboundMessageStatus current, OutboundMessageStatus newStatus) {
        if (current == OutboundMessageStatus.FAILED || current == OutboundMessageStatus.CANCELLED) {
            return false;
        }

        if (current == OutboundMessageStatus.DELIVERED) {
            return false;
        }

        if (current == OutboundMessageStatus.SENT && newStatus == OutboundMessageStatus.SENT) {
            return false;
        }

        return true;
    }

    private void logDeliveryStatusAudit(OutboundMessageEntity message, String deliveryStatus,
            WhatsAppWebhookPayload.Status status) {
        if (auditEventService != null) {
            try {
                String details = String.format("Delivery status updated to: %s (timestamp: %s)",
                        deliveryStatus, status.getTimestamp());

                if (status.getErrors() != null && !status.getErrors().isEmpty()) {
                    WhatsAppWebhookPayload.StatusError error = status.getErrors().get(0);
                    details += String.format(" - Error: [%d] %s", error.getCode(), error.getMessage());
                }

                auditEventService.logEvent(
                        "OUTBOUND_MESSAGE",
                        message.getId(),
                        "DELIVERY_STATUS_UPDATED",
                        details);

            } catch (Exception e) {
                log.warn("Failed to log audit event for delivery status update", e);
            }
        }
    }

    private void logDeliveryStatusActivity(OutboundMessageEntity message, String deliveryStatus,
            WhatsAppWebhookPayload.Status status) {
        if (activityService != null && message.getDossierId() != null) {
            try {
                java.util.Map<String, Object> metadata = new java.util.HashMap<>();
                metadata.put("outboundMessageId", message.getId());
                metadata.put("providerMessageId",
                        message.getProviderMessageId() != null ? message.getProviderMessageId() : "");
                metadata.put("status", deliveryStatus);
                metadata.put("channel", "WHATSAPP");
                metadata.put("timestamp", status.getTimestamp());

                if (status.getRecipientId() != null) {
                    metadata.put("recipientId", status.getRecipientId());
                }

                if (status.getConversation() != null) {
                    metadata.put("conversationId", status.getConversation().getId());
                    if (status.getConversation().getOrigin() != null) {
                        metadata.put("conversationOrigin", status.getConversation().getOrigin().getType());
                    }
                }

                if (status.getErrors() != null && !status.getErrors().isEmpty()) {
                    WhatsAppWebhookPayload.StatusError error = status.getErrors().get(0);
                    metadata.put("errorCode", error.getCode());
                    metadata.put("errorMessage", error.getMessage());
                    metadata.put("errorTitle", error.getTitle());
                }

                activityService.logActivity(
                        message.getDossierId(),
                        "MESSAGE_STATUS_UPDATE",
                        String.format("WhatsApp message delivery status: %s", deliveryStatus),
                        metadata);

            } catch (Exception e) {
                log.warn("Failed to log activity for delivery status update", e);
            }
        }
    }

    public String getWebhookSecret(String orgId) {
        Optional<WhatsAppProviderConfig> config = configRepository.findByOrgId(orgId);
        return config.map(WhatsAppProviderConfig::getWebhookSecretEncrypted).orElse(null);
    }
}
