package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.backend.config.RateLimitConfig;
import com.example.backend.dto.RateLimitStatsDto;
import com.example.backend.dto.RateLimitTierDto;
import com.example.backend.entity.RateLimitTier;
import com.example.backend.repository.RateLimitTierRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RateLimitServiceTest {

    @Mock private RateLimitTierRepository rateLimitTierRepository;

    private RateLimitConfig rateLimitConfig;
    private MeterRegistry meterRegistry;
    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitConfig = new RateLimitConfig();
        rateLimitConfig.setDefaultRequestsPerMinute(100);
        rateLimitConfig.setIpBasedRequestsPerMinute(60);
        rateLimitConfig.setUseRedis(false);

        meterRegistry = new SimpleMeterRegistry();

        rateLimitService =
                new RateLimitService(rateLimitTierRepository, rateLimitConfig, meterRegistry);
    }

    @Test
    void shouldAllowRequestWithinOrgLimit() {
        RateLimitTier tier = createRateLimitTier("test-org", "STANDARD", 100);
        when(rateLimitTierRepository.findByOrgId("test-org")).thenReturn(Optional.of(tier));

        boolean result = rateLimitService.tryConsumeForOrg("test-org");

        assertThat(result).isTrue();
    }

    @Test
    void shouldRejectRequestWhenOrgLimitExceeded() {
        RateLimitTier tier = createRateLimitTier("test-org", "STANDARD", 1);
        when(rateLimitTierRepository.findByOrgId("test-org")).thenReturn(Optional.of(tier));

        rateLimitService.tryConsumeForOrg("test-org");
        boolean result = rateLimitService.tryConsumeForOrg("test-org");

        assertThat(result).isFalse();
    }

    @Test
    void shouldUseDefaultLimitWhenOrgNotConfigured() {
        when(rateLimitTierRepository.findByOrgId("unknown-org")).thenReturn(Optional.empty());

        boolean result = rateLimitService.tryConsumeForOrg("unknown-org");

        assertThat(result).isTrue();
    }

    @Test
    void shouldAllowRequestWithinIpLimit() {
        boolean result = rateLimitService.tryConsumeForIp("192.168.1.100");

        assertThat(result).isTrue();
    }

    @Test
    void shouldRejectRequestWhenIpLimitExceeded() {
        rateLimitConfig.setIpBasedRequestsPerMinute(1);
        rateLimitService =
                new RateLimitService(rateLimitTierRepository, rateLimitConfig, meterRegistry);

        rateLimitService.tryConsumeForIp("192.168.1.100");
        boolean result = rateLimitService.tryConsumeForIp("192.168.1.100");

        assertThat(result).isFalse();
    }

    @Test
    void shouldTrackMetricsForOrgRequests() {
        RateLimitTier tier = createRateLimitTier("test-org", "STANDARD", 100);
        when(rateLimitTierRepository.findByOrgId("test-org")).thenReturn(Optional.of(tier));

        rateLimitService.tryConsumeForOrg("test-org");

        Counter hitsCounter = meterRegistry.find("rate_limit.hits").counter();
        Counter orgHitsCounter = meterRegistry.find("rate_limit.org.hits").counter();

        assertThat(hitsCounter).isNotNull();
        assertThat(hitsCounter.count()).isEqualTo(1.0);
        assertThat(orgHitsCounter).isNotNull();
        assertThat(orgHitsCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldTrackMetricsForIpRequests() {
        rateLimitService.tryConsumeForIp("192.168.1.100");

        Counter hitsCounter = meterRegistry.find("rate_limit.hits").counter();
        Counter ipHitsCounter = meterRegistry.find("rate_limit.ip.hits").counter();

        assertThat(hitsCounter).isNotNull();
        assertThat(hitsCounter.count()).isEqualTo(1.0);
        assertThat(ipHitsCounter).isNotNull();
        assertThat(ipHitsCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldTrackRejectionsInMetrics() {
        rateLimitConfig.setIpBasedRequestsPerMinute(1);
        rateLimitService =
                new RateLimitService(rateLimitTierRepository, rateLimitConfig, meterRegistry);

        rateLimitService.tryConsumeForIp("192.168.1.100");
        rateLimitService.tryConsumeForIp("192.168.1.100");

        Counter rejectionsCounter = meterRegistry.find("rate_limit.rejections").counter();
        Counter ipRejectionsCounter = meterRegistry.find("rate_limit.ip.rejections").counter();

        assertThat(rejectionsCounter).isNotNull();
        assertThat(rejectionsCounter.count()).isEqualTo(1.0);
        assertThat(ipRejectionsCounter).isNotNull();
        assertThat(ipRejectionsCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldReturnAllRateLimits() {
        List<RateLimitTier> tiers =
                Arrays.asList(
                        createRateLimitTier("org1", "STANDARD", 100),
                        createRateLimitTier("org2", "PREMIUM", 1000));
        when(rateLimitTierRepository.findAll()).thenReturn(tiers);

        List<RateLimitTierDto> result = rateLimitService.getAllRateLimits();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getOrgId()).isEqualTo("org1");
        assertThat(result.get(1).getOrgId()).isEqualTo("org2");
    }

    @Test
    void shouldReturnRateLimitByOrgId() {
        RateLimitTier tier = createRateLimitTier("test-org", "PREMIUM", 1000);
        when(rateLimitTierRepository.findByOrgId("test-org")).thenReturn(Optional.of(tier));

        Optional<RateLimitTierDto> result = rateLimitService.getRateLimitByOrgId("test-org");

        assertThat(result).isPresent();
        assertThat(result.get().getOrgId()).isEqualTo("test-org");
        assertThat(result.get().getRequestsPerMinute()).isEqualTo(1000);
    }

    @Test
    void shouldCreateRateLimit() {
        RateLimitTierDto dto = new RateLimitTierDto();
        dto.setOrgId("new-org");
        dto.setTierName("STANDARD");
        dto.setRequestsPerMinute(100);
        dto.setDescription("Test tier");

        RateLimitTier savedTier = createRateLimitTier("new-org", "STANDARD", 100);
        when(rateLimitTierRepository.save(any(RateLimitTier.class))).thenReturn(savedTier);

        RateLimitTierDto result = rateLimitService.createRateLimit(dto);

        assertThat(result.getOrgId()).isEqualTo("new-org");
        verify(rateLimitTierRepository).save(any(RateLimitTier.class));
    }

    @Test
    void shouldUpdateRateLimit() {
        RateLimitTier existingTier = createRateLimitTier("test-org", "STANDARD", 100);
        when(rateLimitTierRepository.findByOrgId("test-org")).thenReturn(Optional.of(existingTier));
        when(rateLimitTierRepository.save(any(RateLimitTier.class))).thenReturn(existingTier);

        RateLimitTierDto dto = new RateLimitTierDto();
        dto.setTierName("PREMIUM");
        dto.setRequestsPerMinute(1000);
        dto.setDescription("Updated tier");

        RateLimitTierDto result = rateLimitService.updateRateLimit("test-org", dto);

        assertThat(result.getOrgId()).isEqualTo("test-org");
        verify(rateLimitTierRepository).save(any(RateLimitTier.class));
    }

    @Test
    void shouldThrowExceptionWhenUpdatingNonExistentRateLimit() {
        when(rateLimitTierRepository.findByOrgId("unknown-org")).thenReturn(Optional.empty());

        RateLimitTierDto dto = new RateLimitTierDto();
        dto.setTierName("PREMIUM");
        dto.setRequestsPerMinute(1000);

        assertThatThrownBy(() -> rateLimitService.updateRateLimit("unknown-org", dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rate limit not found");
    }

    @Test
    void shouldDeleteRateLimit() {
        RateLimitTier tier = createRateLimitTier("test-org", "STANDARD", 100);
        when(rateLimitTierRepository.findByOrgId("test-org")).thenReturn(Optional.of(tier));

        rateLimitService.deleteRateLimit("test-org");

        verify(rateLimitTierRepository).delete(tier);
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistentRateLimit() {
        when(rateLimitTierRepository.findByOrgId("unknown-org")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rateLimitService.deleteRateLimit("unknown-org"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rate limit not found");
    }

    @Test
    void shouldReturnStatistics() {
        RateLimitTier tier = createRateLimitTier("test-org", "STANDARD", 1);
        when(rateLimitTierRepository.findByOrgId("test-org")).thenReturn(Optional.of(tier));

        rateLimitService.tryConsumeForOrg("test-org");
        rateLimitService.tryConsumeForOrg("test-org");
        rateLimitService.tryConsumeForIp("192.168.1.100");

        RateLimitStatsDto stats = rateLimitService.getStatistics();

        assertThat(stats.getTotalHits()).isEqualTo(3L);
        assertThat(stats.getTotalRejections()).isEqualTo(1L);
        assertThat(stats.getOrgHits()).isEqualTo(2L);
        assertThat(stats.getOrgRejections()).isEqualTo(1L);
        assertThat(stats.getIpHits()).isEqualTo(1L);
        assertThat(stats.getIpRejections()).isEqualTo(0L);
    }

    private RateLimitTier createRateLimitTier(
            String orgId, String tierName, int requestsPerMinute) {
        RateLimitTier tier = new RateLimitTier();
        tier.setId(1L);
        tier.setOrgId(orgId);
        tier.setTierName(tierName);
        tier.setRequestsPerMinute(requestsPerMinute);
        tier.setDescription("Test tier");
        return tier;
    }
}
