package com.example.backend.service;

import com.example.backend.config.RateLimitConfig;
import com.example.backend.dto.RateLimitStatsDto;
import com.example.backend.dto.RateLimitTierDto;
import com.example.backend.entity.RateLimitTier;
import com.example.backend.repository.RateLimitTierRepository;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RateLimitService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitService.class);
    private static final String BUCKET_KEY_PREFIX_ORG = "rate-limit:org:";
    private static final String BUCKET_KEY_PREFIX_IP = "rate-limit:ip:";

    private final RateLimitTierRepository rateLimitTierRepository;
    private final RateLimitConfig rateLimitConfig;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private final Counter rateLimitHitsCounter;
    private final Counter rateLimitRejectionsCounter;
    private final Counter rateLimitOrgHitsCounter;
    private final Counter rateLimitOrgRejectionsCounter;
    private final Counter rateLimitIpHitsCounter;
    private final Counter rateLimitIpRejectionsCounter;
    private final Timer rateLimitCheckTimer;

    public RateLimitService(
            RateLimitTierRepository rateLimitTierRepository,
            RateLimitConfig rateLimitConfig,
            MeterRegistry meterRegistry) {
        this.rateLimitTierRepository = rateLimitTierRepository;
        this.rateLimitConfig = rateLimitConfig;

        this.rateLimitHitsCounter =
                Counter.builder("rate_limit.hits")
                        .description("Total number of requests that hit the rate limiter")
                        .register(meterRegistry);
        this.rateLimitRejectionsCounter =
                Counter.builder("rate_limit.rejections")
                        .description("Total number of requests rejected due to rate limiting")
                        .register(meterRegistry);
        this.rateLimitOrgHitsCounter =
                Counter.builder("rate_limit.org.hits")
                        .description("Total number of org-based requests that hit the rate limiter")
                        .register(meterRegistry);
        this.rateLimitOrgRejectionsCounter =
                Counter.builder("rate_limit.org.rejections")
                        .description(
                                "Total number of org-based requests rejected due to rate limiting")
                        .register(meterRegistry);
        this.rateLimitIpHitsCounter =
                Counter.builder("rate_limit.ip.hits")
                        .description("Total number of IP-based requests that hit the rate limiter")
                        .register(meterRegistry);
        this.rateLimitIpRejectionsCounter =
                Counter.builder("rate_limit.ip.rejections")
                        .description(
                                "Total number of IP-based requests rejected due to rate limiting")
                        .register(meterRegistry);
        this.rateLimitCheckTimer =
                Timer.builder("rate_limit.check.duration")
                        .description("Time taken to perform rate limit checks")
                        .register(meterRegistry);

        logger.info(
                "RateLimitService initialized with in-memory buckets (Redis support available for future enhancement)");
    }

    public boolean tryConsumeForOrg(String orgId) {
        return rateLimitCheckTimer.record(
                () -> {
                    rateLimitHitsCounter.increment();
                    rateLimitOrgHitsCounter.increment();

                    String key = BUCKET_KEY_PREFIX_ORG + orgId;
                    boolean consumed =
                            tryConsumeBucket(key, () -> createOrgBucketConfiguration(orgId));

                    if (!consumed) {
                        rateLimitRejectionsCounter.increment();
                        rateLimitOrgRejectionsCounter.increment();
                        logger.warn("Rate limit exceeded for orgId: {}", orgId);
                    }

                    return consumed;
                });
    }

    public boolean tryConsumeForIp(String ipAddress) {
        return rateLimitCheckTimer.record(
                () -> {
                    rateLimitHitsCounter.increment();
                    rateLimitIpHitsCounter.increment();

                    String key = BUCKET_KEY_PREFIX_IP + ipAddress;
                    boolean consumed = tryConsumeBucket(key, this::createIpBucketConfiguration);

                    if (!consumed) {
                        rateLimitRejectionsCounter.increment();
                        rateLimitIpRejectionsCounter.increment();
                        logger.warn("Rate limit exceeded for IP: {}", ipAddress);
                    }

                    return consumed;
                });
    }

    private boolean tryConsumeBucket(String key, Supplier<BucketConfiguration> configSupplier) {
        Bucket bucket =
                buckets.computeIfAbsent(
                        key,
                        k -> {
                            BucketConfiguration config = configSupplier.get();
                            return Bucket.builder().addLimit(config.getBandwidths()[0]).build();
                        });
        return bucket.tryConsume(1);
    }

    private BucketConfiguration createOrgBucketConfiguration(String orgId) {
        int requestsPerMinute = getRateLimitForOrg(orgId);

        Bandwidth limit =
                Bandwidth.classic(
                        requestsPerMinute,
                        Refill.intervally(requestsPerMinute, Duration.ofMinutes(1)));
        return BucketConfiguration.builder().addLimit(limit).build();
    }

    private BucketConfiguration createIpBucketConfiguration() {
        int requestsPerMinute = rateLimitConfig.getIpBasedRequestsPerMinute();
        Bandwidth limit =
                Bandwidth.classic(
                        requestsPerMinute,
                        Refill.intervally(requestsPerMinute, Duration.ofMinutes(1)));
        return BucketConfiguration.builder().addLimit(limit).build();
    }

    private int getRateLimitForOrg(String orgId) {
        return rateLimitTierRepository
                .findByOrgId(orgId)
                .map(RateLimitTier::getRequestsPerMinute)
                .orElse(rateLimitConfig.getDefaultRequestsPerMinute());
    }

    @Transactional(readOnly = true)
    public List<RateLimitTierDto> getAllRateLimits() {
        return rateLimitTierRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<RateLimitTierDto> getRateLimitByOrgId(String orgId) {
        return rateLimitTierRepository.findByOrgId(orgId).map(this::toDto);
    }

    @Transactional
    public RateLimitTierDto createRateLimit(RateLimitTierDto dto) {
        RateLimitTier entity = new RateLimitTier();
        entity.setOrgId(dto.getOrgId());
        entity.setTierName(dto.getTierName());
        entity.setRequestsPerMinute(dto.getRequestsPerMinute());
        entity.setDescription(dto.getDescription());

        RateLimitTier saved = rateLimitTierRepository.save(entity);

        clearBucketForOrg(dto.getOrgId());

        buckets.remove(dto.getOrgId());

        return toDto(saved);
    }

    @Transactional
    public RateLimitTierDto updateRateLimit(String orgId, RateLimitTierDto dto) {
        RateLimitTier entity =
                rateLimitTierRepository
                        .findByOrgId(orgId)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Rate limit not found for orgId: " + orgId));

        entity.setTierName(dto.getTierName());
        entity.setRequestsPerMinute(dto.getRequestsPerMinute());
        entity.setDescription(dto.getDescription());

        RateLimitTier updated = rateLimitTierRepository.save(entity);

        clearBucketForOrg(orgId);

        buckets.remove(orgId);

        return toDto(updated);
    }

    @Transactional
    public void deleteRateLimit(String orgId) {
        RateLimitTier entity =
                rateLimitTierRepository
                        .findByOrgId(orgId)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Rate limit not found for orgId: " + orgId));

        rateLimitTierRepository.delete(entity);
        clearBucketForOrg(orgId);
    }

    public void clearBucket(String orgId) {
        clearBucketForOrg(orgId);
    }

    private void clearBucketForOrg(String orgId) {
        String key = BUCKET_KEY_PREFIX_ORG + orgId;
        buckets.remove(key);
        logger.info("Cleared rate limit bucket for orgId: {}", orgId);
    }

    public void clearBucketForIp(String ipAddress) {
        String key = BUCKET_KEY_PREFIX_IP + ipAddress;
        buckets.remove(key);
        logger.info("Cleared rate limit bucket for IP: {}", ipAddress);
    }

    public RateLimitStatsDto getStatistics() {
        long totalHits = (long) rateLimitHitsCounter.count();
        long totalRejections = (long) rateLimitRejectionsCounter.count();
        long orgHits = (long) rateLimitOrgHitsCounter.count();
        long orgRejections = (long) rateLimitOrgRejectionsCounter.count();
        long ipHits = (long) rateLimitIpHitsCounter.count();
        long ipRejections = (long) rateLimitIpRejectionsCounter.count();

        return new RateLimitStatsDto(
                totalHits, totalRejections, orgHits, orgRejections, ipHits, ipRejections);
    }

    private RateLimitTierDto toDto(RateLimitTier entity) {
        RateLimitTierDto dto = new RateLimitTierDto();
        dto.setId(entity.getId());
        dto.setOrgId(entity.getOrgId());
        dto.setTierName(entity.getTierName());
        dto.setRequestsPerMinute(entity.getRequestsPerMinute());
        dto.setDescription(entity.getDescription());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
