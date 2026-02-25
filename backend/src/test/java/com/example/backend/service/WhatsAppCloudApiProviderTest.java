package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import java.time.Duration;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class WhatsAppCloudApiProviderTest {

    @Mock private WhatsAppProviderConfigRepository providerConfigRepository;

    @Mock private WhatsAppSessionWindowService sessionWindowService;

    @Mock private WhatsAppRateLimitService rateLimitService;

    @Mock private WhatsAppErrorMapper errorMapper;

    @Mock private RestTemplate restTemplate;

    @Mock private ObjectMapper objectMapper;

    private WhatsAppCloudApiProvider provider;
    private Map<String, Retry> retryByChannel;
    private Map<String, CircuitBreaker> circuitBreakerByChannel;
    private Map<String, TimeLimiter> timeLimiterByChannel;

    private WhatsAppProviderConfig config;
    private OutboundMessageEntity message;

    @BeforeEach
    void setUp() {
        RetryConfig retryConfig =
                RetryConfig.custom().maxAttempts(1).waitDuration(Duration.ofMillis(1)).build();
        RetryRegistry retryRegistry = RetryRegistry.of(retryConfig);

        CircuitBreakerConfig circuitBreakerConfig =
                CircuitBreakerConfig.custom()
                        .failureRateThreshold(50)
                        .minimumNumberOfCalls(10)
                        .slidingWindowSize(10)
                        .waitDurationInOpenState(Duration.ofSeconds(60))
                        .build();
        CircuitBreakerRegistry circuitBreakerRegistry =
                CircuitBreakerRegistry.of(circuitBreakerConfig);

        TimeLimiterConfig timeLimiterConfig =
                TimeLimiterConfig.custom().timeoutDuration(Duration.ofSeconds(30)).build();
        TimeLimiterRegistry timeLimiterRegistry = TimeLimiterRegistry.of(timeLimiterConfig);

        retryByChannel = new HashMap<>();
        circuitBreakerByChannel = new HashMap<>();
        timeLimiterByChannel = new HashMap<>();

        retryByChannel.put("whatsapp", retryRegistry.retry("whatsapp"));
        circuitBreakerByChannel.put("whatsapp", circuitBreakerRegistry.circuitBreaker("whatsapp"));
        timeLimiterByChannel.put("whatsapp", timeLimiterRegistry.timeLimiter("whatsapp"));

        provider =
                new WhatsAppCloudApiProvider(
                        providerConfigRepository,
                        sessionWindowService,
                        rateLimitService,
                        errorMapper,
                        restTemplate,
                        objectMapper,
                        null,
                        retryByChannel,
                        circuitBreakerByChannel,
                        timeLimiterByChannel);

        config = new WhatsAppProviderConfig();
        config.setOrgId("test-org");
        config.setPhoneNumberId("123456789");
        config.setApiKeyEncrypted("test-api-key");
        config.setEnabled(true);

        message = new OutboundMessageEntity();
        message.setId(1L);
        message.setOrgId("test-org");
        message.setChannel(MessageChannel.WHATSAPP);
        message.setTo("+1234567890");
        message.setSubject("Test message");
        message.setStatus(OutboundMessageStatus.QUEUED);
    }

    @Test
    void send_WithinSessionWindow_SendsFreeformMessage() {
        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("test-org")).thenReturn(true);
        when(sessionWindowService.isWithinSessionWindow("test-org", "+1234567890"))
                .thenReturn(true);

        Map<String, Object> responseBody =
                Map.of("messages", List.of(Map.of("id", "whatsapp-msg-123")));
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        when(restTemplate.exchange(
                        anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        ProviderSendResult result = provider.send(message);

        assertTrue(result.isSuccess());
        assertEquals("whatsapp-msg-123", result.getProviderMessageId());
        verify(sessionWindowService).recordOutboundMessage("test-org", "+1234567890");
    }

    @Test
    void send_OutsideSessionWindow_RequiresTemplate() {
        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("test-org")).thenReturn(true);
        when(sessionWindowService.isWithinSessionWindow("test-org", "+1234567890"))
                .thenReturn(false);

        ProviderSendResult result = provider.send(message);

        assertFalse(result.isSuccess());
        assertEquals("SESSION_EXPIRED", result.getErrorCode());
        assertTrue(result.getErrorMessage().contains("template"));
    }

    @Test
    void send_OutsideSessionWindow_WithTemplate_SendsTemplateMessage() {
        message.setTemplateCode("hello_world");
        message.setPayloadJson(Map.of("language", "en"));

        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("test-org")).thenReturn(true);
        when(sessionWindowService.isWithinSessionWindow("test-org", "+1234567890"))
                .thenReturn(false);

        Map<String, Object> responseBody =
                Map.of("messages", List.of(Map.of("id", "whatsapp-msg-456")));
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        when(restTemplate.exchange(
                        anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        ProviderSendResult result = provider.send(message);

        assertTrue(result.isSuccess());
        assertEquals("whatsapp-msg-456", result.getProviderMessageId());
    }

    @Test
    void send_QuotaExceeded_ReturnsFailure() {
        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("test-org")).thenReturn(false);

        ProviderSendResult result = provider.send(message);

        assertFalse(result.isSuccess());
        assertEquals("QUOTA_EXCEEDED", result.getErrorCode());
        assertTrue(result.isRetryable());
    }

    @Test
    void send_ProviderDisabled_ReturnsFailure() {
        config.setEnabled(false);
        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));

        ProviderSendResult result = provider.send(message);

        assertFalse(result.isSuccess());
        assertEquals("PROVIDER_DISABLED", result.getErrorCode());
        assertFalse(result.isRetryable());
    }

    @Test
    void send_RateLimitError_HandlesAppropriately() throws Exception {
        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("test-org")).thenReturn(true);
        when(sessionWindowService.isWithinSessionWindow("test-org", "+1234567890"))
                .thenReturn(true);

        String errorResponse =
                "{\"error\":{\"code\":130,\"message\":\"Rate limit hit\",\"error_data\":{\"retry_after\":300}}}";
        HttpClientErrorException exception =
                HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too Many Requests",
                        HttpHeaders.EMPTY,
                        errorResponse.getBytes(),
                        null);

        when(restTemplate.exchange(
                        anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(exception);
        when(objectMapper.readValue(anyString(), eq(Map.class)))
                .thenReturn(
                        Map.of(
                                "error",
                                Map.of(
                                        "code",
                                        130,
                                        "message",
                                        "Rate limit hit",
                                        "error_data",
                                        Map.of("retry_after", 300))));
        when(errorMapper.getErrorInfo("130"))
                .thenReturn(new WhatsAppErrorMapper.ErrorInfo("Rate limit hit", true, true));

        ProviderSendResult result = provider.send(message);

        assertFalse(result.isSuccess());
        verify(rateLimitService).handleRateLimitError("test-org", 300);
        assertTrue(result.isRetryable());
    }

    @Test
    void send_SessionExpiredError_ReturnsAppropriateMessage() throws Exception {
        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("test-org")).thenReturn(true);
        when(sessionWindowService.isWithinSessionWindow("test-org", "+1234567890"))
                .thenReturn(true);

        String errorResponse =
                "{\"error\":{\"code\":132016,\"message\":\"Message out of session window\"}}";
        HttpClientErrorException exception =
                HttpClientErrorException.create(
                        HttpStatus.BAD_REQUEST,
                        "Bad Request",
                        HttpHeaders.EMPTY,
                        errorResponse.getBytes(),
                        null);

        when(restTemplate.exchange(
                        anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(exception);
        when(objectMapper.readValue(anyString(), eq(Map.class)))
                .thenReturn(
                        Map.of(
                                "error",
                                Map.of(
                                        "code",
                                        132016,
                                        "message",
                                        "Message out of session window")));
        when(errorMapper.getErrorInfo("132016"))
                .thenReturn(
                        new WhatsAppErrorMapper.ErrorInfo(
                                "Out of session window - template required", false, false));

        ProviderSendResult result = provider.send(message);

        assertFalse(result.isSuccess());
        assertEquals("132016", result.getErrorCode());
        assertTrue(result.getErrorMessage().contains("template"));
    }

    @Test
    void send_NormalizesPhoneNumber() {
        when(providerConfigRepository.findByOrgId("test-org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("test-org")).thenReturn(true);
        when(sessionWindowService.isWithinSessionWindow(anyString(), anyString())).thenReturn(true);

        message.setTo("1234567890");

        Map<String, Object> responseBody = Map.of("messages", List.of(Map.of("id", "msg-123")));
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        when(restTemplate.exchange(
                        anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)))
                .thenReturn(response);

        provider.send(message);

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) entityCaptor.getValue().getBody();
        assertEquals("+1234567890", payload.get("to"));
    }

    @Test
    void supports_ReturnsTrue_ForWhatsAppChannel() {
        assertTrue(provider.supports("WHATSAPP"));
        assertTrue(provider.supports("whatsapp"));
    }

    @Test
    void supports_ReturnsFalse_ForOtherChannels() {
        assertFalse(provider.supports("EMAIL"));
        assertFalse(provider.supports("SMS"));
    }

    @Test
    void isRetryableError_DelegatesToErrorMapper() {
        when(errorMapper.isRetryable("131047")).thenReturn(false);
        when(errorMapper.isRetryable("131016")).thenReturn(true);

        assertFalse(provider.isRetryableError("131047"));
        assertTrue(provider.isRetryableError("131016"));
    }
}
