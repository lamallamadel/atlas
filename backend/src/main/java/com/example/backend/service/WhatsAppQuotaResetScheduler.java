package com.example.backend.service;

import com.example.backend.entity.WhatsAppRateLimit;
import com.example.backend.repository.WhatsAppRateLimitRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppQuotaResetScheduler {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppQuotaResetScheduler.class);

    private final WhatsAppRateLimitRepository rateLimitRepository;
    private final WhatsAppRateLimitService rateLimitService;
    private final QuotaExceededHandler quotaExceededHandler;

    public WhatsAppQuotaResetScheduler(
            WhatsAppRateLimitRepository rateLimitRepository,
            WhatsAppRateLimitService rateLimitService,
            QuotaExceededHandler quotaExceededHandler) {
        this.rateLimitRepository = rateLimitRepository;
        this.rateLimitService = rateLimitService;
        this.quotaExceededHandler = quotaExceededHandler;
    }

    @Scheduled(cron = "0 */5 * * * *")
    public void checkAndResetQuotas() {
        logger.debug("Checking for quota resets");

        List<WhatsAppRateLimit> allRateLimits = rateLimitRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (WhatsAppRateLimit rateLimit : allRateLimits) {
            if (now.isAfter(rateLimit.getResetAt())) {
                String orgId = rateLimit.getOrgId();
                logger.info(
                        "Quota reset window reached for orgId={}, requeuing throttled messages",
                        orgId);

                rateLimitService.resetQuotaIfNeeded(orgId);
                quotaExceededHandler.requeueThrottledMessages(orgId);
            }
        }
    }
}
