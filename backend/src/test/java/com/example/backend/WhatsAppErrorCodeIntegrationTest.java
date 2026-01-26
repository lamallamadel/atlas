package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.example.backend.service.*;
import com.example.backend.util.TenantContext;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@BackendE2ETest
@TestPropertySource(properties = {
    "outbound.worker.enabled=false"
})
class WhatsAppErrorCodeIntegrationTest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-whatsapp-error-test";
    private static final String TEST_PHONE = "+33612345678";

    @Autowired
    private OutboundMessageRepository outboundMessageRepository;

    @Autowired
    private OutboundAttemptRepository outboundAttemptRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private WhatsAppProviderConfigRepository whatsAppProviderConfigRepository;

    @Autowired
    private OutboundJobWorker outboundJobWorker;

    @Autowired
    private WhatsAppErrorMapper errorMapper;

    @MockBean(name = "whatsAppCloudApiProvider")
    private OutboundMessageProvider mockWhatsAppProvider;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
        
        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        dossierRepository.deleteAll();
        whatsAppProviderConfigRepository.deleteAll();

        when(mockWhatsAppProvider.supports("WHATSAPP")).thenReturn(true);
        when(mockWhatsAppProvider.supports(argThat(channel -> !"WHATSAPP".equals(channel)))).thenReturn(false);
        
        createWhatsAppProviderConfig();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private void createWhatsAppProviderConfig() {
        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setOrgId(TENANT_1);
        config.setPhoneNumberId("123456789");
        config.setApiKeyEncrypted("test-api-key");
        config.setWebhookSecretEncrypted("test-secret");
        config.setEnabled(true);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        whatsAppProviderConfigRepository.save(config);
    }

    static Stream<Arguments> retryableErrorCodes() {
        return Stream.of(
            Arguments.of("0", "Temporary error", true),
            Arguments.of("1", "Service temporarily unavailable", true),
            Arguments.of("3", "Business account rate limited", true),
            Arguments.of("4", "Temporary error with phone number", true),
            Arguments.of("130", "Rate limit hit", true),
            Arguments.of("131005", "Generic message send error", true),
            Arguments.of("131016", "Service temporarily unavailable", true),
            Arguments.of("131026", "Message undeliverable", true),
            Arguments.of("132000", "Generic platform error", true),
            Arguments.of("132001", "Message send failed", true),
            Arguments.of("132005", "Re-engagement message send failed", true),
            Arguments.of("132069", "Business account sending limit reached", true),
            Arguments.of("190", "Access token expired", true),
            Arguments.of("368", "Temporarily blocked for policy violations", true),
            Arguments.of("471", "User unavailable", true),
            Arguments.of("80007", "Rate limit exceeded", true)
        );
    }

    static Stream<Arguments> nonRetryableErrorCodes() {
        return Stream.of(
            Arguments.of("2", "Phone number connected to different WhatsApp Business Account", false),
            Arguments.of("5", "Permanent error with phone number", false),
            Arguments.of("100", "Invalid parameter", false),
            Arguments.of("131000", "Generic user error", false),
            Arguments.of("131008", "Required parameter missing", false),
            Arguments.of("131009", "Parameter value invalid", false),
            Arguments.of("131021", "Recipient not on WhatsApp", false),
            Arguments.of("131031", "Recipient blocked", false),
            Arguments.of("131042", "Phone number format invalid", false),
            Arguments.of("131045", "Message too long", false),
            Arguments.of("131047", "Invalid parameter value", false),
            Arguments.of("131051", "Unsupported message type", false),
            Arguments.of("131052", "Media download error", false),
            Arguments.of("131053", "Media upload error", false),
            Arguments.of("132007", "Message blocked by spam filter", false),
            Arguments.of("132012", "Phone number restricted", false),
            Arguments.of("132015", "Cannot send message after 24 hour window", false),
            Arguments.of("132016", "Out of session window - template required", false),
            Arguments.of("132068", "Business account blocked from sending messages", false),
            Arguments.of("133000", "Invalid phone number", false),
            Arguments.of("133004", "Template not found", false),
            Arguments.of("133005", "Template paused", false),
            Arguments.of("133006", "Template disabled", false),
            Arguments.of("133008", "Template parameter count mismatch", false),
            Arguments.of("133009", "Template missing parameters", false),
            Arguments.of("133010", "Template parameter format invalid", false),
            Arguments.of("133015", "Template not approved", false),
            Arguments.of("133016", "Template rejected", false),
            Arguments.of("135000", "Generic template error", false),
            Arguments.of("200", "Permissions error", false),
            Arguments.of("470", "Message expired", false)
        );
    }

    static Stream<Arguments> rateLimitErrorCodes() {
        return Stream.of(
            Arguments.of("3", "Business account rate limited", true),
            Arguments.of("130", "Rate limit hit", true),
            Arguments.of("132069", "Business account sending limit reached", true),
            Arguments.of("80007", "Rate limit exceeded", true)
        );
    }

    @ParameterizedTest
    @MethodSource("retryableErrorCodes")
    @WithMockUser
    @DisplayName("Retryable error codes - message should be retried")
    void testRetryableErrorCodes(String errorCode, String errorMessage, boolean expectedRetryable) {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure(errorCode, errorMessage, true, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus())
            .withFailMessage("Error code %s should result in QUEUED status for retry", errorCode)
            .isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(updated.getErrorCode()).isEqualTo(errorCode);
        assertThat(updated.getAttemptCount()).isEqualTo(1);

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(0).getNextRetryAt())
            .withFailMessage("Error code %s should schedule retry", errorCode)
            .isNotNull();
        
        boolean isRetryable = errorMapper.isRetryable(errorCode);
        assertThat(isRetryable)
            .withFailMessage("Error code %s should be marked as retryable", errorCode)
            .isEqualTo(expectedRetryable);
    }

    @ParameterizedTest
    @MethodSource("nonRetryableErrorCodes")
    @WithMockUser
    @DisplayName("Non-retryable error codes - message should fail immediately")
    void testNonRetryableErrorCodes(String errorCode, String errorMessage, boolean expectedRetryable) {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure(errorCode, errorMessage, false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus())
            .withFailMessage("Error code %s should result in FAILED status immediately", errorCode)
            .isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo(errorCode);
        assertThat(updated.getAttemptCount()).isEqualTo(1);

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(0).getNextRetryAt())
            .withFailMessage("Error code %s should not schedule retry", errorCode)
            .isNull();
        
        boolean isRetryable = errorMapper.isRetryable(errorCode);
        assertThat(isRetryable)
            .withFailMessage("Error code %s should be marked as non-retryable", errorCode)
            .isEqualTo(expectedRetryable);
    }

    @ParameterizedTest
    @MethodSource("rateLimitErrorCodes")
    @WithMockUser
    @DisplayName("Rate limit error codes - should be identified correctly")
    void testRateLimitErrorCodes(String errorCode, String errorMessage, boolean expectedRateLimit) {
        boolean isRateLimitError = errorMapper.isRateLimitError(errorCode);
        assertThat(isRateLimitError)
            .withFailMessage("Error code %s should be identified as rate limit error", errorCode)
            .isEqualTo(expectedRateLimit);
    }

    @Test
    @WithMockUser
    @DisplayName("Error mapper - unknown error code defaults to retryable")
    void testErrorMapper_UnknownCodeRetryable() {
        String unknownCode = "999999";
        
        boolean isRetryable = errorMapper.isRetryable(unknownCode);
        assertThat(isRetryable).isTrue();
        
        WhatsAppErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(unknownCode);
        assertThat(errorInfo.getMessage()).contains("Unmapped error code");
        assertThat(errorInfo.isRetryable()).isTrue();
        assertThat(errorInfo.isRateLimitError()).isFalse();
    }

    @Test
    @WithMockUser
    @DisplayName("Error mapper - null error code defaults to retryable")
    void testErrorMapper_NullCodeRetryable() {
        boolean isRetryable = errorMapper.isRetryable(null);
        assertThat(isRetryable).isTrue();
        
        WhatsAppErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(null);
        assertThat(errorInfo.getMessage()).isEqualTo("Unknown error");
        assertThat(errorInfo.isRetryable()).isTrue();
    }

    @Test
    @WithMockUser
    @DisplayName("Template errors - template not found")
    void testTemplateError_NotFound() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        message.setTemplateCode("non_existent_template");
        outboundMessageRepository.save(message);
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("133004", "Template not found", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("133004");
    }

    @Test
    @WithMockUser
    @DisplayName("Template errors - template parameter mismatch")
    void testTemplateError_ParameterMismatch() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        message.setTemplateCode("test_template");
        outboundMessageRepository.save(message);
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("133008", "Template parameter count mismatch", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("133008");
    }

    @Test
    @WithMockUser
    @DisplayName("Session window errors - outside 24h window")
    void testSessionWindowError_Outside24Hours() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("132015", "Cannot send message after 24 hour window", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("132015");
        
        boolean isRetryable = errorMapper.isRetryable("132015");
        assertThat(isRetryable).isFalse();
    }

    @Test
    @WithMockUser
    @DisplayName("Account errors - account blocked")
    void testAccountError_Blocked() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("132068", "Business account blocked from sending messages", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("132068");
    }

    @Test
    @WithMockUser
    @DisplayName("Recipient errors - not on WhatsApp")
    void testRecipientError_NotOnWhatsApp() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131021", "Recipient not on WhatsApp", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("131021");
    }

    @Test
    @WithMockUser
    @DisplayName("Recipient errors - blocked sender")
    void testRecipientError_BlockedSender() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131031", "Recipient blocked", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("131031");
    }

    @Test
    @WithMockUser
    @DisplayName("Message content errors - message too long")
    void testContentError_MessageTooLong() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131045", "Message too long", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("131045");
    }

    @Test
    @WithMockUser
    @DisplayName("Message content errors - spam filter")
    void testContentError_SpamFilter() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("132007", "Message blocked by spam filter", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("132007");
    }

    @Test
    @WithMockUser
    @DisplayName("Error progression - retryable error eventually fails after max attempts")
    void testErrorProgression_RetryableEventuallyFails() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131016", "Service temporarily unavailable", true, null)
        );

        for (int i = 0; i < 5; i++) {
            outboundJobWorker.processMessage(message);
            message = outboundMessageRepository.findById(message.getId()).orElseThrow();
            
            if (i < 4) {
                assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
            } else {
                assertThat(message.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
            }
        }

        OutboundMessageEntity finalMessage = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(finalMessage.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(finalMessage.getAttemptCount()).isEqualTo(5);
        assertThat(finalMessage.getErrorCode()).isEqualTo("131016");

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(5);
        attempts.forEach(attempt -> assertThat(attempt.getStatus()).isEqualTo(OutboundAttemptStatus.FAILED));
    }

    private OutboundMessageEntity createQueuedMessage() {
        Dossier dossier = new Dossier();
        dossier.setOrgId(TENANT_1);
        dossier.setLeadPhone(TEST_PHONE);
        dossier.setStatus(DossierStatus.NEW);
        dossier.setCreatedAt(LocalDateTime.now());
        dossier.setUpdatedAt(LocalDateTime.now());
        dossier = dossierRepository.save(dossier);

        OutboundMessageEntity message = new OutboundMessageEntity();
        message.setOrgId(TENANT_1);
        message.setDossierId(dossier.getId());
        message.setChannel(MessageChannel.WHATSAPP);
        message.setTo(TEST_PHONE);
        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setIdempotencyKey(UUID.randomUUID().toString());
        message.setAttemptCount(0);
        message.setMaxAttempts(5);
        message.setCreatedAt(LocalDateTime.now());
        message.setUpdatedAt(LocalDateTime.now());
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("body", "Test message");
        message.setPayloadJson(payload);
        
        return outboundMessageRepository.save(message);
    }
}
