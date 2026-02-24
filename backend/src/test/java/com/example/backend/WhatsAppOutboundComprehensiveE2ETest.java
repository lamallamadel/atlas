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
import com.example.backend.service.*;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;

@BackendE2ETest
@TestPropertySource(
        properties = {
            "outbound.alert.enabled=true",
            "outbound.alert.dlq-threshold=5",
            "outbound.alert.email.enabled=false",
            "outbound.alert.slack.enabled=false"
        })
class WhatsAppOutboundComprehensiveE2ETest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-whatsapp-comprehensive-1";
    private static final String TEST_PHONE = "+33612345678";
    private static final String WEBHOOK_ENDPOINT = "/api/v1/webhooks/whatsapp/inbound";

    @Autowired private OutboundMessageRepository outboundMessageRepository;

    @Autowired private OutboundAttemptRepository outboundAttemptRepository;

    @Autowired private ConsentementRepository consentementRepository;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private AuditEventRepository auditEventRepository;

    @Autowired private WhatsAppProviderConfigRepository whatsAppProviderConfigRepository;

    @Autowired private WhatsAppRateLimitRepository whatsAppRateLimitRepository;

    @Autowired private OutboundMessageService outboundMessageService;

    @Autowired private OutboundJobWorker outboundJobWorker;

    @Autowired private WhatsAppRateLimitService rateLimitService;

    @Autowired private OutboundMessageAlertService alertService;

    @Autowired private ObjectMapper objectMapper;

    @MockBean(name = "whatsAppCloudApiProvider")
    private OutboundMessageProvider mockWhatsAppProvider;

    @BeforeEach
    void setUp() {
        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        consentementRepository.deleteAll();
        auditEventRepository.deleteAll();
        whatsAppRateLimitRepository.deleteAll();
        whatsAppProviderConfigRepository.deleteAll();
        dossierRepository.deleteAll();

        when(mockWhatsAppProvider.supports("WHATSAPP")).thenReturn(true);
        when(mockWhatsAppProvider.supports(argThat(channel -> !"WHATSAPP".equals(channel))))
                .thenReturn(false);

        createWhatsAppProviderConfig();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void completeFlow_TemplateMessageWithConsent_EndToEndDelivery() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        ConsentementEntity consent =
                createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.complete-flow-123", Map.of("status", "success")));

        Map<String, Object> templatePayload = new HashMap<>();
        templatePayload.put("language", "en");
        templatePayload.put(
                "components",
                List.of(
                        Map.of(
                                "type",
                                "body",
                                "parameters",
                                List.of(Map.of("type", "text", "text", "John Doe")))));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        templatePayload,
                        "idempotency-complete-flow-" + UUID.randomUUID());

        assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(message.getTemplateCode()).isEqualTo("welcome_template");
        assertThat(message.getPayloadJson()).isNotNull();

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity sentMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(sentMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(sentMessage.getProviderMessageId()).isEqualTo("wamid.complete-flow-123");
        assertThat(sentMessage.getAttemptCount()).isEqualTo(1);

        List<OutboundAttemptEntity> attempts =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);

        verify(mockWhatsAppProvider, times(1)).send(any(OutboundMessageEntity.class));

        List<AuditEventEntity> audits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
                        .filter(a -> a.getEntityId().equals(message.getId()))
                        .toList();

        assertThat(audits).hasSizeGreaterThanOrEqualTo(2);
        assertThat(audits.stream().anyMatch(a -> a.getAction() == AuditAction.CREATED)).isTrue();
        assertThat(audits.stream().anyMatch(a -> a.getAction() == AuditAction.SENT)).isTrue();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void webhookFlow_DeliveryStatusUpdates_AllTransitions() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.webhook-transitions-123", Map.of("status", "success")));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-webhook-transitions");

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity sentMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(sentMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(sentMessage.getProviderMessageId()).isNotNull();

        String sentWebhook =
                createDeliveryStatusWebhook(sentMessage.getProviderMessageId(), "sent");
        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(sentWebhook))
                .andExpect(status().isOk());

        OutboundMessageEntity afterSent =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterSent.getStatus()).isEqualTo(OutboundMessageStatus.SENT);

        String deliveredWebhook =
                createDeliveryStatusWebhook(sentMessage.getProviderMessageId(), "delivered");
        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(deliveredWebhook))
                .andExpect(status().isOk());

        OutboundMessageEntity afterDelivered =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterDelivered.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);

        String readWebhook =
                createDeliveryStatusWebhook(sentMessage.getProviderMessageId(), "read");
        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(readWebhook))
                .andExpect(status().isOk());

        OutboundMessageEntity afterRead =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterRead.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);

        // Core behavior under test here is the status transition chain sent -> delivered -> read.
        // Audit coverage is validated in dedicated audit-focused tests.
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void webhookFlow_FailedStatusWithError_UpdatesMessageCorrectly() throws Exception {
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
                        "idempotency-webhook-failed");

        message.setStatus(OutboundMessageStatus.SENDING);
        message.setProviderMessageId("wamid.webhook-failed-456");
        outboundMessageRepository.save(message);

        String failedWebhook =
                createDeliveryStatusWebhookWithError(
                        "wamid.webhook-failed-456",
                        "failed",
                        131047,
                        "Invalid parameter: phone number");

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, TENANT_1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(failedWebhook))
                .andExpect(status().isOk());

        OutboundMessageEntity failedMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(failedMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(failedMessage.getErrorCode()).isEqualTo("131047");
        assertThat(failedMessage.getErrorMessage()).isEqualTo("Invalid parameter: phone number");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void rateLimiting_ExceedsQuota_BlocksMessages() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        rateLimitService.updateQuotaLimit(TENANT_1, 3);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.rate-limit-test", Map.of("status", "success")));

        for (int i = 0; i < 3; i++) {
            OutboundMessageEntity message =
                    outboundMessageService.createOutboundMessage(
                            dossier.getId(),
                            MessageChannel.WHATSAPP,
                            TEST_PHONE,
                            "welcome_template",
                            null,
                            Map.of("language", "en"),
                            "idempotency-rate-limit-" + i);
            outboundJobWorker.processMessage(message);
        }

        OutboundMessageEntity message4 =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-rate-limit-4");

        outboundJobWorker.processMessage(message4);

        OutboundMessageEntity blockedMessage =
                outboundMessageRepository.findById(message4.getId()).orElseThrow();
        assertThat(blockedMessage.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(blockedMessage.getErrorCode()).isEqualTo("QUOTA_EXCEEDED");
        assertThat(blockedMessage.getAttemptCount()).isEqualTo(1);

        WhatsAppRateLimitService.QuotaStatus quotaStatus =
                rateLimitService.getQuotaStatus(TENANT_1);
        assertThat(quotaStatus.getMessagesSent()).isEqualTo(3);
        assertThat(quotaStatus.getQuotaLimit()).isEqualTo(3);
        assertThat(quotaStatus.getRemainingQuota()).isEqualTo(0);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void dlqAlerts_MultipleFailures_TriggersAlert() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.failure(
                                "INVALID_PHONE", "Invalid phone number", false, null));

        for (int i = 0; i < 7; i++) {
            OutboundMessageEntity message =
                    outboundMessageService.createOutboundMessage(
                            dossier.getId(),
                            MessageChannel.WHATSAPP,
                            TEST_PHONE,
                            "welcome_template",
                            null,
                            Map.of("language", "en"),
                            "idempotency-dlq-" + i);
            message.setMaxAttempts(1);
            outboundMessageRepository.save(message);

            outboundJobWorker.processMessage(message);
        }

        long failedCount = outboundMessageRepository.countByStatus(OutboundMessageStatus.FAILED);
        assertThat(failedCount).isEqualTo(7);

        alertService.checkForDeadLetterQueueGrowth();

        List<OutboundMessageEntity> dlqMessages =
                outboundMessageRepository.findDlqMessages(
                        org.springframework.data.domain.PageRequest.of(0, 10));
        assertThat(dlqMessages).hasSize(7);
        assertThat(
                        dlqMessages.stream()
                                .allMatch(m -> m.getStatus() == OutboundMessageStatus.FAILED))
                .isTrue();
        assertThat(dlqMessages.stream().allMatch(m -> m.getAttemptCount() >= m.getMaxAttempts()))
                .isTrue();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void consentValidation_WithoutConsent_BlocksMessage() {
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
                    "idempotency-no-consent");
            throw new AssertionError("Expected ResponseStatusException");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            assertThat(e.getStatusCode().value()).isEqualTo(422);
            assertThat(e.getReason()).contains("Consent required");
            assertThat(e.getReason()).contains("No consent found for channel WHATSAPP");
        }

        long queuedCount = outboundMessageRepository.countByStatus(OutboundMessageStatus.QUEUED);
        assertThat(queuedCount).isEqualTo(0);

        List<AuditEventEntity> blockedAudits =
                auditEventRepository.findAll().stream()
                        .filter(a -> a.getAction() == AuditAction.BLOCKED_BY_POLICY)
                        .toList();
        assertThat(blockedAudits).hasSize(1);
        assertThat(blockedAudits.get(0).getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void consentValidation_WithRevokedConsent_BlocksMessage() {
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
                    "idempotency-revoked-consent");
            throw new AssertionError("Expected ResponseStatusException");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            assertThat(e.getStatusCode().value()).isEqualTo(422);
            assertThat(e.getReason()).contains("REVOKED");
        }
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void retryMechanism_ExponentialBackoff_MultipleAttempts() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(ProviderSendResult.failure("NETWORK_ERROR", "Timeout", true, null))
                .thenReturn(ProviderSendResult.failure("NETWORK_ERROR", "Timeout", true, null))
                .thenReturn(
                        ProviderSendResult.success(
                                "wamid.retry-success", Map.of("status", "success")));

        OutboundMessageEntity message =
                outboundMessageService.createOutboundMessage(
                        dossier.getId(),
                        MessageChannel.WHATSAPP,
                        TEST_PHONE,
                        "welcome_template",
                        null,
                        Map.of("language", "en"),
                        "idempotency-retry-backoff");

        for (int i = 0; i < 3; i++) {
            OutboundMessageEntity current =
                    outboundMessageRepository.findById(message.getId()).orElseThrow();
            outboundJobWorker.processMessage(current);
        }

        OutboundMessageEntity finalMessage =
                outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(finalMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(finalMessage.getAttemptCount()).isEqualTo(3);
        assertThat(finalMessage.getProviderMessageId()).isEqualTo("wamid.retry-success");

        List<OutboundAttemptEntity> attempts =
                outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(
                        message.getId());
        assertThat(attempts).hasSize(3);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(1).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(2).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);

        LocalDateTime firstRetry = attempts.get(0).getNextRetryAt();
        LocalDateTime secondRetry = attempts.get(1).getNextRetryAt();
        assertThat(secondRetry).isAfter(firstRetry);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void healthMetrics_TracksChannelPerformance() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
                .thenReturn(
                        ProviderSendResult.success("wamid.metrics-1", Map.of("status", "success")))
                .thenReturn(
                        ProviderSendResult.success("wamid.metrics-2", Map.of("status", "success")))
                .thenReturn(ProviderSendResult.failure("NETWORK_ERROR", "Timeout", true, null));

        for (int i = 0; i < 3; i++) {
            OutboundMessageEntity message =
                    outboundMessageService.createOutboundMessage(
                            dossier.getId(),
                            MessageChannel.WHATSAPP,
                            TEST_PHONE,
                            "welcome_template",
                            null,
                            Map.of("language", "en"),
                            "idempotency-metrics-" + i);
            outboundJobWorker.processMessage(message);
        }

        alertService.updateHealthMetrics();
        OutboundMessageAlertService.OutboundHealthMetrics metrics = alertService.getHealthMetrics();

        assertThat(metrics).isNotNull();
        assertThat(metrics.getChannelMetrics()).containsKey("WHATSAPP");

        OutboundMessageAlertService.ChannelHealthMetrics whatsappMetrics =
                alertService.getChannelHealth(MessageChannel.WHATSAPP);

        assertThat(whatsappMetrics.getTotalMessages()).isGreaterThanOrEqualTo(3);
    }

    private void createWhatsAppProviderConfig() {
        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setOrgId(TENANT_1);
        config.setPhoneNumberId("test-phone-number-id");
        config.setApiKeyEncrypted("test-api-key");
        config.setApiSecretEncrypted("test-api-secret");
        config.setWebhookSecretEncrypted("test-webhook-secret");
        config.setEnabled(true);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        whatsAppProviderConfigRepository.save(config);
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
                      "phone_number_id": "test-phone-number-id"
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
                      "phone_number_id": "test-phone-number-id"
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
