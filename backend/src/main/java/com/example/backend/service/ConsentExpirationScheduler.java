package com.example.backend.service;

import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.repository.ConsentementRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentExpirationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ConsentExpirationScheduler.class);

    private final ConsentementRepository consentementRepository;
    private final ConsentementService consentementService;
    private final ConsentEventService consentEventService;

    @Value("${consent.expiration.enabled:true}")
    private boolean expirationEnabled;

    @Value("${consent.reminder.days-before:30}")
    private int reminderDaysBefore;

    public ConsentExpirationScheduler(
            ConsentementRepository consentementRepository,
            ConsentementService consentementService,
            ConsentEventService consentEventService) {
        this.consentementRepository = consentementRepository;
        this.consentementService = consentementService;
        this.consentEventService = consentEventService;
    }

    @Scheduled(cron = "${consent.expiration.cron:0 0 2 * * ?}")
    @Transactional
    public void processExpiredConsents() {
        if (!expirationEnabled) {
            logger.debug("Consent expiration scheduler is disabled");
            return;
        }

        logger.info("Running consent expiration scheduler...");

        LocalDateTime now = LocalDateTime.now();
        List<ConsentementEntity> expiredConsents =
                consentementRepository.findByStatusAndExpiresAtBefore(
                        ConsentementStatus.GRANTED, now);

        if (expiredConsents.isEmpty()) {
            logger.debug("No expired consents found");
            return;
        }

        logger.info("Found {} expired consents to process", expiredConsents.size());

        int successCount = 0;
        int failCount = 0;

        for (ConsentementEntity consent : expiredConsents) {
            try {
                ConsentementStatus previousStatus = consent.getStatus();
                consent.setStatus(ConsentementStatus.EXPIRED);
                consent.setUpdatedAt(now);
                consentementRepository.save(consent);

                consentEventService.emitEvent(consent, "EXPIRED", previousStatus, null);

                successCount++;
                logger.info(
                        "Expired consent: id={}, dossierId={}, channel={}, type={}",
                        consent.getId(),
                        consent.getDossier() != null ? consent.getDossier().getId() : null,
                        consent.getChannel(),
                        consent.getConsentType());
            } catch (Exception e) {
                failCount++;
                logger.error("Failed to expire consent {}: {}", consent.getId(), e.getMessage(), e);
            }
        }

        logger.info(
                "Consent expiration processing completed. Success: {}, Failed: {}",
                successCount,
                failCount);
    }

    @Scheduled(cron = "${consent.reminder.cron:0 0 10 * * ?}")
    @Transactional(readOnly = true)
    public void sendExpirationReminders() {
        if (!expirationEnabled) {
            logger.debug("Consent expiration reminder scheduler is disabled");
            return;
        }

        logger.info("Running consent expiration reminder scheduler...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderStart = now.plusDays(reminderDaysBefore - 1);
        LocalDateTime reminderEnd = now.plusDays(reminderDaysBefore + 1);

        List<ConsentementEntity> consentsNearExpiry =
                consentementRepository.findByStatusAndExpiresAtBetween(
                        ConsentementStatus.GRANTED, reminderStart, reminderEnd);

        if (consentsNearExpiry.isEmpty()) {
            logger.debug("No consents near expiry found for reminders");
            return;
        }

        logger.info(
                "Found {} consents expiring in ~{} days",
                consentsNearExpiry.size(),
                reminderDaysBefore);

        int successCount = 0;
        int failCount = 0;

        for (ConsentementEntity consent : consentsNearExpiry) {
            try {
                consentementService.sendExpirationReminder(consent);
                successCount++;
            } catch (Exception e) {
                failCount++;
                logger.error(
                        "Failed to send expiration reminder for consent {}: {}",
                        consent.getId(),
                        e.getMessage(),
                        e);
            }
        }

        logger.info(
                "Expiration reminder processing completed. Success: {}, Failed: {}",
                successCount,
                failCount);
    }
}
