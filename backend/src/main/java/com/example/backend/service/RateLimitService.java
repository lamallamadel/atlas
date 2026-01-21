package com.example.backend.service;

import com.example.backend.config.RateLimitConfig;
import com.example.backend.dto.RateLimitTierDto;
import com.example.backend.entity.RateLimitTier;
import com.example.backend.repository.RateLimitTierRepository;
import com.example.backend.util.TenantContext;
import io.bucket4j.Bandwidth;
import io.bucket4j.Bucket;
import io.bucket4j.Refill;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RateLimitService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitService.class);

    private final RateLimitTierRepository rateLimitTierRepository;
    private final RateLimitConfig rateLimitConfig;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Counter rateLimitHitsCounter;
    private final Counter rateLimitRejectionsCounter;

    public RateLimitService(RateLimitTierRepository rateLimitTierRepository, RateLimitConfig rateLimitConfig, MeterRegistry meterRegistry) {
        this.rateLimitTierRepository = rateLimitTierRepository;
        this.rateLimitConfig = rateLimitConfig;
        this.rateLimitHitsCounter = Counter.builder("rate_limit.hits")
                .description("Total number of requests that hit the rate limiter")
                .register(meterRegistry);
        this.rateLimitRejectionsCounter = Counter.builder("rate_limit.rejections")
                .description("Total number of requests rejected due to rate limiting")
                .register(meterRegistry);
    }

    public boolean tryConsume(String orgId) {
        rateLimitHitsCounter.increment();
        Bucket bucket = resolveBucket(orgId);
        boolean consumed = bucket.tryConsume(1);
        if (!consumed) {
            rateLimitRejectionsCounter.increment();
            logger.warn("Rate limit exceeded for orgId: {}", orgId);
        }
        return consumed;
    }

    private Bucket resolveBucket(String orgId) {
        return buckets.computeIfAbsent(orgId, this::createNewBucket);
    }

    private Bucket createNewBucket(String orgId) {
        int requestsPerMinute = getRateLimitForOrg(orgId);
        Bandwidth limit = Bandwidth.classic(requestsPerMinute, Refill.intervally(requestsPerMinute, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private int getRateLimitForOrg(String orgId) {
        return rateLimitTierRepository.findByOrgId(orgId)
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
        return rateLimitTierRepository.findByOrgId(orgId)
                .map(this::toDto);
    }

    @Transactional
    public RateLimitTierDto createRateLimit(RateLimitTierDto dto) {
        RateLimitTier entity = new RateLimitTier();
        entity.setOrgId(dto.getOrgId());
        entity.setTierName(dto.getTierName());
        entity.setRequestsPerMinute(dto.getRequestsPerMinute());
        entity.setDescription(dto.getDescription());

        RateLimitTier saved = rateLimitTierRepository.save(entity);
        
        buckets.remove(dto.getOrgId());
        
        return toDto(saved);
    }

    @Transactional
    public RateLimitTierDto updateRateLimit(String orgId, RateLimitTierDto dto) {
        RateLimitTier entity = rateLimitTierRepository.findByOrgId(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Rate limit not found for orgId: " + orgId));

        entity.setTierName(dto.getTierName());
        entity.setRequestsPerMinute(dto.getRequestsPerMinute());
        entity.setDescription(dto.getDescription());

        RateLimitTier updated = rateLimitTierRepository.save(entity);
        
        buckets.remove(orgId);
        
        return toDto(updated);
    }

    @Transactional
    public void deleteRateLimit(String orgId) {
        RateLimitTier entity = rateLimitTierRepository.findByOrgId(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Rate limit not found for orgId: " + orgId));
        
        rateLimitTierRepository.delete(entity);
        buckets.remove(orgId);
    }

    public void clearBucket(String orgId) {
        buckets.remove(orgId);
    }

    private RateLimitTierDto toDto(RateLimitTier entity) {
        RateLimitTierDto dto = new RateLimitTierDto();
        dto.setId(entity.getId());
        dto.setOrgId(entity.getOrgId());
        dto.setTierName(entity.getTierName());
        dto.setRequestsPerMinute(entity.getRequestsPerMinute());
        dto.setDescription(entity.getDescription());
        return dto;
    }
}
