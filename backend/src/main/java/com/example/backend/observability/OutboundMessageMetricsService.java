package com.example.backend.observability;

import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.OutboundAttemptRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.repository.WhatsAppRateLimitRepository;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class OutboundMessageMetricsService {

    private static final Logger logger =
            LoggerFactory.getLogger(OutboundMessageMetricsService.class);

    private final OutboundMessageRepository outboundMessageRepository;
    private final OutboundAttemptRepository outboundAttemptRepository;
    private final WhatsAppRateLimitRepository whatsAppRateLimitRepository;
    private final MeterRegistry registry;

    private final Map<String, AtomicLong> queueDepthByStatus = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> queueDepthByChannel = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> retryCountsByChannel = new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> latencySummaries = new ConcurrentHashMap<>();
    private final AtomicLong deadLetterQueueSize = new AtomicLong(0);
    private final AtomicLong totalQueuedMessages = new AtomicLong(0);
    private final AtomicLong whatsappQuotaUsed = new AtomicLong(0);
    private final AtomicLong whatsappQuotaLimit = new AtomicLong(1000);
    private final AtomicLong whatsappQuotaRemaining = new AtomicLong(1000);

    public OutboundMessageMetricsService(
            OutboundMessageRepository outboundMessageRepository,
            OutboundAttemptRepository outboundAttemptRepository,
            WhatsAppRateLimitRepository whatsAppRateLimitRepository,
            MeterRegistry registry) {

        this.outboundMessageRepository = outboundMessageRepository;
        this.outboundAttemptRepository = outboundAttemptRepository;
        this.whatsAppRateLimitRepository = whatsAppRateLimitRepository;
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

        logger.info("Initialized outbound message metrics gauges and histograms");
    }

    @Scheduled(fixedDelayString = "${outbound.metrics.update-interval-ms:10000}")
    public void updateMetrics() {
        try {

            updateQueueDepthMetrics();
            updateLatencyMetrics();
            updateWhatsAppQuotaMetrics();

            logger.debug(
                    "Updated outbound message metrics: totalQueued={}, deadLetter={}, whatsappQuotaUsed={}/{}",
                    totalQueuedMessages.get(),
                    deadLetterQueueSize.get(),
                    whatsappQuotaUsed.get(),
                    whatsappQuotaLimit.get());

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
}
