package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.dto.RateLimitTierDto;
import com.example.backend.entity.RateLimitTier;
import com.example.backend.repository.RateLimitTierRepository;
import com.example.backend.service.RateLimitService;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles({"test", "backend-e2e-h2"})
@Transactional
class RateLimitIntegrationTest {

    @Autowired private RateLimitService rateLimitService;

    @Autowired private RateLimitTierRepository rateLimitTierRepository;

    @Autowired private MeterRegistry meterRegistry;

    private String testOrgId = "integration-test-org";

    @BeforeEach
    void setUp() {
        rateLimitTierRepository.deleteAll();
    }

    @Test
    void shouldEnforceOrgRateLimitsFromDatabase() {
        RateLimitTier tier = new RateLimitTier();
        tier.setOrgId(testOrgId);
        tier.setTierName("TEST");
        tier.setRequestsPerMinute(2);
        tier.setDescription("Test tier for integration test");
        rateLimitTierRepository.save(tier);

        boolean firstRequest = rateLimitService.tryConsumeForOrg(testOrgId);
        boolean secondRequest = rateLimitService.tryConsumeForOrg(testOrgId);
        boolean thirdRequest = rateLimitService.tryConsumeForOrg(testOrgId);

        assertThat(firstRequest).isTrue();
        assertThat(secondRequest).isTrue();
        assertThat(thirdRequest).isFalse();
    }

    @Test
    void shouldEnforceIpRateLimits() {
        String testIp = "203.0.113.45";

        int successCount = 0;
        int failCount = 0;

        for (int i = 0; i < 70; i++) {
            if (rateLimitService.tryConsumeForIp(testIp)) {
                successCount++;
            } else {
                failCount++;
            }
        }

        assertThat(successCount).isLessThanOrEqualTo(60);
        assertThat(failCount).isGreaterThan(0);
    }

    @Test
    void shouldClearBucketWhenRequested() {
        String clearTestOrgId = "clear-bucket-test-org";
        RateLimitTier tier = new RateLimitTier();
        tier.setOrgId(clearTestOrgId);
        tier.setTierName("TEST");
        tier.setRequestsPerMinute(1);
        tier.setDescription("Test tier");
        rateLimitTierRepository.save(tier);

        boolean firstRequest = rateLimitService.tryConsumeForOrg(clearTestOrgId);
        boolean secondRequest = rateLimitService.tryConsumeForOrg(clearTestOrgId);

        assertThat(firstRequest).isTrue();
        assertThat(secondRequest).isFalse();

        rateLimitService.clearBucket(clearTestOrgId);

        boolean thirdRequest = rateLimitService.tryConsumeForOrg(clearTestOrgId);
        assertThat(thirdRequest).isTrue();
    }

    @Test
    void shouldCreateAndRetrieveRateLimitConfiguration() {
        RateLimitTierDto dto = new RateLimitTierDto();
        dto.setOrgId("new-test-org");
        dto.setTierName("PREMIUM");
        dto.setRequestsPerMinute(1000);
        dto.setDescription("Premium tier");

        RateLimitTierDto created = rateLimitService.createRateLimit(dto);

        assertThat(created.getId()).isNotNull();
        assertThat(created.getOrgId()).isEqualTo("new-test-org");
        assertThat(created.getRequestsPerMinute()).isEqualTo(1000);

        Optional<RateLimitTierDto> retrieved = rateLimitService.getRateLimitByOrgId("new-test-org");
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getRequestsPerMinute()).isEqualTo(1000);
    }

    @Test
    void shouldUpdateRateLimitConfiguration() {
        RateLimitTier tier = new RateLimitTier();
        tier.setOrgId("update-test-org");
        tier.setTierName("STANDARD");
        tier.setRequestsPerMinute(100);
        tier.setDescription("Standard tier");
        rateLimitTierRepository.save(tier);

        RateLimitTierDto updateDto = new RateLimitTierDto();
        updateDto.setTierName("PREMIUM");
        updateDto.setRequestsPerMinute(1000);
        updateDto.setDescription("Updated to premium");

        RateLimitTierDto updated = rateLimitService.updateRateLimit("update-test-org", updateDto);

        assertThat(updated.getRequestsPerMinute()).isEqualTo(1000);
        assertThat(updated.getTierName()).isEqualTo("PREMIUM");

        Optional<RateLimitTier> fromDb = rateLimitTierRepository.findByOrgId("update-test-org");
        assertThat(fromDb).isPresent();
        assertThat(fromDb.get().getRequestsPerMinute()).isEqualTo(1000);
    }

    @Test
    void shouldTrackStatisticsCorrectly() {
        RateLimitTier tier = new RateLimitTier();
        tier.setOrgId("stats-test-org");
        tier.setTierName("TEST");
        tier.setRequestsPerMinute(2);
        tier.setDescription("Test tier");
        rateLimitTierRepository.save(tier);

        long initialHits = (long) meterRegistry.find("rate_limit.hits").counter().count();

        rateLimitService.tryConsumeForOrg("stats-test-org");
        rateLimitService.tryConsumeForOrg("stats-test-org");
        rateLimitService.tryConsumeForOrg("stats-test-org");
        rateLimitService.tryConsumeForIp("192.168.1.1");

        long finalHits = (long) meterRegistry.find("rate_limit.hits").counter().count();
        long finalRejections = (long) meterRegistry.find("rate_limit.rejections").counter().count();

        assertThat(finalHits - initialHits).isEqualTo(4L);
        assertThat(finalRejections).isGreaterThan(0L);
    }

    @Test
    void shouldIsolateBucketsPerOrg() {
        RateLimitTier tier1 = new RateLimitTier();
        tier1.setOrgId("org-1");
        tier1.setTierName("TEST");
        tier1.setRequestsPerMinute(1);
        tier1.setDescription("Test tier");
        rateLimitTierRepository.save(tier1);

        RateLimitTier tier2 = new RateLimitTier();
        tier2.setOrgId("org-2");
        tier2.setTierName("TEST");
        tier2.setRequestsPerMinute(1);
        tier2.setDescription("Test tier");
        rateLimitTierRepository.save(tier2);

        rateLimitService.tryConsumeForOrg("org-1");

        boolean org1Blocked = !rateLimitService.tryConsumeForOrg("org-1");
        boolean org2Allowed = rateLimitService.tryConsumeForOrg("org-2");

        assertThat(org1Blocked).isTrue();
        assertThat(org2Allowed).isTrue();
    }

    @Test
    void shouldIsolateBucketsPerIp() {
        rateLimitService.tryConsumeForIp("192.168.1.1");
        rateLimitService.tryConsumeForIp("192.168.1.2");

        boolean ip1Allowed = rateLimitService.tryConsumeForIp("192.168.1.1");
        boolean ip2Allowed = rateLimitService.tryConsumeForIp("192.168.1.2");

        assertThat(ip1Allowed).isTrue();
        assertThat(ip2Allowed).isTrue();
    }
}
