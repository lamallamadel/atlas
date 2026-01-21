package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.example.backend.service.*;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive E2E test suite for WhatsApp outbound workflow.
 * 
 * Tests cover:
 * - Template message sending with consent validation enforcement
 * - Delivery callback webhook processing with signature verification
 * - Retry logic validation when provider returns 5xx errors
 * - DLQ movement after max attempts exceeded
 * - End-to-end audit trail verification from QUEUED to SENT/FAILED states
 */
@BackendE2ETest
class WhatsAppOutboundComprehensiveE2ETest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-whatsapp-comprehensive-1";
    private static final String TEST_PHONE = "+33612345678";
    private static final String WEBHOOK_ENDPOINT = "/api/v1/webhooks/whatsapp/inbound";
    private static final String WEBHOOK_SECRET = "test-webhook-secret-12345";

    @Autowired
    private OutboundMessageRepository outboundMessageRepository;

    @Autowired
    private OutboundAttemptRepository outboundAttemptRepository;

    @Autowired
    private ConsentementRepository consentementRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private WhatsAppProviderConfigRepository whatsAppProviderConfigRepository;

    @Autowired
    private OutboundMessageService outboundMessageService;

    @Autowired
    private OutboundJobWorker outboundJobWorker;

    @Autowired
    private WhatsAppWebhookSignatureValidator signatureValidator;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean(name = "whatsAppCloudApiProvider")
    private OutboundMessageProvider mockWhatsAppProvider;

    @BeforeEach
    void setUp() {
        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        consentementRepository.deleteAll();
        auditEventRepository.deleteAll();
        dossierRepository.deleteAll();
        whatsAppProviderConfigRepository.deleteAll();

        setupWhatsAppProviderConfig();
        setupMockProvider();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        consentementRepository.deleteAll();
        auditEventRepository.deleteAll();
        dossierRepository.deleteAll();
        whatsAppProviderConfigRepository.deleteAll();
    }

    private void setupWhatsAppProviderConfig() {
        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setOrgId(TENANT_1);
        config.setApiKeyEncrypted("test-api-key");
        config.setApiSecretEncrypted("test-api-secret");
        config.setWebhookSecretEncrypted(WEBHOOK_SECRET);
        config.setPhoneNumberId("123456789");
        config.setBusinessAccountId("987654321");
        config.setEnabled(true);
        LocalDateTime now = LocalDateTime.now();
        config.setCreatedAt(now);
        config.setUpdatedAt(now);
        whatsAppProviderConfigRepository.save(config);
    }

    private void setupMockProvider() {
        when(mockWhatsAppProvider.supports("WHATSAPP")).thenReturn(true);
        when(mockWhatsAppProvider.supports(argThat(channel -> !"WHATSAPP".equals(channel)))).thenReturn(false);
    }

    // ============================================================================
    // TEST: Template Message Sending with Consent Validation Enforcement
    // ============================================================================

    @Test
    @WithMockUser(roles = {"PRO"})
    void templateMessageSending_WithValidConsent_CreatesQueuedMessage() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        Map<String, Object> templatePayload = new HashMap<>();
        templatePayload.put("language", "en");
        templatePayload.put("components", List.of(
            Map.of(
                "type", "body",
                "parameters", List.of(
                    Map.of("type", "text", "text", "John Doe")
                )
            )
        ));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            templatePayload,
            "idempotency-template-1"
        );

        assertThat(message).isNotNull();
        assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(message.getTemplateCode()).isEqualTo("welcome_template");
        assertThat(message.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(message.getTo()).isEqualTo(TEST_PHONE);
        assertThat(message.getDossierId()).isEqualTo(dossier.getId());
        assertThat(message.getPayloadJson()).isNotNull();
        assertThat(message.getPayloadJson().get("language")).isEqualTo("en");
        assertThat(message.getAttemptCount()).isEqualTo(0);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        AuditEventEntity createdEvent = auditEvents.stream()
            .filter(a -> a.getAction() == AuditAction.CREATED)
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .findFirst()
            .orElse(null);

        assertThat(createdEvent).isNotNull();
        assertThat(createdEvent.getEntityId()).isEqualTo(message.getId());
        assertThat(createdEvent.getOrgId()).isEqualTo(TENANT_1);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void templateMessageSending_WithoutConsent_RejectsMessage() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);

        Map<String, Object> templatePayload = Map.of("language", "en");

        try {
            outboundMessageService.createOutboundMessage(
                dossier.getId(),
                MessageChannel.WHATSAPP,
                TEST_PHONE,
                "welcome_template",
                null,
                templatePayload,
                "idempotency-no-consent"
            );
            throw new AssertionError("Expected exception was not thrown");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            assertThat(e.getStatusCode().value()).isEqualTo(422);
            assertThat(e.getReason()).contains("Consent required");
            assertThat(e.getReason()).contains("No consent found for channel WHATSAPP");
        }

        assertThat(outboundMessageRepository.findAll()).isEmpty();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        AuditEventEntity blockedEvent = auditEvents.stream()
            .filter(a -> a.getAction() == AuditAction.BLOCKED_BY_POLICY)
            .findFirst()
            .orElse(null);

        assertThat(blockedEvent).isNotNull();
        assertThat(blockedEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(blockedEvent.getEntityId()).isEqualTo(dossier.getId());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void templateMessageSending_WithExpiredConsent_RejectsMessage() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.REVOKED);

        Map<String, Object> templatePayload = Map.of("language", "fr");

        try {
            outboundMessageService.createOutboundMessage(
                dossier.getId(),
                MessageChannel.WHATSAPP,
                TEST_PHONE,
                "welcome_template",
                null,
                templatePayload,
                "idempotency-revoked-consent"
            );
            throw new AssertionError("Expected exception was not thrown");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            assertThat(e.getStatusCode().value()).isEqualTo(422);
            assertThat(e.getReason()).contains("REVOKED");
        }

        assertThat(outboundMessageRepository.findAll()).isEmpty();
    }

    // ============================================================================
    // TEST: Delivery Callback Webhook Processing with Signature Verification
    // ============================================================================

    @Test
    void webhookDeliveryCallback_WithValidSignature_ProcessesSuccessfully() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-webhook-valid-sig"
        );

        message.setStatus(OutboundMessageStatus.SENDING);
        message.setProviderMessageId("wamid.webhook-sig-test-123");
        outboundMessageRepository.save(message);

        String webhookPayload = createDeliveryStatusWebhook("wamid.webhook-sig-test-123", "delivered");
        String signature = computeHmacSignature(webhookPayload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header(TENANT_HEADER, TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookPayload))
            .andExpect(status().isOk())
            .andExpect(content().string("OK"));

        OutboundMessageEntity updatedMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);

        List<AuditEventEntity> webhookAudits = auditEventRepository.findAll().stream()
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .filter(a -> a.getAction() == AuditAction.UPDATED)
            .toList();
        assertThat(webhookAudits).isNotEmpty();
    }

    @Test
    void webhookDeliveryCallback_WithInvalidSignature_RejectsRequest() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-webhook-invalid-sig"
        );

        message.setStatus(OutboundMessageStatus.SENDING);
        message.setProviderMessageId("wamid.webhook-invalid-sig-123");
        OutboundMessageEntity savedMessage = outboundMessageRepository.save(message);
        OutboundMessageStatus originalStatus = savedMessage.getStatus();

        String webhookPayload = createDeliveryStatusWebhook("wamid.webhook-invalid-sig-123", "delivered");
        String invalidSignature = "sha256=invalid-signature-12345";

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header(TENANT_HEADER, TENANT_1)
                .header("X-Hub-Signature-256", invalidSignature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookPayload))
            .andExpect(status().isUnauthorized())
            .andExpect(content().string("Invalid signature"));

        OutboundMessageEntity unchangedMessage = outboundMessageRepository.findById(savedMessage.getId()).orElseThrow();
        assertThat(unchangedMessage.getStatus()).isEqualTo(originalStatus);
    }

    @Test
    void webhookDeliveryCallback_WithMissingSignature_ProcessesWithoutValidation() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-webhook-no-sig"
        );

        message.setStatus(OutboundMessageStatus.SENDING);
        message.setProviderMessageId("wamid.webhook-no-sig-123");
        outboundMessageRepository.save(message);

        String webhookPayload = createDeliveryStatusWebhook("wamid.webhook-no-sig-123", "sent");

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header(TENANT_HEADER, TENANT_1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookPayload))
            .andExpect(status().isOk())
            .andExpect(content().string("OK"));

        OutboundMessageEntity updatedMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
    }

    @Test
    void webhookDeliveryCallback_WithFailedStatus_UpdatesMessageWithError() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-webhook-failed"
        );

        message.setStatus(OutboundMessageStatus.SENDING);
        message.setProviderMessageId("wamid.webhook-failed-123");
        outboundMessageRepository.save(message);

        String webhookPayload = createDeliveryStatusWebhookWithError(
            "wamid.webhook-failed-123", 
            "failed", 
            131047, 
            "Re-engagement message"
        );
        String signature = computeHmacSignature(webhookPayload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header(TENANT_HEADER, TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookPayload))
            .andExpect(status().isOk());

        OutboundMessageEntity updatedMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updatedMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updatedMessage.getErrorCode()).isEqualTo("131047");
        assertThat(updatedMessage.getErrorMessage()).isEqualTo("Re-engagement message");
    }

    // ============================================================================
    // TEST: Retry Logic Validation with 5xx Errors
    // ============================================================================

    @Test
    @WithMockUser(roles = {"PRO"})
    void retryLogic_With5xxError_RetriesWithExponentialBackoff() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.failure("HTTP_503", "Service unavailable", true, null))
            .thenReturn(ProviderSendResult.failure("HTTP_500", "Internal server error", true, null))
            .thenReturn(ProviderSendResult.success("wamid.retry-5xx-success", Map.of("status", "success")));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-5xx-retry"
        );

        assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(message.getAttemptCount()).isEqualTo(0);

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity afterAttempt1 = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterAttempt1.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(afterAttempt1.getAttemptCount()).isEqualTo(1);
        assertThat(afterAttempt1.getErrorCode()).isEqualTo("HTTP_503");
        assertThat(afterAttempt1.getErrorMessage()).isEqualTo("Service unavailable");

        List<OutboundAttemptEntity> attempts1 = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts1).hasSize(1);
        assertThat(attempts1.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts1.get(0).getErrorCode()).isEqualTo("HTTP_503");
        assertThat(attempts1.get(0).getNextRetryAt()).isNotNull();
        LocalDateTime firstRetryTime = attempts1.get(0).getNextRetryAt();
        assertThat(firstRetryTime).isAfter(LocalDateTime.now().minusSeconds(5));

        outboundJobWorker.processMessage(afterAttempt1);

        OutboundMessageEntity afterAttempt2 = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterAttempt2.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(afterAttempt2.getAttemptCount()).isEqualTo(2);
        assertThat(afterAttempt2.getErrorCode()).isEqualTo("HTTP_500");
        assertThat(afterAttempt2.getErrorMessage()).isEqualTo("Internal server error");

        List<OutboundAttemptEntity> attempts2 = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts2).hasSize(2);
        assertThat(attempts2.get(1).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts2.get(1).getErrorCode()).isEqualTo("HTTP_500");
        assertThat(attempts2.get(1).getNextRetryAt()).isNotNull();
        LocalDateTime secondRetryTime = attempts2.get(1).getNextRetryAt();
        assertThat(secondRetryTime).isAfter(firstRetryTime);

        outboundJobWorker.processMessage(afterAttempt2);

        OutboundMessageEntity afterAttempt3 = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterAttempt3.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(afterAttempt3.getAttemptCount()).isEqualTo(3);
        assertThat(afterAttempt3.getProviderMessageId()).isEqualTo("wamid.retry-5xx-success");
        assertThat(afterAttempt3.getErrorCode()).isNull();
        assertThat(afterAttempt3.getErrorMessage()).isNull();

        List<OutboundAttemptEntity> attempts3 = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts3).hasSize(3);
        assertThat(attempts3.get(2).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void retryLogic_WithTransientErrors_RetriesCorrectly() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.failure("NETWORK_ERROR", "Connection timeout", true, null))
            .thenReturn(ProviderSendResult.failure("RATE_LIMIT", "Rate limit exceeded", true, null))
            .thenReturn(ProviderSendResult.failure("HTTP_502", "Bad gateway", true, null))
            .thenReturn(ProviderSendResult.success("wamid.transient-retry-success", Map.of("status", "success")));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "notification_template",
            null,
            Map.of("language", "en"),
            "idempotency-transient-retry"
        );

        for (int i = 0; i < 3; i++) {
            OutboundMessageEntity currentMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
            assertThat(currentMessage.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
            outboundJobWorker.processMessage(currentMessage);
        }

        OutboundMessageEntity afterRetries = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(afterRetries.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(afterRetries.getAttemptCount()).isEqualTo(3);

        outboundJobWorker.processMessage(afterRetries);

        OutboundMessageEntity finalMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(finalMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(finalMessage.getAttemptCount()).isEqualTo(4);
        assertThat(finalMessage.getProviderMessageId()).isEqualTo("wamid.transient-retry-success");

        List<OutboundAttemptEntity> allAttempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(allAttempts).hasSize(4);
        assertThat(allAttempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(allAttempts.get(1).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(allAttempts.get(2).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(allAttempts.get(3).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);
    }

    // ============================================================================
    // TEST: DLQ Movement After Max Attempts Exceeded
    // ============================================================================

    @Test
    @WithMockUser(roles = {"PRO"})
    void dlqMovement_MaxAttemptsExceeded_MovesToFailedState() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.failure("HTTP_503", "Service unavailable", true, null));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-dlq-max-attempts"
        );

        message.setMaxAttempts(3);
        outboundMessageRepository.save(message);

        for (int i = 0; i < 3; i++) {
            OutboundMessageEntity currentMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
            assertThat(currentMessage.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
            outboundJobWorker.processMessage(currentMessage);
        }

        OutboundMessageEntity dlqMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(dlqMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(dlqMessage.getAttemptCount()).isEqualTo(3);
        assertThat(dlqMessage.getErrorCode()).isEqualTo("HTTP_503");
        assertThat(dlqMessage.getErrorMessage()).isEqualTo("Service unavailable");

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(3);
        assertThat(attempts.stream().allMatch(a -> a.getStatus() == OutboundAttemptStatus.FAILED)).isTrue();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll().stream()
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .filter(a -> a.getEntityId().equals(message.getId()))
            .toList();

        boolean hasFailedAudit = auditEvents.stream()
            .anyMatch(a -> a.getAction() == AuditAction.FAILED);
        assertThat(hasFailedAudit).isTrue();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void dlqMovement_NonRetryableError_ImmediatelyMovesToFailed() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.failure("INVALID_PHONE", "Invalid phone number format", false, null));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-dlq-nonretryable"
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity failedMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(failedMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(failedMessage.getAttemptCount()).isEqualTo(1);
        assertThat(failedMessage.getErrorCode()).isEqualTo("INVALID_PHONE");
        assertThat(failedMessage.getErrorMessage()).isEqualTo("Invalid phone number format");

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(0).getNextRetryAt()).isNull();

        List<AuditEventEntity> failedAudits = auditEventRepository.findAll().stream()
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .filter(a -> a.getAction() == AuditAction.FAILED)
            .toList();
        assertThat(failedAudits).hasSize(1);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void dlqMovement_MultipleMessagesExceedMaxAttempts_AllMoveToDLQ() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.failure("HTTP_503", "Service unavailable", true, null));

        OutboundMessageEntity message1 = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "template1",
            null,
            Map.of("language", "en"),
            "idempotency-dlq-multi-1"
        );
        message1.setMaxAttempts(2);
        outboundMessageRepository.save(message1);

        OutboundMessageEntity message2 = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "template2",
            null,
            Map.of("language", "en"),
            "idempotency-dlq-multi-2"
        );
        message2.setMaxAttempts(2);
        outboundMessageRepository.save(message2);

        for (int i = 0; i < 2; i++) {
            OutboundMessageEntity current1 = outboundMessageRepository.findById(message1.getId()).orElseThrow();
            OutboundMessageEntity current2 = outboundMessageRepository.findById(message2.getId()).orElseThrow();
            outboundJobWorker.processMessage(current1);
            outboundJobWorker.processMessage(current2);
        }

        OutboundMessageEntity dlq1 = outboundMessageRepository.findById(message1.getId()).orElseThrow();
        OutboundMessageEntity dlq2 = outboundMessageRepository.findById(message2.getId()).orElseThrow();

        assertThat(dlq1.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(dlq1.getAttemptCount()).isEqualTo(2);
        assertThat(dlq2.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(dlq2.getAttemptCount()).isEqualTo(2);

        long failedCount = outboundMessageRepository.countByStatus(OutboundMessageStatus.FAILED);
        assertThat(failedCount).isEqualTo(2);
    }

    // ============================================================================
    // TEST: End-to-End Audit Trail Verification (QUEUED -> SENT/FAILED)
    // ============================================================================

    @Test
    @WithMockUser(roles = {"PRO"})
    void auditTrail_SuccessfulFlow_RecordsAllStateTransitions() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.success("wamid.audit-success-123", Map.of("status", "success")));

        long initialAuditCount = auditEventRepository.count();

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-audit-success"
        );

        Long messageId = message.getId();
        assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity sentMessage = outboundMessageRepository.findById(messageId).orElseThrow();
        assertThat(sentMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);

        List<AuditEventEntity> messageAudits = auditEventRepository.findAll().stream()
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .filter(a -> a.getEntityId().equals(messageId))
            .toList();

        assertThat(messageAudits.size()).isGreaterThanOrEqualTo(2);

        AuditEventEntity createdAudit = messageAudits.stream()
            .filter(a -> a.getAction() == AuditAction.CREATED)
            .findFirst()
            .orElse(null);
        assertThat(createdAudit).isNotNull();
        assertThat(createdAudit.getOrgId()).isEqualTo(TENANT_1);
        assertThat(createdAudit.getEntityId()).isEqualTo(messageId);

        AuditEventEntity sentAudit = messageAudits.stream()
            .filter(a -> a.getAction() == AuditAction.SENT)
            .findFirst()
            .orElse(null);
        assertThat(sentAudit).isNotNull();
        assertThat(sentAudit.getOrgId()).isEqualTo(TENANT_1);
        assertThat(sentAudit.getEntityId()).isEqualTo(messageId);
        assertThat(sentAudit.getCreatedAt()).isAfter(createdAudit.getCreatedAt());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void auditTrail_FailedFlow_RecordsAllStateTransitions() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.failure("INVALID_TEMPLATE", "Template not found", false, null));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "invalid_template",
            null,
            Map.of("language", "en"),
            "idempotency-audit-failed"
        );

        Long messageId = message.getId();

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity failedMessage = outboundMessageRepository.findById(messageId).orElseThrow();
        assertThat(failedMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);

        List<AuditEventEntity> messageAudits = auditEventRepository.findAll().stream()
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .filter(a -> a.getEntityId().equals(messageId))
            .toList();

        assertThat(messageAudits.size()).isGreaterThanOrEqualTo(2);

        AuditEventEntity createdAudit = messageAudits.stream()
            .filter(a -> a.getAction() == AuditAction.CREATED)
            .findFirst()
            .orElse(null);
        assertThat(createdAudit).isNotNull();

        AuditEventEntity failedAudit = messageAudits.stream()
            .filter(a -> a.getAction() == AuditAction.FAILED)
            .findFirst()
            .orElse(null);
        assertThat(failedAudit).isNotNull();
        assertThat(failedAudit.getOrgId()).isEqualTo(TENANT_1);
        assertThat(failedAudit.getEntityId()).isEqualTo(messageId);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void auditTrail_RetryFlow_RecordsAllAttempts() {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.failure("NETWORK_ERROR", "Connection timeout", true, null))
            .thenReturn(ProviderSendResult.failure("HTTP_503", "Service unavailable", true, null))
            .thenReturn(ProviderSendResult.success("wamid.audit-retry-success", Map.of("status", "success")));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-audit-retry"
        );

        Long messageId = message.getId();

        outboundJobWorker.processMessage(message);
        outboundJobWorker.processMessage(outboundMessageRepository.findById(messageId).orElseThrow());
        outboundJobWorker.processMessage(outboundMessageRepository.findById(messageId).orElseThrow());

        OutboundMessageEntity sentMessage = outboundMessageRepository.findById(messageId).orElseThrow();
        assertThat(sentMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(sentMessage.getAttemptCount()).isEqualTo(3);

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(messageId);
        assertThat(attempts).hasSize(3);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(0).getErrorCode()).isEqualTo("NETWORK_ERROR");
        assertThat(attempts.get(1).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(1).getErrorCode()).isEqualTo("HTTP_503");
        assertThat(attempts.get(2).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);

        List<AuditEventEntity> messageAudits = auditEventRepository.findAll().stream()
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .filter(a -> a.getEntityId().equals(messageId))
            .toList();

        assertThat(messageAudits.size()).isGreaterThanOrEqualTo(2);

        boolean hasCreated = messageAudits.stream().anyMatch(a -> a.getAction() == AuditAction.CREATED);
        boolean hasSent = messageAudits.stream().anyMatch(a -> a.getAction() == AuditAction.SENT);
        assertThat(hasCreated).isTrue();
        assertThat(hasSent).isTrue();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void auditTrail_CompleteFlowWithWebhook_RecordsEndToEnd() throws Exception {
        TenantContext.setOrgId(TENANT_1);

        Dossier dossier = createDossier(TENANT_1);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        when(mockWhatsAppProvider.send(any(OutboundMessageEntity.class)))
            .thenReturn(ProviderSendResult.success("wamid.complete-flow-123", Map.of("status", "success")));

        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            dossier.getId(),
            MessageChannel.WHATSAPP,
            TEST_PHONE,
            "welcome_template",
            null,
            Map.of("language", "en"),
            "idempotency-complete-flow"
        );

        Long messageId = message.getId();

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity sentMessage = outboundMessageRepository.findById(messageId).orElseThrow();
        assertThat(sentMessage.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(sentMessage.getProviderMessageId()).isEqualTo("wamid.complete-flow-123");

        String webhookPayload = createDeliveryStatusWebhook("wamid.complete-flow-123", "delivered");
        String signature = computeHmacSignature(webhookPayload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header(TENANT_HEADER, TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookPayload))
            .andExpect(status().isOk());

        OutboundMessageEntity deliveredMessage = outboundMessageRepository.findById(messageId).orElseThrow();
        assertThat(deliveredMessage.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);

        List<AuditEventEntity> messageAudits = auditEventRepository.findAll().stream()
            .filter(a -> a.getEntityType() == AuditEntityType.OUTBOUND_MESSAGE)
            .filter(a -> a.getEntityId().equals(messageId))
            .toList();

        assertThat(messageAudits.size()).isGreaterThanOrEqualTo(3);

        boolean hasCreated = messageAudits.stream().anyMatch(a -> a.getAction() == AuditAction.CREATED);
        boolean hasSent = messageAudits.stream().anyMatch(a -> a.getAction() == AuditAction.SENT);
        boolean hasUpdated = messageAudits.stream().anyMatch(a -> a.getAction() == AuditAction.UPDATED);

        assertThat(hasCreated).isTrue();
        assertThat(hasSent).isTrue();
        assertThat(hasUpdated).isTrue();
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

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

    private ConsentementEntity createConsent(Dossier dossier, ConsentementChannel channel, ConsentementStatus status) {
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
        return String.format("""
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
            """, messageId, status, TEST_PHONE);
    }

    private String createDeliveryStatusWebhookWithError(String messageId, String status, int errorCode, String errorMessage) {
        return String.format("""
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
            """, messageId, status, TEST_PHONE, errorCode, errorMessage);
    }

    private String computeHmacSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return "sha256=" + HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC signature", e);
        }
    }
}
