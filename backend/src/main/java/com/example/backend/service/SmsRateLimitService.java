package com.example.backend.service;

import com.example.backend.entity.SmsRateLimit;
import com.example.backend.repository.SmsRateLimitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class SmsRateLimitService {

    private static final Logger logger = LoggerFactory.getLogger(SmsRateLimitService.class);
    private static final int DEFAULT_QUOTA_LIMIT = 1000;
    private static final int DEFAULT_WINDOW_SECONDS = 86400;

    private final SmsRateLimitRepository rateLimitRepository;

    public SmsRateLimitService(SmsRateLimitRepository rateLimitRepository) {
        this.rateLimitRepository = rateLimitRepository;
    }

    @Transactional
    public boolean checkAndConsumeQuota(String orgId) {
        SmsRateLimit rateLimit = getOrCreateRateLimit(orgId);

        if (rateLimit.isThrottled()) {
            logger.warn("SMS rate limit throttled for orgId={}, throttleUntil={}", 
                orgId, rateLimit.getThrottleUntil());
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(rateLimit.getResetAt())) {
            rateLimit.resetQuota();
        }

        if (!rateLimit.isQuotaAvailable()) {
            logger.warn("SMS quota exceeded for orgId={}, count={}, limit={}", 
                orgId, rateLimit.getMessagesSentCount(), rateLimit.getQuotaLimit());
            return false;
        }

        rateLimit.incrementCount();
        rateLimitRepository.save(rateLimit);

        logger.debug("SMS quota consumed for orgId={}, count={}/{}", 
            orgId, rateLimit.getMessagesSentCount(), rateLimit.getQuotaLimit());

        return true;
    }

    @Transactional
    public void handleRateLimitError(String orgId, Integer retryAfterSeconds) {
        SmsRateLimit rateLimit = getOrCreateRateLimit(orgId);
        
        if (retryAfterSeconds != null && retryAfterSeconds > 0) {
            LocalDateTime throttleUntil = LocalDateTime.now().plusSeconds(retryAfterSeconds);
            rateLimit.setThrottleUntil(throttleUntil);
            logger.warn("SMS API rate limit hit for orgId={}, throttling until {}", orgId, throttleUntil);
        } else {
            LocalDateTime throttleUntil = LocalDateTime.now().plusMinutes(5);
            rateLimit.setThrottleUntil(throttleUntil);
            logger.warn("SMS API rate limit hit for orgId={}, throttling for 5 minutes", orgId);
        }
        
        rateLimitRepository.save(rateLimit);
    }

    @Transactional
    public void updateQuotaLimit(String orgId, Integer newLimit) {
        SmsRateLimit rateLimit = getOrCreateRateLimit(orgId);
        rateLimit.setQuotaLimit(newLimit);
        rateLimitRepository.save(rateLimit);
        logger.info("Updated SMS quota limit for orgId={} to {}", orgId, newLimit);
    }

    @Transactional(readOnly = true)
    public QuotaStatus getQuotaStatus(String orgId) {
        Optional<SmsRateLimit> rateLimitOpt = rateLimitRepository.findByOrgId(orgId);
        
        if (rateLimitOpt.isEmpty()) {
            return new QuotaStatus(0, DEFAULT_QUOTA_LIMIT, LocalDateTime.now().plusSeconds(DEFAULT_WINDOW_SECONDS), false);
        }

        SmsRateLimit rateLimit = rateLimitOpt.get();
        return new QuotaStatus(
            rateLimit.getMessagesSentCount(),
            rateLimit.getQuotaLimit(),
            rateLimit.getResetAt(),
            rateLimit.isThrottled()
        );
    }

    private SmsRateLimit getOrCreateRateLimit(String orgId) {
        return rateLimitRepository.findByOrgId(orgId)
            .orElseGet(() -> {
                SmsRateLimit newRateLimit = new SmsRateLimit();
                newRateLimit.setOrgId(orgId);
                newRateLimit.setQuotaLimit(DEFAULT_QUOTA_LIMIT);
                newRateLimit.setRateLimitWindowSeconds(DEFAULT_WINDOW_SECONDS);
                newRateLimit.setMessagesSentCount(0);
                newRateLimit.setResetAt(LocalDateTime.now().plusSeconds(DEFAULT_WINDOW_SECONDS));
                return rateLimitRepository.save(newRateLimit);
            });
    }

    public static class QuotaStatus {
        private final int messagesSent;
        private final int quotaLimit;
        private final LocalDateTime resetAt;
        private final boolean throttled;

        public QuotaStatus(int messagesSent, int quotaLimit, LocalDateTime resetAt, boolean throttled) {
            this.messagesSent = messagesSent;
            this.quotaLimit = quotaLimit;
            this.resetAt = resetAt;
            this.throttled = throttled;
        }

        public int getMessagesSent() {
            return messagesSent;
        }

        public int getQuotaLimit() {
            return quotaLimit;
        }

        public LocalDateTime getResetAt() {
            return resetAt;
        }

        public boolean isThrottled() {
            return throttled;
        }

        public int getRemainingQuota() {
            return Math.max(0, quotaLimit - messagesSent);
        }
    }
}
