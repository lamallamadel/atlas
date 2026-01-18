package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.observability.MetricsService;
import com.example.backend.repository.OutboundMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OutboundMessageAlertService {

    private static final Logger logger = LoggerFactory.getLogger(OutboundMessageAlertService.class);

    private final OutboundMessageRepository outboundMessageRepository;
    private final MetricsService metricsService;

    @Value("${outbound.alert.stuck-message-threshold-attempts:3}")
    private int stuckMessageThresholdAttempts;

    @Value("${outbound.alert.stuck-message-age-hours:2}")
    private int stuckMessageAgeHours;

    @Value("${outbound.alert.enabled:true}")
    private boolean alertEnabled;

    @Value("${outbound.alert.max-results:100}")
    private int maxResults;

    public OutboundMessageAlertService(
            OutboundMessageRepository outboundMessageRepository,
            MetricsService metricsService) {
        this.outboundMessageRepository = outboundMessageRepository;
        this.metricsService = metricsService;
    }

    @Scheduled(cron = "${outbound.alert.cron:0 */15 * * * *}")
    public void checkForStuckMessages() {
        if (!alertEnabled) {
            logger.debug("Stuck message alerts are disabled");
            return;
        }

        try {
            LocalDateTime thresholdTime = LocalDateTime.now().minusHours(stuckMessageAgeHours);
            
            List<OutboundMessageEntity> stuckQueuedMessages = outboundMessageRepository.findStuckMessages(
                    OutboundMessageStatus.QUEUED,
                    stuckMessageThresholdAttempts,
                    thresholdTime,
                    PageRequest.of(0, maxResults)
            );

            List<OutboundMessageEntity> stuckSendingMessages = outboundMessageRepository.findStuckMessages(
                    OutboundMessageStatus.SENDING,
                    stuckMessageThresholdAttempts,
                    thresholdTime,
                    PageRequest.of(0, maxResults)
            );

            if (!stuckQueuedMessages.isEmpty() || !stuckSendingMessages.isEmpty()) {
                int totalStuck = stuckQueuedMessages.size() + stuckSendingMessages.size();
                
                logger.warn("ALERT: Found {} stuck outbound messages (threshold: {} attempts, age: {} hours)", 
                        totalStuck, stuckMessageThresholdAttempts, stuckMessageAgeHours);

                if (!stuckQueuedMessages.isEmpty()) {
                    logger.warn("Stuck QUEUED messages: {}", stuckQueuedMessages.size());
                    for (OutboundMessageEntity msg : stuckQueuedMessages) {
                        logger.warn("  - Message ID: {}, Channel: {}, Attempts: {}/{}, Age: {} hours, Error: {}", 
                                msg.getId(), 
                                msg.getChannel(),
                                msg.getAttemptCount(),
                                msg.getMaxAttempts(),
                                java.time.Duration.between(msg.getCreatedAt(), LocalDateTime.now()).toHours(),
                                msg.getErrorCode());
                        
                        metricsService.counter("outbound_message_stuck_alert_total", 
                                "channel", msg.getChannel().name().toLowerCase(),
                                "status", "queued").increment();
                    }
                }

                if (!stuckSendingMessages.isEmpty()) {
                    logger.warn("Stuck SENDING messages: {}", stuckSendingMessages.size());
                    for (OutboundMessageEntity msg : stuckSendingMessages) {
                        logger.warn("  - Message ID: {}, Channel: {}, Attempts: {}/{}, Age: {} hours", 
                                msg.getId(), 
                                msg.getChannel(),
                                msg.getAttemptCount(),
                                msg.getMaxAttempts(),
                                java.time.Duration.between(msg.getCreatedAt(), LocalDateTime.now()).toHours());
                        
                        metricsService.counter("outbound_message_stuck_alert_total", 
                                "channel", msg.getChannel().name().toLowerCase(),
                                "status", "sending").increment();
                    }
                }
            } else {
                logger.debug("No stuck messages found");
            }

        } catch (Exception e) {
            logger.error("Error checking for stuck messages", e);
            metricsService.counter("outbound_message_alert_error_total").increment();
        }
    }

    @Scheduled(cron = "${outbound.alert.high-queue-depth.cron:0 */10 * * * *}")
    public void checkForHighQueueDepth() {
        if (!alertEnabled) {
            return;
        }

        try {
            long queuedCount = outboundMessageRepository.countByStatus(OutboundMessageStatus.QUEUED);
            long sendingCount = outboundMessageRepository.countByStatus(OutboundMessageStatus.SENDING);
            long totalPending = queuedCount + sendingCount;

            int highQueueThreshold = 1000;

            if (totalPending > highQueueThreshold) {
                logger.warn("ALERT: High outbound message queue depth detected - Queued: {}, Sending: {}, Total: {}", 
                        queuedCount, sendingCount, totalPending);
                metricsService.counter("outbound_message_high_queue_depth_alert_total").increment();
            }

        } catch (Exception e) {
            logger.error("Error checking queue depth", e);
            metricsService.counter("outbound_message_alert_error_total").increment();
        }
    }

    @Scheduled(cron = "${outbound.alert.dead-letter.cron:0 0 * * * *}")
    public void checkForDeadLetterQueueGrowth() {
        if (!alertEnabled) {
            return;
        }

        try {
            long failedCount = outboundMessageRepository.countByStatus(OutboundMessageStatus.FAILED);

            int deadLetterThreshold = 100;

            if (failedCount > deadLetterThreshold) {
                logger.warn("ALERT: Dead letter queue has {} failed messages (threshold: {})", 
                        failedCount, deadLetterThreshold);
                metricsService.counter("outbound_message_dead_letter_alert_total").increment();
            }

        } catch (Exception e) {
            logger.error("Error checking dead letter queue", e);
            metricsService.counter("outbound_message_alert_error_total").increment();
        }
    }
}
