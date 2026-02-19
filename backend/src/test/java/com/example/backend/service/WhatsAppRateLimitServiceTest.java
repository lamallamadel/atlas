package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.backend.entity.WhatsAppRateLimit;
import com.example.backend.repository.WhatsAppRateLimitRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WhatsAppRateLimitServiceTest {

    @Mock private WhatsAppRateLimitRepository rateLimitRepository;

    @InjectMocks private WhatsAppRateLimitService service;

    private String orgId = "test-org";

    @Test
    void checkAndConsumeQuota_CreatesNewRateLimit_WhenNoneExists() {
        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.empty());
        when(rateLimitRepository.save(any(WhatsAppRateLimit.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = service.checkAndConsumeQuota(orgId);

        assertTrue(result);
        verify(rateLimitRepository, times(2)).save(any(WhatsAppRateLimit.class));
    }

    @Test
    void checkAndConsumeQuota_AllowsRequest_WhenQuotaAvailable() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(orgId);
        rateLimit.setMessagesSentCount(500);
        rateLimit.setQuotaLimit(1000);
        rateLimit.setResetAt(LocalDateTime.now().plusHours(1));

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        boolean result = service.checkAndConsumeQuota(orgId);

        assertTrue(result);
        assertEquals(501, rateLimit.getMessagesSentCount());
        verify(rateLimitRepository).save(rateLimit);
    }

    @Test
    void checkAndConsumeQuota_DeniesRequest_WhenQuotaExceeded() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(orgId);
        rateLimit.setMessagesSentCount(1000);
        rateLimit.setQuotaLimit(1000);
        rateLimit.setResetAt(LocalDateTime.now().plusHours(1));

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        boolean result = service.checkAndConsumeQuota(orgId);

        assertFalse(result);
        verify(rateLimitRepository, never()).save(any());
    }

    @Test
    void checkAndConsumeQuota_ResetsQuota_WhenResetTimeExpired() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(orgId);
        rateLimit.setMessagesSentCount(1000);
        rateLimit.setQuotaLimit(1000);
        rateLimit.setResetAt(LocalDateTime.now().minusHours(1));
        rateLimit.setRateLimitWindowSeconds(86400);

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        boolean result = service.checkAndConsumeQuota(orgId);

        assertTrue(result);
        assertEquals(1, rateLimit.getMessagesSentCount());
        assertTrue(rateLimit.getResetAt().isAfter(LocalDateTime.now()));
        verify(rateLimitRepository).save(rateLimit);
    }

    @Test
    void checkAndConsumeQuota_DeniesRequest_WhenThrottled() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(orgId);
        rateLimit.setMessagesSentCount(0);
        rateLimit.setQuotaLimit(1000);
        rateLimit.setResetAt(LocalDateTime.now().plusHours(1));
        rateLimit.setThrottleUntil(LocalDateTime.now().plusMinutes(5));

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        boolean result = service.checkAndConsumeQuota(orgId);

        assertFalse(result);
        verify(rateLimitRepository, never()).save(any());
    }

    @Test
    void handleRateLimitError_SetsThrottleTime_WithRetryAfter() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(orgId);

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        service.handleRateLimitError(orgId, 300);

        assertNotNull(rateLimit.getThrottleUntil());
        assertTrue(rateLimit.getThrottleUntil().isAfter(LocalDateTime.now().plusSeconds(299)));
        verify(rateLimitRepository).save(rateLimit);
    }

    @Test
    void handleRateLimitError_SetsDefaultThrottle_WithoutRetryAfter() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(orgId);

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        service.handleRateLimitError(orgId, null);

        assertNotNull(rateLimit.getThrottleUntil());
        assertTrue(rateLimit.getThrottleUntil().isAfter(LocalDateTime.now().plusMinutes(4)));
        verify(rateLimitRepository).save(rateLimit);
    }

    @Test
    void updateQuotaLimit_UpdatesLimit() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setOrgId(orgId);
        rateLimit.setQuotaLimit(1000);

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        service.updateQuotaLimit(orgId, 5000);

        assertEquals(5000, rateLimit.getQuotaLimit());
        verify(rateLimitRepository).save(rateLimit);
    }

    @Test
    void getQuotaStatus_ReturnsStatus_WhenRateLimitExists() {
        WhatsAppRateLimit rateLimit = new WhatsAppRateLimit();
        rateLimit.setMessagesSentCount(750);
        rateLimit.setQuotaLimit(1000);
        rateLimit.setResetAt(LocalDateTime.now().plusHours(12));
        rateLimit.setThrottleUntil(null);

        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.of(rateLimit));

        WhatsAppRateLimitService.QuotaStatus status = service.getQuotaStatus(orgId);

        assertEquals(750, status.getMessagesSent());
        assertEquals(1000, status.getQuotaLimit());
        assertEquals(250, status.getRemainingQuota());
        assertFalse(status.isThrottled());
    }

    @Test
    void getQuotaStatus_ReturnsDefaultStatus_WhenNoRateLimit() {
        when(rateLimitRepository.findByOrgId(orgId)).thenReturn(Optional.empty());

        WhatsAppRateLimitService.QuotaStatus status = service.getQuotaStatus(orgId);

        assertEquals(0, status.getMessagesSent());
        assertEquals(1000, status.getQuotaLimit());
        assertEquals(1000, status.getRemainingQuota());
        assertFalse(status.isThrottled());
    }
}
