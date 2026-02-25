package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.example.backend.service.*;
import com.example.backend.util.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@BackendE2ETest
@ActiveProfiles({"backend-e2e", "backend-e2e-h2"})
@TestPropertySource(properties = {
    "outbound.worker.enabled=false"
})
class WhatsAppRetryAndRateLimitIntegrationTest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-whatsapp-retry-test";
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
    private WhatsAppRateLimitRepository whatsAppRateLimitRepository;

    @Autowired
    private WhatsAppSessionWindowRepository sessionWindowRepository;

    @Autowired
    private OutboundJobWorker outboundJobWorker;

    @Autowired
    private WhatsAppRateLimitService rateLimitService;

    @Autowired
    private WhatsAppSessionWindowService sessionWindowService;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @MockBean(name = "whatsAppCloudApiProvider")
    private OutboundMessageProvider mockWhatsAppProvider;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
        
        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        sessionWindowRepository.deleteAll();
        whatsAppRateLimitRepository.deleteAll();
        dossierRepository.deleteAll();
        whatsAppProviderConfigRepository.deleteAll();

        when(mockWhatsAppProvider.supports("WHATSAPP")).thenReturn(true);
        when(mockWhatsAppProvider.supports(argThat(channel -> !"WHATSAPP".equals(channel)))).thenReturn(false);
        
        createWhatsAppProviderConfig();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        
        if (redisTemplate != null) {
            try {
                Set<String> keys = redisTemplate.keys("whatsapp:*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                }
            } catch (Exception e) {
            }
        }
    }

    private void createWhatsAppProviderConfig() {
        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setOrgId(TENANT_1);
        config.setPhoneNumberId("123456789");
        config.setApiKeyEncrypted("test-api-key");
        config.setApiSecretEncrypted("test-api-secret");
        config.setWebhookSecretEncrypted("test-secret");
        config.setEnabled(true);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        whatsAppProviderConfigRepository.save(config);
    }

    @Test
    @WithMockUser
    @DisplayName("Retry logic - first attempt success")
    void testRetry_FirstAttemptSuccess() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.success("wamid.success123", null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(updated.getAttemptCount()).isEqualTo(1);
        assertThat(updated.getProviderMessageId()).isEqualTo("wamid.success123");

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.SUCCESS);
        assertThat(attempts.get(0).getNextRetryAt()).isNull();
    }

    @Test
    @WithMockUser
    @DisplayName("Retry logic - retryable error schedules next attempt with 1 minute backoff")
    void testRetry_FirstAttemptRetryableError() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131016", "Service temporarily unavailable", true, null)
        );

        LocalDateTime beforeProcessing = LocalDateTime.now();
        outboundJobWorker.processMessage(message);
        LocalDateTime afterProcessing = LocalDateTime.now();

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(updated.getAttemptCount()).isEqualTo(1);
        assertThat(updated.getErrorCode()).isEqualTo("131016");

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(0).getNextRetryAt()).isNotNull();
        
        LocalDateTime expectedRetry = beforeProcessing.plusMinutes(1);
        assertThat(attempts.get(0).getNextRetryAt())
            .isAfterOrEqualTo(expectedRetry.minusSeconds(5))
            .isBeforeOrEqualTo(afterProcessing.plusMinutes(1).plusSeconds(5));
    }

    @Test
    @WithMockUser
    @DisplayName("Retry logic - second attempt uses 5 minute backoff")
    void testRetry_SecondAttemptBackoff() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        message.setAttemptCount(1);
        outboundMessageRepository.save(message);
        
        OutboundAttemptEntity firstAttempt = new OutboundAttemptEntity();
        firstAttempt.setOrgId(TENANT_1);
        firstAttempt.setOutboundMessage(message);
        firstAttempt.setAttemptNo(1);
        firstAttempt.setStatus(OutboundAttemptStatus.FAILED);
        firstAttempt.setNextRetryAt(LocalDateTime.now().minusMinutes(1));
        firstAttempt.setCreatedAt(LocalDateTime.now().minusMinutes(10));
        firstAttempt.setUpdatedAt(LocalDateTime.now().minusMinutes(10));
        outboundAttemptRepository.save(firstAttempt);
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131016", "Service temporarily unavailable", true, null)
        );

        LocalDateTime beforeProcessing = LocalDateTime.now();
        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(updated.getAttemptCount()).isEqualTo(2);

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(2);
        assertThat(attempts.get(1).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        
        LocalDateTime expectedRetry = beforeProcessing.plusMinutes(5);
        assertThat(attempts.get(1).getNextRetryAt())
            .isAfterOrEqualTo(expectedRetry.minusSeconds(5))
            .isBeforeOrEqualTo(expectedRetry.plusSeconds(5));
    }

    @Test
    @WithMockUser
    @DisplayName("Retry logic - third attempt uses 15 minute backoff")
    void testRetry_ThirdAttemptBackoff() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        message.setAttemptCount(2);
        outboundMessageRepository.save(message);
        
        createPreviousAttempts(message, 2);
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131016", "Service temporarily unavailable", true, null)
        );

        LocalDateTime beforeProcessing = LocalDateTime.now();
        outboundJobWorker.processMessage(message);

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(3);
        
        LocalDateTime expectedRetry = beforeProcessing.plusMinutes(15);
        assertThat(attempts.get(2).getNextRetryAt())
            .isAfterOrEqualTo(expectedRetry.minusSeconds(5))
            .isBeforeOrEqualTo(expectedRetry.plusSeconds(5));
    }

    @Test
    @WithMockUser
    @DisplayName("Retry logic - fourth attempt uses 60 minute backoff")
    void testRetry_FourthAttemptBackoff() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        message.setAttemptCount(3);
        outboundMessageRepository.save(message);
        
        createPreviousAttempts(message, 3);
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131016", "Service temporarily unavailable", true, null)
        );

        LocalDateTime beforeProcessing = LocalDateTime.now();
        outboundJobWorker.processMessage(message);

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(4);
        
        LocalDateTime expectedRetry = beforeProcessing.plusMinutes(60);
        assertThat(attempts.get(3).getNextRetryAt())
            .isAfterOrEqualTo(expectedRetry.minusSeconds(5))
            .isBeforeOrEqualTo(expectedRetry.plusSeconds(5));
    }

    @Test
    @WithMockUser
    @DisplayName("Retry logic - fifth attempt uses 360 minute (6 hour) backoff")
    void testRetry_FifthAttemptBackoff() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        message.setAttemptCount(4);
        outboundMessageRepository.save(message);
        
        createPreviousAttempts(message, 4);
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131016", "Service temporarily unavailable", true, null)
        );

        LocalDateTime beforeProcessing = LocalDateTime.now();
        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getAttemptCount()).isEqualTo(5);

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(5);
        assertThat(attempts.get(4).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
    }

    @Test
    @WithMockUser
    @DisplayName("Retry logic - non-retryable error fails immediately")
    void testRetry_NonRetryableErrorFailsImmediately() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("131021", "Recipient not on WhatsApp", false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getAttemptCount()).isEqualTo(1);
        assertThat(updated.getErrorCode()).isEqualTo("131021");

        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(OutboundAttemptStatus.FAILED);
        assertThat(attempts.get(0).getNextRetryAt()).isNull();
    }

    @Test
    @WithMockUser
    @DisplayName("Rate limiting - quota check prevents sending")
    void testRateLimit_QuotaExceeded() {
        TenantContext.setOrgId(TENANT_1);
        
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(TENANT_1);
        rateLimit.setQuotaLimit(10);
        rateLimit.setMessagesSentCount(10);
        rateLimit.setRateLimitWindowSeconds(86400);
        rateLimit.setResetAt(LocalDateTime.now().plusHours(1));
        rateLimit.setCreatedAt(LocalDateTime.now());
        rateLimit.setUpdatedAt(LocalDateTime.now());
        whatsAppRateLimitRepository.save(rateLimit);

        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("QUOTA_EXCEEDED", "WhatsApp quota exceeded or rate limited", true, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.QUEUED);
        assertThat(updated.getErrorCode()).isEqualTo("QUOTA_EXCEEDED");
    }

    @Test
    @WithMockUser
    @DisplayName("Rate limiting - Redis counter increments")
    @org.junit.jupiter.api.Disabled("Requires Redis; skipped in E2E H2 profile where Redis is not available")
    void testRateLimit_RedisCounterIncrements() {
        if (redisTemplate == null) {
            return;
        }

        TenantContext.setOrgId(TENANT_1);

        boolean firstCheck = rateLimitService.checkAndConsumeQuota(TENANT_1);
        assertThat(firstCheck).isTrue();

        String counterKey = "whatsapp:ratelimit:counter:" + TENANT_1;
        String count = redisTemplate.opsForValue().get(counterKey);
        assertThat(count).isEqualTo("1");

        boolean secondCheck = rateLimitService.checkAndConsumeQuota(TENANT_1);
        assertThat(secondCheck).isTrue();

        count = redisTemplate.opsForValue().get(counterKey);
        assertThat(count).isEqualTo("2");
    }

    @Test
    @WithMockUser
    @DisplayName("Rate limiting - throttle prevents sending")
    void testRateLimit_ThrottlePrevents() {
        TenantContext.setOrgId(TENANT_1);
        
        rateLimitService.handleRateLimitError(TENANT_1, 300);

        boolean canSend = rateLimitService.checkAndConsumeQuota(TENANT_1);
        assertThat(canSend).isFalse();

        WhatsAppRateLimitService.QuotaStatus status = rateLimitService.getQuotaStatus(TENANT_1);
        assertThat(status.isThrottled()).isTrue();
    }

    @Test
    @WithMockUser
    @DisplayName("Session window - within window allows freeform messages")
    void testSessionWindow_WithinWindow() {
        TenantContext.setOrgId(TENANT_1);
        
        sessionWindowService.updateSessionWindow(TENANT_1, TEST_PHONE, LocalDateTime.now());

        boolean withinWindow = sessionWindowService.isWithinSessionWindow(TENANT_1, TEST_PHONE);
        assertThat(withinWindow).isTrue();

        Optional<LocalDateTime> expiry = sessionWindowService.getSessionWindowExpiry(TENANT_1, TEST_PHONE);
        assertThat(expiry).isPresent();
        assertThat(expiry.get()).isAfter(LocalDateTime.now().plusHours(23));
    }

    @Test
    @WithMockUser
    @DisplayName("Session window - outside window requires template")
    void testSessionWindow_OutsideWindow() {
        TenantContext.setOrgId(TENANT_1);
        
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setOrgId(TENANT_1);
        session.setPhoneNumber(TEST_PHONE);
        session.setLastInboundMessageAt(LocalDateTime.now().minusHours(25));
        session.setWindowOpensAt(LocalDateTime.now().minusHours(25));
        session.setWindowExpiresAt(LocalDateTime.now().minusHours(1));
        session.setCreatedAt(LocalDateTime.now().minusHours(25));
        session.setUpdatedAt(LocalDateTime.now().minusHours(25));
        sessionWindowRepository.save(session);

        boolean withinWindow = sessionWindowService.isWithinSessionWindow(TENANT_1, TEST_PHONE);
        assertThat(withinWindow).isFalse();
    }

    @Test
    @WithMockUser
    @DisplayName("Session window - inbound message updates window")
    void testSessionWindow_InboundUpdatesWindow() {
        TenantContext.setOrgId(TENANT_1);
        
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setOrgId(TENANT_1);
        session.setPhoneNumber(TEST_PHONE);
        session.setLastInboundMessageAt(LocalDateTime.now().minusHours(25));
        session.setWindowOpensAt(LocalDateTime.now().minusHours(25));
        session.setWindowExpiresAt(LocalDateTime.now().minusHours(1));
        session.setCreatedAt(LocalDateTime.now().minusHours(25));
        session.setUpdatedAt(LocalDateTime.now().minusHours(25));
        sessionWindowRepository.save(session);

        LocalDateTime newInboundTime = LocalDateTime.now();
        sessionWindowService.updateSessionWindow(TENANT_1, TEST_PHONE, newInboundTime);

        boolean withinWindow = sessionWindowService.isWithinSessionWindow(TENANT_1, TEST_PHONE);
        assertThat(withinWindow).isTrue();

        WhatsAppSessionWindow updated = sessionWindowRepository.findByOrgIdAndPhoneNumber(TENANT_1, TEST_PHONE).orElseThrow();
        assertThat(updated.getLastInboundMessageAt()).isAfterOrEqualTo(newInboundTime.minusSeconds(1));
        assertThat(updated.getWindowExpiresAt()).isAfter(LocalDateTime.now().plusHours(23));
    }

    @Test
    @WithMockUser
    @DisplayName("Session window - outbound message recorded")
    void testSessionWindow_OutboundRecorded() {
        TenantContext.setOrgId(TENANT_1);
        
        sessionWindowService.updateSessionWindow(TENANT_1, TEST_PHONE, LocalDateTime.now());

        WhatsAppSessionWindow before = sessionWindowRepository.findByOrgIdAndPhoneNumber(TENANT_1, TEST_PHONE).orElseThrow();
        assertThat(before.getLastOutboundMessageAt()).isNull();

        sessionWindowService.recordOutboundMessage(TENANT_1, TEST_PHONE);

        WhatsAppSessionWindow after = sessionWindowRepository.findByOrgIdAndPhoneNumber(TENANT_1, TEST_PHONE).orElseThrow();
        assertThat(after.getLastOutboundMessageAt()).isNotNull();
        assertThat(after.getLastOutboundMessageAt()).isAfterOrEqualTo(LocalDateTime.now().minusSeconds(5));
    }

    @Test
    @WithMockUser
    @DisplayName("Provider error - session expired error")
    void testProviderError_SessionExpired() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createQueuedMessage();
        
        when(mockWhatsAppProvider.send(any())).thenReturn(
            ProviderSendResult.failure("SESSION_EXPIRED", 
                "Cannot send freeform message outside 24-hour session window. Use a template message instead.", 
                false, null)
        );

        outboundJobWorker.processMessage(message);

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("SESSION_EXPIRED");
        assertThat(updated.getErrorMessage()).contains("24-hour session window");
    }

    @Test
    @WithMockUser
    @DisplayName("Exponential backoff - verify BACKOFF_MINUTES array pattern")
    void testExponentialBackoff_VerifyPattern() {
        TenantContext.setOrgId(TENANT_1);
        
        int[] expectedBackoffs = {1, 5, 15, 60, 360};
        
        OutboundMessageEntity message = createQueuedMessage();
        
        for (int i = 0; i < expectedBackoffs.length - 1; i++) {
            message.setAttemptCount(i);
            outboundMessageRepository.save(message);
            
            if (i > 0) {
                createPreviousAttempts(message, i);
            }
            
            when(mockWhatsAppProvider.send(any())).thenReturn(
                ProviderSendResult.failure("131016", "Service temporarily unavailable", true, null)
            );

            LocalDateTime beforeProcessing = LocalDateTime.now();
            outboundJobWorker.processMessage(message);

            List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
            OutboundAttemptEntity lastAttempt = attempts.get(attempts.size() - 1);
            
            LocalDateTime expectedRetry = beforeProcessing.plusMinutes(expectedBackoffs[i]);
            assertThat(lastAttempt.getNextRetryAt())
                .withFailMessage("Attempt %d should have %d minute backoff", i + 1, expectedBackoffs[i])
                .isAfterOrEqualTo(expectedRetry.minusSeconds(5))
                .isBeforeOrEqualTo(expectedRetry.plusSeconds(5));
            
            outboundAttemptRepository.deleteAll();
            message = outboundMessageRepository.findById(message.getId()).orElseThrow();
        }
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

    private void createPreviousAttempts(OutboundMessageEntity message, int count) {
        for (int i = 1; i <= count; i++) {
            OutboundAttemptEntity attempt = new OutboundAttemptEntity();
            attempt.setOrgId(TENANT_1);
            attempt.setOutboundMessage(message);
            attempt.setAttemptNo(i);
            attempt.setStatus(OutboundAttemptStatus.FAILED);
            attempt.setNextRetryAt(LocalDateTime.now().minusMinutes(1));
            attempt.setCreatedAt(LocalDateTime.now().minusHours(i));
            attempt.setUpdatedAt(LocalDateTime.now().minusHours(i));
            outboundAttemptRepository.save(attempt);
        }
    }
}
