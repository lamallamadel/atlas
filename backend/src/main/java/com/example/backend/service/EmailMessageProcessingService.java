package com.example.backend.service;

import com.example.backend.dto.EmailWebhookPayload;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.PartiePrenanteRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailMessageProcessingService {

    private static final Logger log = LoggerFactory.getLogger(EmailMessageProcessingService.class);

    private final MessageRepository messageRepository;
    private final DossierRepository dossierRepository;
    private final PartiePrenanteRepository partiePrenanteRepository;
    private final EmailParserService emailParserService;
    private final AuditEventService auditEventService;
    private final ActivityService activityService;

    public EmailMessageProcessingService(
            MessageRepository messageRepository,
            DossierRepository dossierRepository,
            PartiePrenanteRepository partiePrenanteRepository,
            EmailParserService emailParserService,
            AuditEventService auditEventService,
            ActivityService activityService) {
        this.messageRepository = messageRepository;
        this.dossierRepository = dossierRepository;
        this.partiePrenanteRepository = partiePrenanteRepository;
        this.emailParserService = emailParserService;
        this.auditEventService = auditEventService;
        this.activityService = activityService;
    }

    @Transactional
    public void processInboundEmail(EmailWebhookPayload payload, String orgId) {
        EmailParserService.ParsedEmail parsedEmail = emailParserService.parseEmail(payload);

        String messageId = parsedEmail.getMessageId();
        if (messageId != null && messageRepository.existsByProviderMessageId(messageId)) {
            log.info("Email message already processed, skipping: {}", messageId);
            return;
        }

        String fromEmail = parsedEmail.getFromEmail();
        String toEmail = parsedEmail.getToEmail();
        String fromName = parsedEmail.getFromName();

        if (fromEmail == null || fromEmail.isEmpty()) {
            log.warn("No from email address found in webhook payload, skipping");
            return;
        }

        Dossier dossier = findOrCreateDossier(fromEmail, fromName, orgId);

        MessageEntity messageEntity = new MessageEntity();
        messageEntity.setOrgId(orgId);
        messageEntity.setDossier(dossier);
        messageEntity.setChannel(MessageChannel.EMAIL);
        messageEntity.setDirection(MessageDirection.INBOUND);
        messageEntity.setFromAddress(fromEmail);
        messageEntity.setToAddress(toEmail);
        messageEntity.setSubject(parsedEmail.getSubject());
        messageEntity.setContent(parsedEmail.getContentForStorage());
        messageEntity.setHtmlContent(parsedEmail.getHtmlContent());
        messageEntity.setTextContent(parsedEmail.getTextContent());
        messageEntity.setProviderMessageId(messageId);

        LocalDateTime timestamp;
        if (parsedEmail.getTimestamp() != null) {
            timestamp =
                    LocalDateTime.ofInstant(
                            Instant.ofEpochSecond(parsedEmail.getTimestamp()),
                            ZoneId.systemDefault());
        } else {
            timestamp = LocalDateTime.now();
        }
        messageEntity.setTimestamp(timestamp);

        if (parsedEmail.getAttachments() != null && !parsedEmail.getAttachments().isEmpty()) {
            Map<String, Object> attachmentsData = new HashMap<>();
            attachmentsData.put("attachments", parsedEmail.getAttachments());
            attachmentsData.put("count", parsedEmail.getAttachments().size());
            messageEntity.setAttachmentsJson(attachmentsData);
        }

        LocalDateTime now = LocalDateTime.now();
        messageEntity.setCreatedAt(now);
        messageEntity.setUpdatedAt(now);

        messageRepository.save(messageEntity);

        log.info(
                "Processed email message {} from {} for dossier {} in org {}",
                messageId,
                fromEmail,
                dossier.getId(),
                orgId);

        logEmailActivity(dossier, parsedEmail);
    }

    private Dossier findOrCreateDossier(String email, String name, String orgId) {
        List<DossierStatus> excludedStatuses = List.of(DossierStatus.WON, DossierStatus.LOST);

        Dossier dossier =
                dossierRepository
                        .findByLeadEmailAndOrgIdAndStatusNotIn(email, orgId, excludedStatuses)
                        .stream()
                        .findFirst()
                        .orElse(null);

        if (dossier == null) {
            List<PartiePrenanteEntity> parties =
                    partiePrenanteRepository.findByEmailAndOrgId(email, orgId);

            if (!parties.isEmpty()) {
                PartiePrenanteEntity party = parties.get(0);
                dossier = party.getDossier();

                if (!excludedStatuses.contains(dossier.getStatus())) {
                    if (dossier.getLeadEmail() == null || dossier.getLeadEmail().isEmpty()) {
                        dossier.setLeadEmail(email);
                        dossier.setUpdatedAt(LocalDateTime.now());
                        dossierRepository.save(dossier);
                    }
                    return dossier;
                }
            }
        }

        if (dossier == null) {
            dossier = new Dossier();
            dossier.setOrgId(orgId);
            dossier.setLeadEmail(email);
            dossier.setLeadName(name);
            dossier.setLeadSource("Email");
            dossier.setStatus(DossierStatus.NEW);

            LocalDateTime now = LocalDateTime.now();
            dossier.setCreatedAt(now);
            dossier.setUpdatedAt(now);

            dossier = dossierRepository.save(dossier);
            log.info(
                    "Created new dossier {} for email {} in org {}", dossier.getId(), email, orgId);
        } else {
            if (name != null
                    && (dossier.getLeadName() == null || dossier.getLeadName().isEmpty())) {
                dossier.setLeadName(name);
                dossier.setUpdatedAt(LocalDateTime.now());
                dossierRepository.save(dossier);
            }

            if (dossier.getLeadEmail() == null || dossier.getLeadEmail().isEmpty()) {
                dossier.setLeadEmail(email);
                dossier.setUpdatedAt(LocalDateTime.now());
                dossierRepository.save(dossier);
            }
        }

        return dossier;
    }

    private void logEmailActivity(Dossier dossier, EmailParserService.ParsedEmail email) {
        if (activityService != null && dossier != null) {
            try {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("fromEmail", email.getFromEmail());
                metadata.put("toEmail", email.getToEmail());
                metadata.put("subject", email.getSubject());
                metadata.put("channel", "EMAIL");
                metadata.put(
                        "hasAttachments",
                        email.getAttachments() != null && !email.getAttachments().isEmpty());

                activityService.logActivity(
                        dossier.getId(),
                        "EMAIL_RECEIVED",
                        String.format(
                                "Email received from %s: %s",
                                email.getFromEmail(),
                                email.getSubject() != null ? email.getSubject() : "(no subject)"),
                        metadata);
            } catch (Exception e) {
                log.warn("Failed to log activity for email", e);
            }
        }
    }
}
