package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.example.backend.service.OutboundJobWorker;
import com.example.backend.service.OutboundMessageProvider;
import com.example.backend.service.OutboundMessageService;
import com.example.backend.service.ProviderSendResult;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

@BackendE2ETest
class WhatsAppOutboundFlowBackendE2ETest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-whatsapp-test-1";
    private static final String TEST_PHONE = "+33612345678";
    private static final String WEBHOOK_ENDPOINT = "/api/v1/webhooks/whatsapp/inbound";

    @Autowired private OutboundMessageRepository outboundMessageRepository;

    @Autowired private OutboundAttemptRepository outboundAttemptRepository;

    @Autowired private ConsentementRepository consentementRepository;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private AuditEventRepository auditEventRepository;

    @Autowired private OutboundMessageService outboundMessageService;

    @Autowired private OutboundJobWorker outboundJobWorker;

    @Autowired private ObjectMapper objectMapper;

    @MockBean(name = "whatsAppCloudApiProvider")
    private OutboundMessageProvider mockWhatsAppProvider;

    @BeforeEach
    void setUp() {
        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        consentementRepository.deleteAll();
        auditEventRepository.deleteAll();
        dossierRepository.deleteAll();

        when(mockWhatsAppProvider.supports("WHATSAPP")).thenReturn(true);
        when(mockWhatsAppProvider.supports(argThat(channel -> !"WHATSAPP".equals(channel))))
                .thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void consentBlocking_WithoutConsent_PreventsQueuedCreation() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);

        try {
            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    MessageChannel.WHATSAPP,
                    TEST_PHONE,
                    "welcome_template",
                    null,
                    Map.of("language", "en"),
                    "idempotency-key-1");
            throw new AssertionError("Expected exception was not thrown");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            assertThat(e.getStatusCode().value()).isEqualTo(422);
            assertThat(e.getReason()).contains("Consent required");
            assertThat(e.getReason()).contains("No consent found for channel WHATSAPP");
        }

        assertThat(outboundMessageRepository.findAll()).isEmpty();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        AuditEventEntity blockedEvent =
                auditEvents.stream()
                        .filter(a -> a.getAction() == AuditAction.BLOCKED_BY_POLICY)
                        .findFirst()
                        .orElse(null);

        assertThat(blockedEvent).isNotNull();
        assertThat(blockedEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(blockedEvent.getEntityId()).isEqualTo(dossier.getId());
        assertThat(blockedEvent.getDiff().get("details")).toString().contains("no consent");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void consentBlocking_WithDeniedConsent_PreventsQueuedCreation() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.DENIED);

        try {
            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    MessageChannel.WHATSAPP,
                    TEST_PHONE,
                    "welcome_template",
                    null,
                    Map.of("language", "en"),
                    "idempotency-key-2");
            throw new AssertionError("Expected exception was not thrown");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            assertThat(e.getStatusCode().value()).isEqualTo(422);
            assertThat(e.getReason()).contains("Consent required");
            assertThat(e.getReason()).contains("DENIED");
        }

        assertThat(outboundMessageRepository.findAll()).isEmpty();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        AuditEventEntity blockedEvent =
                auditEvents.stream()
                        .filter(a -> a.getAction() == AuditAction.BLOCKED_BY_POLICY)
                        .findFirst()
                        .orElse(null);

        assertThat(blockedEvent).isNotNull();
        assertThat(blockedEvent.getDiff().get("details")).toString().contains("DENIED");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void consentBlocking_WithRevokedConsent_PreventsQueuedCreation() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.REVOKED);

        try {
            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    MessageChannel.WHATSAPP,
                    TEST_PHONE,
                    "welcome_template",
                    null,
                    Map.of("language", "en"),
                    "idempotency-key-3");
            throw new AssertionError("Expected exception was not thrown");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            assertThat(e.getStatusCode().value()).isEqualTo(422);
            assertThat(e.getReason()).contains("REVOKED");
        }

        assertThat(outboundMessageRepository.findAll()).isEmpty();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void successfulMessageProgression_QueuedToSendingToSent() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.test-provider-123", Map.of("status", "success")));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-success");

        assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(message.getAttemptCount()).isEqualTo(0);

        List<AuditEventEntity> creationAudits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
                        .filter(a -> a.getAction() == AuditAction.CREATED)
                        .toList();
        assertThat(creationAudits).hasSize(1);

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updatedMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(updatedMessage.getProviderMessageId()).isEqualTo("wamid.test-provider-123");
        assertThat(updatedMessage.getAttemptCount()).isEqualTo(1);
        assertThat(updatedMessage.getErrorCode()).isNull();
        assertThat(updatedMessage.getErrorMessage()).isNull();

        List<OutboundAttemptEntity> attempts =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getAttemptNo()).isEqualTo(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);
        assertThat(attempts.get(0).getProviderResponseJson()).containsEntry("status", "success");

        List<AuditEventEntity> sentAudits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
                        .filter(a -> a.getAction() == AuditAction.SENT)
                        .toList();
        assertThat(sentAudits).hasSize(1);
        assertThat(sentAudits.get(0).getEntityId()).isEqualTo(message.getId());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void retryLogic_WithExponentialBackoff_RetriesUntilSuccess() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.failure(
                                "NETWORK_ERROR", "Connection timeout", true, null))
                .thenReturn(
                        ProviderSendResult.failure("RATE_LIMIT", "Rate limit exceeded", true, null))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.retry-success-123", Map.of("status", "success")));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-retry");

        assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(message.getAttemptCount()).isEqualTo(0);

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity afterAttempt1 =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterAttempt1.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(afterAttempt1.getAttemptCount()).isEqualTo(1);
        assertThat(afterAttempt1.getErrorCode()).isEqualTo("NETWORK_ERROR");
        assertThat(afterAttempt1.getErrorMessage()).isEqualTo("Connection timeout");

        List<OutboundAttemptEntity> attempts1 =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts1).hasSize(1);
        assertThat(attempts1.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts1.get(0).getNextRetryAt()).isNotNull();
        LocalDateTime firstRetryTime = attempts1.get(0).getNextRetryAt();

        outboundJobWorker.processMessage(afterAttempt1);

        OutboundMessageEntity afterAttempt2 =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterAttempt2.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(afterAttempt2.getAttemptCount()).isEqualTo(2);
        assertThat(afterAttempt2.getErrorCode()).isEqualTo("RATE_LIMIT");

        List<OutboundAttemptEntity> attempts2 =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts2).hasSize(2);
        assertThat(attempts2.get(1).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts2.get(1).getNextRetryAt()).isNotNull();
        LocalDateTime secondRetryTime = attempts2.get(1).getNextRetryAt();

        assertThat(secondRetryTime).isAfter(firstRetryTime);

        outboundJobWorker.processMessage(afterAttempt2);

        OutboundMessageEntity afterAttempt3 =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterAttempt3.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(afterAttempt3.getAttemptCount()).isEqualTo(3);
        assertThat(afterAttempt3.getProviderMessageId()).isEqualTo("wamid.retry-success-123");
        assertThat(afterAttempt3.getErrorCode()).isNull();
        assertThat(afterAttempt3.getErrorMessage()).isNull();

        List<OutboundAttemptEntity> attempts3 =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts3).hasSize(3);
        assertThat(attempts3.get(2).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void retryLogic_NonRetryableError_FailsImmediately() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.failure(
                                "INVALID_PHONE", "Invalid phone number format", false, null));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-nonretryable");

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity failedMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(failedMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(failedMessage.getAttemptCount()).isEqualTo(1);
        assertThat(failedMessage.getErrorCode()).isEqualTo("INVALID_PHONE");
        assertThat(failedMessage.getErrorMessage()).isEqualTo("Invalid phone number format");

        List<OutboundAttemptEntity> attempts =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(0).getNextRetryAt()).isNull();

        List<AuditEventEntity> failedAudits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
                        .filter(a -> a.getAction() == AuditAction.FAILED)
                        .toList();
        assertThat(failedAudits).hasSize(1);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void retryLogic_MaxAttemptsReached_FailsPermanently() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.failure(
                                "NETWORK_ERROR", "Connection timeout", true, null));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-maxattempts");

        message.setMaxAttempts(3);
        outboundMessageRepository.save(message);

        for (int i = 0; i < 3; i++) {
            OutboundMessageEntity currentMessage =
                    outboundMessageRepository.findById(message.getId()).orElseThrow();
            outboundJobWorker.processMessage(currentMessage);
        }

        OutboundMessageEntity finalMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(finalMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(finalMessage.getAttemptCount()).isEqualTo(3);
        assertThat(finalMessage.getErrorCode()).isEqualTo("NETWORK_ERROR");

        List<OutboundAttemptEntity> attempts =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts).hasSize(3);
        assertThat(attempts.stream().allMatch(a -> a.getStatus() == OutboundAttemptStatus.FAILED))
                .isTrue();
    }

    @Test
    void webhookCallback_SentStatus_UpdatesMessageCorrectly() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-webhook");

        message.setStatus(OutboundMessageStatus.SENDING);
        message.setProviderMessageId("wamid.webhook-test-123");
        outboundMessageRepository.save(message);

        String webhookPayload = createDeliveryStatusWebhook("wamid.webhook-test-123", "sent");

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(webhookPayload))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        OutboundMessageEntity updatedMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);

        List<AuditEventEntity> webhookAudits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
                        .filter(a -> a.getAction() == AuditAction.UPDATED)
                        .toList();
        assertThat(webhookAudits).hasSizeGreaterThanOrEqualTo(1);
    }

    @Test
    void webhookCallback_DeliveredStatus_UpdatesMessageCorrectly() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-delivered");

        message.setStatus(OutboundMessageStatus.SENT);
        message.setProviderMessageId("wamid.delivered-test-123");
        outboundMessageRepository.save(message);

        String webhookPayload =
                createDeliveryStatusWebhook("wamid.delivered-test-123", "delivered");

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(webhookPayload))
                .andExpect(status().isOk());

        OutboundMessageEntity updatedMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);
    }

    @Test
    void webhookCallback_FailedStatus_UpdatesMessageWithError() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-webhook-failed");

        message.setStatus(OutboundMessageStatus.SENDING);
        message.setProviderMessageId("wamid.failed-test-123");
        outboundMessageRepository.save(message);

        String webhookPayload =
                createDeliveryStatusWebhookWithError(
                        "wamid.failed-test-123", "failed", 131047, "Invalid parameter");

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(webhookPayload))
                .andExpect(status().isOk());

        OutboundMessageEntity updatedMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updatedMessage.getErrorCode()).isEqualTo("131047");
        assertThat(updatedMessage.getErrorMessage()).isEqualTo("Invalid parameter");
    }

    @Test
    void webhookCallback_ReadStatus_UpdatesToDelivered() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-read");

        message.setStatus(OutboundMessageStatus.SENT);
        message.setProviderMessageId("wamid.read-test-123");
        outboundMessageRepository.save(message);

        String webhookPayload = createDeliveryStatusWebhook("wamid.read-test-123", "read");

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(webhookPayload))
                .andExpect(status().isOk());

        OutboundMessageEntity updatedMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void auditEvents_CaptureAllStateTransitions() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.failure(
                                "NETWORK_ERROR", "Connection timeout", true, null))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.audit-test-123", Map.of("status", "success")));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-audit");

        long initialAuditCount = auditEventRepository.count();

        outboundJobWorker.processMessage(message);

        outboundJobWorker.processMessage(
                outboundMessageRepository.findById(message.getId()).orElseThrow());

        List<AuditEventEntity> allAudits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
                        .filter(a -> a.getEntityId().equals(message.getId()))
                        .toList();

        assertThat(allAudits.size()).isGreaterThan(0);

        boolean hasCreatedEvent =
                allAudits.stream().anyMatch(a -> a.getAction() == AuditAction.CREATED);
        assertThat(hasCreatedEvent).isTrue();

        boolean hasSentEvent = allAudits.stream().anyMatch(a -> a.getAction() == AuditAction.SENT);
        assertThat(hasSentEvent).isTrue();

        allAudits.forEach(
                audit -> {
                    assertThat(audit.getOrgId()).isEqualTo(TENANT_1);
                    assertThat(audit.getEntityType()).isEqualTo(AuditEntityType.OUTBOUND_MESSAGE);
                    assertThat(audit.getEntityId()).isEqualTo(message.getId());
                    assertThat(audit.getDiff()).isNotNull();
                });
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void fullFlow_EndToEnd_WithAllTransitions() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.fullflow-test-123", Map.of("status", "success")));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-key-fullflow");

        assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(message.getAttemptCount()).isEqualTo(0);

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity sentMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(sentMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(sentMessage.getProviderMessageId()).isEqualTo("wamid.fullflow-test-123");

        List<OutboundAttemptEntity> attempts =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);

        List<AuditEventEntity> audits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
                        .filter(a -> a.getEntityId().equals(message.getId()))
                        .toList();

        assertThat(audits.size()).isGreaterThanOrEqualTo(2);

        boolean hasCreated = audits.stream().anyMatch(a -> a.getAction() == AuditAction.CREATED);
        boolean hasSent = audits.stream().anyMatch(a -> a.getAction() == AuditAction.SENT);

        assertThat(hasCreated).isTrue();
        assertThat(hasSent).isTrue();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void idempotency_DuplicateRequest_ReturnsSameMessage() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        String idempotencyKey = "idempotency-key-duplicate";

        OutboundMessageEntity message1 =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        idempotencyKey);

        OutboundMessageEntity message2 =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        idempotencyKey);

        assertThat(message1.getId()).isEqualTo(message2.getId());
        assertThat(outboundMessageRepository.count()).isEqualTo(1);
    }

    private Dossier createDossier(String orgId) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone(TEST_PHONE);
        dossier.setLeadName("Test Lead");
        dossier.setStatus(DossierStatus.NEW);
        LocalDateTime now = LocalDateTime.now();
        dossier.setCreatedAt(now);
        dossier.setUpdatedAt(now);
        return dossierRepository.save(dossier);
    }

    private ConsentementEntity createConsent(
            Dossier dossier, ConsentementChannel channel, ConsentementStatus status) {
        ConsentementEntity consent = new ConsentementEntity();
        consent.setOrgId(dossier.getOrgId());
        consent.setDossier(dossier);
        consent.setChannel(channel);
        consent.setConsentType(ConsentementType.MARKETING);
        consent.setStatus(status);
        LocalDateTime now = LocalDateTime.now();
        consent.setCreatedAt(now);
        consent.setUpdatedAt(now);
        return consentementRepository.save(consent);
    }

    private String createDeliveryStatusWebhook(String messageId, String status) {
        return String.format(
                """
            {
              "object": "whatsapp_business_account",
              "entry": [{
                "id": "123456789",
                "changes": [{
                  "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {
                      "display_phone_number": "+1234567890",
                      "phone_number_id": "123456789"
                    },
                    "statuses": [{
                      "id": "%s",
                      "status": "%s",
                      "timestamp": "1234567890",
                      "recipient_id": "%s"
                    }]
                  },
                  "field": "messages"
                }]
              }]
            }
            """,
                messageId, status, TEST_PHONE);
    }

    private String createDeliveryStatusWebhookWithError(
            String messageId, String status, int errorCode, String errorMessage) {
        return String.format(
                """
            {
              "object": "whatsapp_business_account",
              "entry": [{
                "id": "123456789",
                "changes": [{
                  "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {
                      "display_phone_number": "+1234567890",
                      "phone_number_id": "123456789"
                    },
                    "statuses": [{
                      "id": "%s",
                      "status": "%s",
                      "timestamp": "1234567890",
                      "recipient_id": "%s",
                      "errors": [{
                        "code": %d,
                        "title": "Error",
                        "message": "%s"
                      }]
                    }]
                  },
                  "field": "messages"
                }]
              }]
            }
            """,
                messageId, status, TEST_PHONE, errorCode, errorMessage);
    }
}
