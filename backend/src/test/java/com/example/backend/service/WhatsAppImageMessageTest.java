package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/** Messages WhatsApp de type image (photos jointes à une proposition de bien). */
@ExtendWith(MockitoExtension.class)
class WhatsAppImageMessageTest {

    @Mock private WhatsAppProviderConfigRepository providerConfigRepository;
    @Mock private WhatsAppSessionWindowService sessionWindowService;
    @Mock private WhatsAppRateLimitService rateLimitService;
    @Mock private WhatsAppErrorMapper errorMapper;
    @Mock private RestTemplate restTemplate;
    @Mock private WhatsAppMediaResolver mediaResolver;

    private WhatsAppCloudApiProvider provider;
    private OutboundMessageEntity message;

    @BeforeEach
    void setUp() {
        provider =
                new WhatsAppCloudApiProvider(
                        providerConfigRepository,
                        sessionWindowService,
                        rateLimitService,
                        errorMapper,
                        restTemplate,
                        new ObjectMapper(),
                        null,
                        Map.of(
                                "whatsapp",
                                RetryRegistry.of(
                                                RetryConfig.custom()
                                                        .maxAttempts(1)
                                                        .waitDuration(Duration.ofMillis(1))
                                                        .build())
                                        .retry("whatsapp")),
                        Map.of(
                                "whatsapp",
                                CircuitBreakerRegistry.ofDefaults().circuitBreaker("whatsapp")),
                        Map.of(
                                "whatsapp",
                                TimeLimiterRegistry.ofDefaults().timeLimiter("whatsapp")));
        provider.setMediaResolver(mediaResolver);

        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setOrgId("org");
        config.setPhoneNumberId("PHONE_ID");
        config.setApiKeyEncrypted("token");
        config.setEnabled(true);
        when(providerConfigRepository.findByOrgId("org")).thenReturn(Optional.of(config));
        when(rateLimitService.checkAndConsumeQuota("org")).thenReturn(true);
        when(sessionWindowService.isWithinSessionWindow("org", "+212600000002")).thenReturn(true);

        message = new OutboundMessageEntity();
        message.setId(5L);
        message.setOrgId("org");
        message.setChannel(MessageChannel.WHATSAPP);
        message.setTo("+212600000002");
        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setPayloadJson(Map.of("type", "image", "annonceId", 1, "mediaId", 7));
    }

    private static ResponseEntity<Map> sentOk() {
        return ResponseEntity.ok(Map.of("messages", List.of(Map.of("id", "wamid.1"))));
    }

    @Test
    @SuppressWarnings("unchecked")
    void photo_importee_televersee_puis_envoyee_par_identifiant() throws Exception {
        when(mediaResolver.resolve(message))
                .thenReturn(
                        new WhatsAppMediaResolver.ResolvedImage(
                                null, new byte[] {1, 2, 3}, "image/jpeg", "salon.jpg"));
        when(restTemplate.exchange(
                        eq("https://graph.facebook.com/v18.0/PHONE_ID/media"),
                        eq(HttpMethod.POST),
                        any(HttpEntity.class),
                        eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("id", "MEDIA_42")));
        when(restTemplate.exchange(
                        eq("https://graph.facebook.com/v18.0/PHONE_ID/messages"),
                        eq(HttpMethod.POST),
                        any(HttpEntity.class),
                        eq(Map.class)))
                .thenReturn(sentOk());
        org.springframework.test.util.ReflectionTestUtils.setField(
                provider, "baseUrl", "https://graph.facebook.com/v18.0");

        assertThat(provider.send(message).isSuccess()).isTrue();

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(2))
                .exchange(any(String.class), eq(HttpMethod.POST), captor.capture(), eq(Map.class));
        MultiValueMap<String, Object> upload =
                (MultiValueMap<String, Object>) captor.getAllValues().get(0).getBody();
        assertThat(upload.getFirst("messaging_product")).isEqualTo("whatsapp");
        assertThat(upload.getFirst("type")).isEqualTo("image/jpeg");
        Map<String, Object> sent = (Map<String, Object>) captor.getAllValues().get(1).getBody();
        assertThat(sent).containsEntry("type", "image").doesNotContainKey("text");
        assertThat((Map<String, Object>) sent.get("image")).containsEntry("id", "MEDIA_42");
    }

    @Test
    @SuppressWarnings("unchecked")
    void photo_externe_envoyee_par_lien() throws Exception {
        when(mediaResolver.resolve(message))
                .thenReturn(
                        new WhatsAppMediaResolver.ResolvedImage(
                                "https://cdn.example.ma/a.jpg", null, null, null));
        when(restTemplate.exchange(
                        any(String.class),
                        eq(HttpMethod.POST),
                        any(HttpEntity.class),
                        eq(Map.class)))
                .thenReturn(sentOk());

        assertThat(provider.send(message).isSuccess()).isTrue();

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1))
                .exchange(any(String.class), eq(HttpMethod.POST), captor.capture(), eq(Map.class));
        Map<String, Object> sent = (Map<String, Object>) captor.getValue().getBody();
        assertThat((Map<String, Object>) sent.get("image"))
                .containsEntry("link", "https://cdn.example.ma/a.jpg");
    }

    @Test
    void photo_introuvable_echec_definitif() throws Exception {
        when(mediaResolver.resolve(message))
                .thenThrow(
                        new WhatsAppMediaResolver.MediaUnavailableException(
                                "Photo introuvable : 7"));

        ProviderSendResult r = provider.send(message);

        assertThat(r.isSuccess()).isFalse();
        assertThat(r.getErrorCode()).isEqualTo("MEDIA_UNAVAILABLE");
        assertThat(r.isRetryable()).isFalse();
        verifyNoInteractions(restTemplate);
    }
}
