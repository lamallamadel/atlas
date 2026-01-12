package com.example.backend.service;

import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class WhatsAppMessageProcessingService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppMessageProcessingService.class);

    private final MessageRepository messageRepository;
    private final DossierRepository dossierRepository;
    private final WhatsAppProviderConfigRepository configRepository;

    public WhatsAppMessageProcessingService(
            MessageRepository messageRepository,
            DossierRepository dossierRepository,
            WhatsAppProviderConfigRepository configRepository) {
        this.messageRepository = messageRepository;
        this.dossierRepository = dossierRepository;
        this.configRepository = configRepository;
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
                if (!"messages".equals(change.getField())) {
                    continue;
                }

                WhatsAppWebhookPayload.Value value = change.getValue();
                if (value == null || value.getMessages() == null) {
                    continue;
                }

                for (WhatsAppWebhookPayload.Message message : value.getMessages()) {
                    processMessage(message, value, orgId);
                }
            }
        }
    }

    private void processMessage(WhatsAppWebhookPayload.Message message, WhatsAppWebhookPayload.Value value, String orgId) {
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

        log.info("Processed WhatsApp message {} for dossier {} in org {}", providerMessageId, dossier.getId(), orgId);
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
            return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneId.systemDefault());
        } catch (NumberFormatException e) {
            log.warn("Failed to parse timestamp: {}, using current time", timestamp);
            return LocalDateTime.now();
        }
    }

    private Dossier findOrCreateDossier(String phoneNumber, String contactName, String orgId) {
        List<DossierStatus> excludedStatuses = List.of(DossierStatus.WON, DossierStatus.LOST);
        List<Dossier> existingDossiers = dossierRepository.findByLeadPhoneAndOrgIdAndStatusNotIn(phoneNumber, orgId, excludedStatuses);

        if (!existingDossiers.isEmpty()) {
            Dossier dossier = existingDossiers.get(0);
            
            if (contactName != null && (dossier.getLeadName() == null || dossier.getLeadName().isEmpty())) {
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

    public String getWebhookSecret(String orgId) {
        Optional<WhatsAppProviderConfig> config = configRepository.findByOrgId(orgId);
        return config.map(WhatsAppProviderConfig::getWebhookSecretEncrypted).orElse(null);
    }
}
