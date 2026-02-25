package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.example.backend.service.*;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.*;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@BackendE2ETest
@ActiveProfiles({"backend-e2e", "backend-e2e-h2"})
@TestPropertySource(properties = {
    "outbound.worker.enabled=false"
})
class WhatsAppProviderIntegrationTest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-whatsapp-provider-test";
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
    private WhatsAppSessionWindowRepository sessionWindowRepository;

    @Autowired
    private WhatsAppRateLimitRepository whatsAppRateLimitRepository;

    @Autowired
    private WhatsAppCloudApiProvider whatsAppProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean(name = "restTemplate")
    private RestTemplate restTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
        TenantContext.setOrgId(TENANT_1);

        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        entityManager.createNativeQuery("DELETE FROM whatsapp_session_window WHERE org_id = :orgId")
                .setParameter("orgId", TENANT_1)
                .executeUpdate();
        entityManager.flush();
        entityManager.clear();
        sessionWindowRepository.deleteAll();
        whatsAppRateLimitRepository.deleteAll();
        dossierRepository.deleteAll();
        whatsAppProviderConfigRepository.deleteAll();

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
        config.setApiSecretEncrypted("test-api-secret");
        config.setWebhookSecretEncrypted("test-secret");
        config.setEnabled(true);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        whatsAppProviderConfigRepository.save(config);
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - successful send returns provider message ID")
    void testProvider_SuccessfulSend() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        
        Map<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> messageInfo = new HashMap<>();
        messageInfo.put("id", "wamid.success123");
        messages.add(messageInfo);
        apiResponse.put("messages", messages);
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenReturn(ResponseEntity.ok(apiResponse));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getProviderMessageId()).isEqualTo("wamid.success123");
        assertThat(result.getResponseData()).isNotNull();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - HTTP 400 error parsed correctly")
    void testProvider_Http400Error() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        
        String errorResponseBody = """
            {
                "error": {
                    "message": "Invalid parameter",
                    "code": 100,
                    "error_subcode": 131042
                }
            }
            """;
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenThrow(new HttpClientErrorException(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            errorResponseBody.getBytes(),
            null
        ));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isIn("131042", "100");
        assertThat(result.isRetryable()).isFalse();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - HTTP 429 rate limit error")
    void testProvider_Http429RateLimit() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        
        String errorResponseBody = """
            {
                "error": {
                    "message": "Rate limit exceeded",
                    "code": 130,
                    "error_data": {
                        "retry_after": 60
                    }
                }
            }
            """;
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenThrow(new HttpClientErrorException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Too Many Requests",
            errorResponseBody.getBytes(),
            null
        ));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isEqualTo("130");
        assertThat(result.isRetryable()).isTrue();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - HTTP 500 server error is retryable")
    void testProvider_Http500ServerError() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        
        String errorResponseBody = """
            {
                "error": {
                    "message": "Internal server error",
                    "code": 2
                }
            }
            """;
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenThrow(new HttpServerErrorException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Internal Server Error",
            errorResponseBody.getBytes(),
            null
        ));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isTrue();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - session window enforced for freeform messages")
    void testProvider_SessionWindowEnforced() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        message.setTemplateCode(null);
        outboundMessageRepository.save(message);

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isEqualTo("SESSION_EXPIRED");
        assertThat(result.getErrorMessage()).contains("24-hour session window");
        assertThat(result.isRetryable()).isFalse();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - template message allowed outside session window")
    void testProvider_TemplateAllowedOutsideWindow() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        message.setTemplateCode("welcome_template");
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("language", "en");
        message.setPayloadJson(payload);
        outboundMessageRepository.save(message);
        
        Map<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> messageInfo = new HashMap<>();
        messageInfo.put("id", "wamid.template123");
        messages.add(messageInfo);
        apiResponse.put("messages", messages);
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenReturn(ResponseEntity.ok(apiResponse));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - quota check prevents sending")
    void testProvider_QuotaCheckPrevents() {
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
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isEqualTo("QUOTA_EXCEEDED");
        assertThat(result.isRetryable()).isTrue();
        
        verify(restTemplate, never()).exchange(anyString(), any(), any(), any(Class.class));
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - disabled provider returns error")
    void testProvider_DisabledProvider() {
        TenantContext.setOrgId(TENANT_1);
        
        WhatsAppProviderConfig config = whatsAppProviderConfigRepository.findByOrgId(TENANT_1).orElseThrow();
        config.setEnabled(false);
        whatsAppProviderConfigRepository.save(config);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isEqualTo("PROVIDER_DISABLED");
        assertThat(result.isRetryable()).isFalse();
        
        verify(restTemplate, never()).exchange(anyString(), any(), any(), any(Class.class));
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - phone number normalization")
    void testProvider_PhoneNormalization() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        message.setTo("336 12 34 56 78");
        outboundMessageRepository.save(message);
        
        WhatsAppSessionWindow window = new WhatsAppSessionWindow();
        window.setOrgId(TENANT_1);
        window.setPhoneNumber("+33612345678");
        window.setLastInboundMessageAt(LocalDateTime.now());
        window.setWindowOpensAt(LocalDateTime.now());
        window.setWindowExpiresAt(LocalDateTime.now().plusHours(24));
        window.setCreatedAt(LocalDateTime.now());
        window.setUpdatedAt(LocalDateTime.now());
        sessionWindowRepository.save(window);
        
        Map<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> messageInfo = new HashMap<>();
        messageInfo.put("id", "wamid.normalized123");
        messages.add(messageInfo);
        apiResponse.put("messages", messages);
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenReturn(ResponseEntity.ok(apiResponse));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - error message sanitization")
    void testProvider_ErrorMessageSanitization() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        
        String longError = "Error: " + "x".repeat(600);
        
        String errorResponseBody = String.format("""
            {
                "error": {
                    "message": "%s",
                    "code": 131000
                }
            }
            """, longError);
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenThrow(new HttpClientErrorException(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            errorResponseBody.getBytes(),
            null
        ));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).hasSizeLessThanOrEqualTo(503);
        assertThat(result.getErrorMessage()).endsWith("...");
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - supports WhatsApp channel")
    void testProvider_SupportsWhatsApp() {
        assertThat(whatsAppProvider.supports("WHATSAPP")).isTrue();
        assertThat(whatsAppProvider.supports("whatsapp")).isTrue();
        assertThat(whatsAppProvider.supports("SMS")).isFalse();
        assertThat(whatsAppProvider.supports("EMAIL")).isFalse();
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - session window updated after successful send")
    void testProvider_SessionWindowUpdatedAfterSend() {
        TenantContext.setOrgId(TENANT_1);
        
        WhatsAppSessionWindow window = new WhatsAppSessionWindow();
        window.setOrgId(TENANT_1);
        window.setPhoneNumber(TEST_PHONE);
        window.setLastInboundMessageAt(LocalDateTime.now().minusHours(1));
        window.setWindowOpensAt(LocalDateTime.now().minusHours(1));
        window.setWindowExpiresAt(LocalDateTime.now().plusHours(23));
        window.setCreatedAt(LocalDateTime.now().minusHours(1));
        window.setUpdatedAt(LocalDateTime.now().minusHours(1));
        window = sessionWindowRepository.save(window);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        
        Map<String, Object> apiResponse = new HashMap<>();
        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> messageInfo = new HashMap<>();
        messageInfo.put("id", "wamid.outbound123");
        messages.add(messageInfo);
        apiResponse.put("messages", messages);
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenReturn(ResponseEntity.ok(apiResponse));

        LocalDateTime beforeSend = LocalDateTime.now();
        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isTrue();
        
        WhatsAppSessionWindow updated = sessionWindowRepository.findById(window.getId()).orElseThrow();
        assertThat(updated.getLastOutboundMessageAt()).isNotNull();
        assertThat(updated.getLastOutboundMessageAt()).isAfterOrEqualTo(beforeSend.minusSeconds(2));
    }

    @Test
    @WithMockUser
    @DisplayName("Provider - complex error response parsing")
    void testProvider_ComplexErrorResponseParsing() {
        TenantContext.setOrgId(TENANT_1);
        
        OutboundMessageEntity message = createOutboundMessage(OutboundMessageStatus.QUEUED);
        
        String errorResponseBody = """
            {
                "error": {
                    "message": "Template parameter error",
                    "code": 100,
                    "error_subcode": 133008,
                    "error_data": {
                        "details": "Template parameter count mismatch"
                    },
                    "error_user_msg": "The template parameters don't match"
                }
            }
            """;
        
        when(restTemplate.exchange(
            anyString(),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenThrow(new HttpClientErrorException(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            errorResponseBody.getBytes(),
            null
        ));

        ProviderSendResult result = whatsAppProvider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isIn("133008", "Template parameter count mismatch");
        assertThat(result.getErrorMessage()).isNotEmpty();
    }

    private OutboundMessageEntity createOutboundMessage(OutboundMessageStatus status) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(TENANT_1);
        dossier.setLeadPhone(TEST_PHONE);
        dossier.setStatus(DossierStatus.NEW);
        dossier.setCreatedAt(LocalDateTime.now());
        dossier.setUpdatedAt(LocalDateTime.now());
        dossier = dossierRepository.save(dossier);

        WhatsAppSessionWindow window = new WhatsAppSessionWindow();
        window.setOrgId(TENANT_1);
        window.setPhoneNumber(TEST_PHONE);
        window.setLastInboundMessageAt(LocalDateTime.now());
        window.setWindowOpensAt(LocalDateTime.now());
        window.setWindowExpiresAt(LocalDateTime.now().plusHours(24));
        window.setCreatedAt(LocalDateTime.now());
        window.setUpdatedAt(LocalDateTime.now());
        sessionWindowRepository.save(window);

        OutboundMessageEntity message = new OutboundMessageEntity();
        message.setOrgId(TENANT_1);
        message.setDossierId(dossier.getId());
        message.setChannel(MessageChannel.WHATSAPP);
        message.setTo(TEST_PHONE);
        message.setStatus(status);
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
