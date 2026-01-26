package com.example.backend.service;

import com.example.backend.entity.WhatsAppRateLimit;
import com.example.backend.repository.WhatsAppRateLimitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class WhatsAppRateLimitService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppRateLimitService.class);
    private static final int DEFAULT_QUOTA_LIMIT = 1000;
    private static final int DEFAULT_WINDOW_SECONDS = 86400;
    private static final String REDIS_KEY_PREFIX = "whatsapp:ratelimit:";
    private static final String REDIS_COUNTER_KEY = "whatsapp:ratelimit:counter:";
    
    private final WhatsAppRateLimitRepository rateLimitRepository;
    private final StringRedisTemplate redisTemplate;
    private final boolean redisEnabled;

    @Autowired(required = false)
    public WhatsAppRateLimitService(
            WhatsAppRateLimitRepository rateLimitRepository, 
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.rateLimitRepository = rateLimitRepository;
        this.redisTemplate = redisTemplate;
        this.redisEnabled = redisTemplate != null;
        
        if (redisEnabled) {
            logger.info("WhatsAppRateLimitService initialized with Redis support");
        } else {
            logger.info("WhatsAppRateLimitService initialized with database-only mode");
        }
    }

    @Transactional
    public boolean checkAndConsumeQuota(String orgId) {
        if (!redisEnabled) {
            return checkAndConsumeQuotaWithDatabase(orgId);
        }

        try {
            return checkAndConsumeQuotaWithRedis(orgId);
        } catch (RedisConnectionFailureException | RedisSystemException ex) {
            logger.warn("Redis unavailable for WhatsApp rate limit checks; falling back to database for orgId={}", orgId, ex);
            return checkAndConsumeQuotaWithDatabase(orgId);
        }
    }
    
    private boolean checkAndConsumeQuotaWithRedis(String orgId) {
        String throttleKey = REDIS_KEY_PREFIX + "throttle:" + orgId;
        String counterKey = REDIS_COUNTER_KEY + orgId;
        String limitKey = REDIS_KEY_PREFIX + "limit:" + orgId;
        
        String throttleUntil = redisTemplate.opsForValue().get(throttleKey);
        if (throttleUntil != null) {
            logger.warn("WhatsApp rate limit throttled for orgId={}, throttleUntil={}", orgId, throttleUntil);
            return false;
        }
        
        Integer quotaLimit = DEFAULT_QUOTA_LIMIT;
        String limitStr = redisTemplate.opsForValue().get(limitKey);
        if (limitStr != null) {
            quotaLimit = Integer.parseInt(limitStr);
        } else {
            WhatsAppRateLimit rateLimit = getOrCreateRateLimit(orgId);
            quotaLimit = rateLimit.getQuotaLimit();
            redisTemplate.opsForValue().set(limitKey, String.valueOf(quotaLimit), 24, TimeUnit.HOURS);
        }
        
        Long currentCount = redisTemplate.opsForValue().increment(counterKey);
        if (currentCount == null) {
            currentCount = 0L;
        }
        
        if (currentCount == 1) {
            redisTemplate.expire(counterKey, DEFAULT_WINDOW_SECONDS, TimeUnit.SECONDS);
        }
        
        if (currentCount > quotaLimit) {
            logger.warn("WhatsApp quota exceeded for orgId={}, count={}, limit={}", 
                orgId, currentCount, quotaLimit);
            redisTemplate.opsForValue().decrement(counterKey);
            return false;
        }
        
        logger.debug("WhatsApp quota consumed for orgId={}, count={}/{} (Redis)", 
            orgId, currentCount, quotaLimit);
        
        syncCounterToDatabase(orgId, currentCount.intValue());
        
        return true;
    }
    
    private boolean checkAndConsumeQuotaWithDatabase(String orgId) {
        WhatsAppRateLimit rateLimit = getOrCreateRateLimit(orgId);

        if (rateLimit.isThrottled()) {
            logger.warn("WhatsApp rate limit throttled for orgId={}, throttleUntil={}", 
                orgId, rateLimit.getThrottleUntil());
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(rateLimit.getResetAt())) {
            rateLimit.resetQuota();
        }

        if (!rateLimit.isQuotaAvailable()) {
            logger.warn("WhatsApp quota exceeded for orgId={}, count={}, limit={}", 
                orgId, rateLimit.getMessagesSentCount(), rateLimit.getQuotaLimit());
            return false;
        }

        rateLimit.incrementCount();
        rateLimitRepository.save(rateLimit);

        logger.debug("WhatsApp quota consumed for orgId={}, count={}/{} (Database)", 
            orgId, rateLimit.getMessagesSentCount(), rateLimit.getQuotaLimit());

        return true;
    }
    
    private void syncCounterToDatabase(String orgId, int currentCount) {
        try {
            WhatsAppRateLimit rateLimit = getOrCreateRateLimit(orgId);
            if (currentCount % 10 == 0 || currentCount >= rateLimit.getQuotaLimit() - 10) {
                rateLimit.setMessagesSentCount(currentCount);
                rateLimit.setLastRequestAt(LocalDateTime.now());
                rateLimitRepository.save(rateLimit);
                logger.debug("Synced Redis counter to database for orgId={}, count={}", orgId, currentCount);
            }
        } catch (Exception e) {
            logger.warn("Failed to sync counter to database for orgId={}: {}", orgId, e.getMessage());
        }
    }

    @Transactional
    public void handleRateLimitError(String orgId, Integer retryAfterSeconds) {
        WhatsAppRateLimit rateLimit = getOrCreateRateLimit(orgId);
        
        LocalDateTime throttleUntil;
        int throttleSeconds;
        
        if (retryAfterSeconds != null && retryAfterSeconds > 0) {
            throttleUntil = LocalDateTime.now().plusSeconds(retryAfterSeconds);
            throttleSeconds = retryAfterSeconds;
            logger.warn("WhatsApp API rate limit hit for orgId={}, throttling until {}", orgId, throttleUntil);
        } else {
            throttleUntil = LocalDateTime.now().plusMinutes(5);
            throttleSeconds = 300;
            logger.warn("WhatsApp API rate limit hit for orgId={}, throttling for 5 minutes", orgId);
        }
        
        rateLimit.setThrottleUntil(throttleUntil);
        rateLimitRepository.save(rateLimit);
        
        if (redisEnabled) {
            try {
                String throttleKey = REDIS_KEY_PREFIX + "throttle:" + orgId;
                redisTemplate.opsForValue().set(throttleKey, throttleUntil.toString(), throttleSeconds, TimeUnit.SECONDS);
            } catch (RedisConnectionFailureException | RedisSystemException ex) {
                logger.warn("Redis unavailable while setting WhatsApp throttle; proceeding with database only for orgId={}", orgId, ex);
            }
        }
    }

    @Transactional
    public void updateQuotaLimit(String orgId, Integer newLimit) {
        WhatsAppRateLimit rateLimit = getOrCreateRateLimit(orgId);
        rateLimit.setQuotaLimit(newLimit);
        rateLimitRepository.save(rateLimit);
        logger.info("Updated WhatsApp quota limit for orgId={} to {}", orgId, newLimit);
        
        if (redisEnabled) {
            try {
                String limitKey = REDIS_KEY_PREFIX + "limit:" + orgId;
                redisTemplate.opsForValue().set(limitKey, String.valueOf(newLimit), 24, TimeUnit.HOURS);
            } catch (RedisConnectionFailureException | RedisSystemException ex) {
                logger.warn("Redis unavailable while updating WhatsApp quota limit; proceeding with database only for orgId={}", orgId, ex);
            }
        }
    }

    @Transactional(readOnly = true)
    public QuotaStatus getQuotaStatus(String orgId) {
        Optional<WhatsAppRateLimit> rateLimitOpt = rateLimitRepository.findByOrgId(orgId);
        
        if (rateLimitOpt.isEmpty()) {
            return new QuotaStatus(0, DEFAULT_QUOTA_LIMIT, LocalDateTime.now().plusSeconds(DEFAULT_WINDOW_SECONDS), false);
        }

        WhatsAppRateLimit rateLimit = rateLimitOpt.get();
        return new QuotaStatus(
            rateLimit.getMessagesSentCount(),
            rateLimit.getQuotaLimit(),
            rateLimit.getResetAt(),
            rateLimit.isThrottled()
        );
    }

    private WhatsAppRateLimit getOrCreateRateLimit(String orgId) {
        return rateLimitRepository.findByOrgId(orgId)
            .orElseGet(() -> {
                WhatsAppRateLimit newRateLimit = new WhatsAppRateLimit();
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
