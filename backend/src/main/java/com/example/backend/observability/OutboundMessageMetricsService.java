package com.example.backend.observability;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppSessionWindow;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.OutboundAttemptRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.repository.WhatsAppRateLimitRepository;
import com.example.backend.repository.WhatsAppSessionWindowRepository;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class OutboundMessageMetricsService {

    private static final Logger logger =
            LoggerFactory.getLogger(OutboundMessageMetricsService.class);

    private final OutboundMessageRepository outboundMessageRepository;
    private final OutboundAttemptRepository outboundAttemptRepository;
    private final WhatsAppRateLimitRepository whatsAppRateLimitRepository;
    private final WhatsAppSessionWindowRepository whatsAppSessionWindowRepository;
    private final MeterRegistry registry;

    private final Map<String, AtomicLong> queueDepthByStatus = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> queueDepthByChannel = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> retryCountsByChannel = new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> latencySummaries = new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> sendLatencyHistograms =
            new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> deliveredLatencyHistograms =
            new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> readLatencyHistograms =
            new ConcurrentHashMap<>();
    private final AtomicLong deadLetterQueueSize = new AtomicLong(0);
    private final AtomicLong totalQueuedMessages = new AtomicLong(0);
    private final AtomicLong whatsappQuotaUsed = new AtomicLong(0);
    private final AtomicLong whatsappQuotaLimit = new AtomicLong(1000);
    private final AtomicLong whatsappQuotaRemaining = new AtomicLong(1000);
    private final Map<String, AtomicLong> sessionWindowExpirationSeconds =
            new ConcurrentHashMap<>();
    private final AtomicLong stuckSendingMessagesCount = new AtomicLong(0);

    public OutboundMessageMetricsService(
            OutboundMessageRepository outboundMessageRepository,
            OutboundAttemptRepository outboundAttemptRepository,
            WhatsAppRateLimitRepository whatsAppRateLimitRepository,
            WhatsAppSessionWindowRepository whatsAppSessionWindowRepository,
            MeterRegistry registry) {

        this.outboundMessageRepository = outboundMessageRepository;
        this.outboundAttemptRepository = outboundAttemptRepository;
        this.whatsAppRateLimitRepository = whatsAppRateLimitRepository;
        this.whatsAppSessionWindowRepository = whatsAppSessionWindowRepository;
        this.registry = registry;
        initializeGauges();
    }

    private void initializeGauges() {
        for (OutboundMessageStatus status : OutboundMessageStatus.values()) {
            String statusKey = status.name().toLowerCase();
            AtomicLong gauge = new AtomicLong(0);
            queueDepthByStatus.put(statusKey, gauge);

            Gauge.builder("outbound_message_queue_depth", gauge, AtomicLong::get)
                    .tag("status", statusKey)
                    .description("Number of outbound messages by status")
                    .register(registry);
        }

        for (MessageChannel channel : MessageChannel.values()) {
            String channelKey = channel.name().toLowerCase();

            AtomicLong queueGauge = new AtomicLong(0);
            queueDepthByChannel.put(channelKey, queueGauge);
            Gauge.builder("outbound_message_queue_depth_by_channel", queueGauge, AtomicLong::get)
                    .tag("channel", channelKey)
                    .tag("status", "queued")
                    .description("Number of queued outbound messages by channel")
                    .register(registry);

            AtomicLong retryGauge = new AtomicLong(0);
            retryCountsByChannel.put(channelKey, retryGauge);
            Gauge.builder("outbound_message_retry_count", retryGauge, AtomicLong::get)
                    .tag("channel", channelKey)
                    .description("Number of messages with retry attempts by channel")
                    .register(registry);

            DistributionSummary summary =
                    DistributionSummary.builder("outbound_message_delivery_latency_seconds")
                            .tag("channel", channelKey)
                            .description("Distribution of delivery latencies in seconds")
                            .publishPercentiles(0.5, 0.95, 0.99)
                            .publishPercentileHistogram()
                            .register(registry);
            latencySummaries.put(channelKey, summary);

            DistributionSummary sendLatency =
                    DistributionSummary.builder("outbound_message_send_latency_seconds")
                            .tag("channel", channelKey)
                            .description("Time from message creation to SENT status (p50/p95/p99)")
                            .publishPercentiles(0.5, 0.95, 0.99)
                            .publishPercentileHistogram()
                            .register(registry);
            sendLatencyHistograms.put(channelKey, sendLatency);

            DistributionSummary deliveredLatency =
                    DistributionSummary.builder("outbound_message_delivered_latency_seconds")
                            .tag("channel", channelKey)
                            .description(
                                    "Time from message creation to DELIVERED status (p50/p95/p99)")
                            .publishPercentiles(0.5, 0.95, 0.99)
                            .publishPercentileHistogram()
                            .register(registry);
            deliveredLatencyHistograms.put(channelKey, deliveredLatency);

            DistributionSummary readLatency =
                    DistributionSummary.builder("outbound_message_read_latency_seconds")
                            .tag("channel", channelKey)
                            .description("Time from message creation to READ status (p50/p95/p99)")
                            .publishPercentiles(0.5, 0.95, 0.99)
                            .publishPercentileHistogram()
                            .register(registry);
            readLatencyHistograms.put(channelKey, readLatency);

            AtomicLong sessionExpiration = new AtomicLong(0);
            sessionWindowExpirationSeconds.put(channelKey, sessionExpiration);
            Gauge.builder(
                            "whatsapp_session_window_expiration_seconds",
                            sessionExpiration,
                            AtomicLong::get)
                    .tag("channel", channelKey)
                    .description(
                            "Time in seconds until WhatsApp session window expires (0 if no active"
                                    + " window)")
                    .register(registry);
        }

        Gauge.builder(
                        "outbound_message_dead_letter_queue_size",
                        deadLetterQueueSize,
                        AtomicLong::get)
                .description("Number of permanently failed messages in dead letter queue")
                .register(registry);

        Gauge.builder("outbound_message_total_queued", totalQueuedMessages, AtomicLong::get)
                .description("Total number of queued messages across all channels")
                .register(registry);

        Gauge.builder("whatsapp_quota_used", whatsappQuotaUsed, AtomicLong::get)
                .description("WhatsApp API quota used in current window")
                .register(registry);

        Gauge.builder("whatsapp_quota_limit", whatsappQuotaLimit, AtomicLong::get)
                .description("WhatsApp API quota limit for current window")
                .register(registry);

        Gauge.builder("whatsapp_quota_remaining", whatsappQuotaRemaining, AtomicLong::get)
                .description("WhatsApp API quota remaining in current window")
                .register(registry);

        Gauge.builder("whatsapp_message_stuck_alert", stuckSendingMessagesCount, AtomicLong::get)
                .description("Number of messages stuck in SENDING status for more than 5 minutes")
                .register(registry);

        logger.info("Initialized outbound message metrics gauges and histograms");
    }

    @Scheduled(fixedDelayString = "${outbound.metrics.update-interval-ms:10000}")
    public void updateMetrics() {
        try {

            updateQueueDepthMetrics();
            updateLatencyMetrics();
            updateWhatsAppQuotaMetrics();
            updateSessionWindowExpirationMetrics();
            updateSLALatencyHistograms();

            logger.debug(
                    "Updated outbound message metrics: totalQueued={}, deadLetter={}, whatsappQuotaUsed={}/{}, stuckSending={}",
                    totalQueuedMessages.get(),
                    deadLetterQueueSize.get(),
                    whatsappQuotaUsed.get(),
                    whatsappQuotaLimit.get(),
                    stuckSendingMessagesCount.get());

            for (OutboundMessageStatus status : OutboundMessageStatus.values()) {
                String statusKey = status.name().toLowerCase();
                long count = outboundMessageRepository.countByStatus(status);
                AtomicLong gauge = queueDepthByStatus.get(statusKey);
                if (gauge != null) {
                    gauge.set(count);
                }

                if (status == OutboundMessageStatus.QUEUED) {
                    totalQueuedMessages.set(count);
                } else if (status == OutboundMessageStatus.FAILED) {
                    deadLetterQueueSize.set(count);
                }
            }

            for (MessageChannel channel : MessageChannel.values()) {
                String channelKey = channel.name().toLowerCase();

                long queuedCount =
                        outboundMessageRepository.countByStatusAndChannel(
                                OutboundMessageStatus.QUEUED, channel);
                AtomicLong queueGauge = queueDepthByChannel.get(channelKey);
                if (queueGauge != null) {
                    queueGauge.set(queuedCount);
                }

                long retryCount =
                        outboundMessageRepository.countByChannelAndAttemptCountGreaterThan(
                                channel, 0);
                AtomicLong retryGauge = retryCountsByChannel.get(channelKey);
                if (retryGauge != null) {
                    retryGauge.set(retryCount);
                }
            }

            logger.debug(
                    "Updated outbound message metrics: totalQueued={}, deadLetter={}",
                    totalQueuedMessages.get(),
                    deadLetterQueueSize.get());

        } catch (Exception e) {
            logger.error("Error updating outbound message metrics", e);
        }
    }

    private void updateQueueDepthMetrics() {
        for (OutboundMessageStatus status : OutboundMessageStatus.values()) {
            String statusKey = status.name().toLowerCase();
            long count = outboundMessageRepository.countByStatus(status);
            AtomicLong gauge = queueDepthByStatus.get(statusKey);
            if (gauge != null) {
                gauge.set(count);
            }

            if (status == OutboundMessageStatus.QUEUED) {
                totalQueuedMessages.set(count);
            } else if (status == OutboundMessageStatus.FAILED) {
                deadLetterQueueSize.set(count);
            }
        }

        for (MessageChannel channel : MessageChannel.values()) {
            String channelKey = channel.name().toLowerCase();

            long queuedCount =
                    outboundMessageRepository.countByStatusAndChannel(
                            OutboundMessageStatus.QUEUED, channel);
            AtomicLong queueGauge = queueDepthByChannel.get(channelKey);
            if (queueGauge != null) {
                queueGauge.set(queuedCount);
            }

            long retryCount =
                    outboundMessageRepository.countByChannelAndAttemptCountGreaterThan(channel, 0);
            AtomicLong retryGauge = retryCountsByChannel.get(channelKey);
            if (retryGauge != null) {
                retryGauge.set(retryCount);
            }
        }
    }

    private void updateLatencyMetrics() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        for (MessageChannel channel : MessageChannel.values()) {
            String channelKey = channel.name().toLowerCase();

            try {
                List<Double> latencies =
                        outboundAttemptRepository.findDeliveryLatencies(channel, oneHourAgo);
                DistributionSummary summary = latencySummaries.get(channelKey);

                if (summary != null && !latencies.isEmpty()) {
                    for (Double latency : latencies) {
                        summary.record(latency);
                    }
                    logger.debug(
                            "Recorded {} latency samples for channel {}",
                            latencies.size(),
                            channelKey);
                }
            } catch (Exception e) {
                logger.debug(
                        "Error updating latency metrics for channel {}: {}",
                        channelKey,
                        e.getMessage());
            }
        }
    }

    private void updateWhatsAppQuotaMetrics() {
        try {
            whatsAppRateLimitRepository.findAll().stream()
                    .findFirst()
                    .ifPresent(
                            rateLimit -> {
                                long used = rateLimit.getMessagesSentCount();
                                long limit = rateLimit.getQuotaLimit();
                                long remaining = Math.max(0, limit - used);

                                whatsappQuotaUsed.set(used);
                                whatsappQuotaLimit.set(limit);
                                whatsappQuotaRemaining.set(remaining);
                            });
        } catch (Exception e) {
            logger.debug("Error updating WhatsApp quota metrics: {}", e.getMessage());
        }
    }

    private void updateSessionWindowExpirationMetrics() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<WhatsAppSessionWindow> activeWindows =
                    whatsAppSessionWindowRepository.findActiveWindows(now);

            for (MessageChannel channel : MessageChannel.values()) {
                String channelKey = channel.name().toLowerCase();
                AtomicLong expirationGauge = sessionWindowExpirationSeconds.get(channelKey);

                if (expirationGauge != null) {
                    if (channel == MessageChannel.WHATSAPP && !activeWindows.isEmpty()) {
                        long totalSecondsUntilExpiry = 0;
                        int count = 0;

                        for (WhatsAppSessionWindow window : activeWindows) {
                            if (window.isWithinWindow()) {
                                long secondsUntilExpiration =
                                        Duration.between(now, window.getWindowExpiresAt())
                                                .getSeconds();
                                if (secondsUntilExpiration > 0) {
                                    totalSecondsUntilExpiry += secondsUntilExpiration;
                                    count++;
                                }
                            }
                        }

                        long avgSeconds = count > 0 ? totalSecondsUntilExpiry / count : 0;
                        expirationGauge.set(Math.max(0, avgSeconds));

                        logger.debug(
                                "Updated session window expiration for channel {}: {} seconds"
                                        + " (active windows: {})",
                                channelKey,
                                avgSeconds,
                                count);
                    } else {
                        expirationGauge.set(0);
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("Error updating session window expiration metrics: {}", e.getMessage());
        }
    }

    private void updateSLALatencyHistograms() {
        try {
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

            for (MessageChannel channel : MessageChannel.values()) {
                String channelKey = channel.name().toLowerCase();

                List<OutboundMessageEntity> recentMessages =
                        outboundMessageRepository.findByChannelAndCreatedAtAfter(
                                channel, oneHourAgo, PageRequest.of(0, 1000));

                DistributionSummary sendLatency = sendLatencyHistograms.get(channelKey);
                DistributionSummary deliveredLatency = deliveredLatencyHistograms.get(channelKey);
                DistributionSummary readLatency = readLatencyHistograms.get(channelKey);

                for (OutboundMessageEntity msg : recentMessages) {
                    if (msg.getSentAt() != null && sendLatency != null) {
                        long seconds =
                                Duration.between(msg.getCreatedAt(), msg.getSentAt()).getSeconds();
                        if (seconds >= 0) {
                            sendLatency.record(seconds);
                        }
                    }

                    if (msg.getDeliveredAt() != null && deliveredLatency != null) {
                        long seconds =
                                Duration.between(msg.getCreatedAt(), msg.getDeliveredAt())
                                        .getSeconds();
                        if (seconds >= 0) {
                            deliveredLatency.record(seconds);
                        }
                    }

                    if (msg.getReadAt() != null && readLatency != null) {
                        long seconds =
                                Duration.between(msg.getCreatedAt(), msg.getReadAt()).getSeconds();
                        if (seconds >= 0) {
                            readLatency.record(seconds);
                        }
                    }
                }

                logger.debug(
                        "Updated SLA latency histograms for channel {}: {} messages processed",
                        channelKey,
                        recentMessages.size());
            }

        } catch (Exception e) {
            logger.debug("Error updating SLA latency histograms: {}", e.getMessage());
        }
    }

    @Scheduled(fixedDelayString = "${outbound.metrics.stuck-check-interval-ms:60000}")
    public void checkStuckSendingMessages() {
        try {
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            long stuckCount =
                    outboundMessageRepository.countByStatusAndUpdatedAtBefore(
                            OutboundMessageStatus.SENDING, fiveMinutesAgo);
            stuckSendingMessagesCount.set(stuckCount);

            if (stuckCount > 0) {
                logger.warn(
                        "Found {} messages stuck in SENDING status for more than 5 minutes",
                        stuckCount);
            }

        } catch (Exception e) {
            logger.error("Error checking stuck SENDING messages", e);
        }
    }
}
