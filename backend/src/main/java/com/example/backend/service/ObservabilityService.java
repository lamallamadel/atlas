package com.example.backend.service;

import com.example.backend.dto.ObservabilityMetricsResponse;
import com.example.backend.dto.TimeSeriesDataPointDto;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.RateLimitTier;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.OutboundAttemptRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.repository.RateLimitTierRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ObservabilityService {

    private static final long DLQ_ALERT_THRESHOLD = 100L;
    private static final int RECENT_DLQ_LIMIT = 10;

    private final OutboundMessageRepository messageRepository;
    private final OutboundAttemptRepository attemptRepository;
    private final RateLimitTierRepository rateLimitTierRepository;

    public ObservabilityService(
            OutboundMessageRepository messageRepository,
            OutboundAttemptRepository attemptRepository,
            RateLimitTierRepository rateLimitTierRepository) {
        this.messageRepository = messageRepository;
        this.attemptRepository = attemptRepository;
        this.rateLimitTierRepository = rateLimitTierRepository;
    }

    public ObservabilityMetricsResponse getObservabilityMetrics(LocalDateTime from, LocalDateTime to, String orgId) {
        if (from == null) {
            from = LocalDateTime.now().minusHours(24);
        }
        if (to == null) {
            to = LocalDateTime.now();
        }

        ObservabilityMetricsResponse response = new ObservabilityMetricsResponse();
        response.setTimestamp(LocalDateTime.now());

        response.setQueueMetrics(buildQueueMetrics());
        response.setLatencyMetrics(buildLatencyMetrics(from));
        response.setFailureMetrics(buildFailureMetrics(from, to));
        response.setDlqMetrics(buildDlqMetrics());
        response.setQuotaMetrics(buildQuotaMetrics(from, orgId));

        return response;
    }

    private ObservabilityMetricsResponse.QueueMetrics buildQueueMetrics() {
        ObservabilityMetricsResponse.QueueMetrics metrics = new ObservabilityMetricsResponse.QueueMetrics();

        List<Object[]> queuedByChannel = messageRepository.countByStatusGroupByChannel(OutboundMessageStatus.QUEUED);
        Map<String, Long> queueDepthMap = new HashMap<>();
        long totalQueued = 0;

        for (Object[] row : queuedByChannel) {
            MessageChannel channel = (MessageChannel) row[0];
            Long count = (Long) row[1];
            queueDepthMap.put(channel.name(), count);
            totalQueued += count;
        }

        for (MessageChannel channel : MessageChannel.values()) {
            queueDepthMap.putIfAbsent(channel.name(), 0L);
        }

        metrics.setQueueDepthByChannel(queueDepthMap);
        metrics.setTotalQueued(totalQueued);

        return metrics;
    }

    private ObservabilityMetricsResponse.LatencyMetrics buildLatencyMetrics(LocalDateTime from) {
        ObservabilityMetricsResponse.LatencyMetrics metrics = new ObservabilityMetricsResponse.LatencyMetrics();
        Map<String, ObservabilityMetricsResponse.LatencyPercentiles> latencyMap = new HashMap<>();

        for (MessageChannel channel : MessageChannel.values()) {
            List<Double> latencies = attemptRepository.findDeliveryLatencies(channel, from);

            ObservabilityMetricsResponse.LatencyPercentiles percentiles = new ObservabilityMetricsResponse.LatencyPercentiles();

            if (!latencies.isEmpty()) {
                Collections.sort(latencies);
                int size = latencies.size();

                percentiles.setP50(calculatePercentile(latencies, 50));
                percentiles.setP95(calculatePercentile(latencies, 95));
                percentiles.setP99(calculatePercentile(latencies, 99));

                double sum = latencies.stream().mapToDouble(Double::doubleValue).sum();
                percentiles.setAverage(sum / size);
            } else {
                percentiles.setP50(0.0);
                percentiles.setP95(0.0);
                percentiles.setP99(0.0);
                percentiles.setAverage(0.0);
            }

            latencyMap.put(channel.name(), percentiles);
        }

        metrics.setLatencyByChannel(latencyMap);
        return metrics;
    }

    private Double calculatePercentile(List<Double> sortedValues, int percentile) {
        if (sortedValues.isEmpty()) {
            return 0.0;
        }
        int index = (int) Math.ceil(percentile / 100.0 * sortedValues.size()) - 1;
        index = Math.max(0, Math.min(index, sortedValues.size() - 1));
        return sortedValues.get(index);
    }

    private ObservabilityMetricsResponse.FailureMetrics buildFailureMetrics(LocalDateTime from, LocalDateTime to) {
        ObservabilityMetricsResponse.FailureMetrics metrics = new ObservabilityMetricsResponse.FailureMetrics();

        List<Object[]> failuresByChannel = messageRepository.countByStatusAndCreatedAtAfterGroupByChannel(
                OutboundMessageStatus.FAILED, from);
        Map<String, Long> failuresMap = new HashMap<>();
        long totalFailures = 0;

        for (Object[] row : failuresByChannel) {
            MessageChannel channel = (MessageChannel) row[0];
            Long count = (Long) row[1];
            failuresMap.put(channel.name(), count);
            totalFailures += count;
        }

        for (MessageChannel channel : MessageChannel.values()) {
            failuresMap.putIfAbsent(channel.name(), 0L);
        }

        metrics.setFailuresByChannel(failuresMap);

        List<Object[]> failuresByError = messageRepository.countFailuresByErrorCode(from);
        Map<String, Long> errorCodeMap = new HashMap<>();
        for (Object[] row : failuresByError) {
            String errorCode = (String) row[0];
            Long count = (Long) row[1];
            errorCodeMap.put(errorCode != null ? errorCode : "UNKNOWN", count);
        }
        metrics.setFailuresByErrorCode(errorCodeMap);

        List<Object[]> failureTrend = messageRepository.countFailuresTrendByDate(from);
        List<TimeSeriesDataPointDto> trendData = new ArrayList<>();
        for (Object[] row : failureTrend) {
            LocalDate date = (LocalDate) row[0];
            Long count = (Long) row[1];
            TimeSeriesDataPointDto point = new TimeSeriesDataPointDto();
            point.setDate(date);
            point.setValue(count);
            trendData.add(point);
        }
        metrics.setFailureTrend(trendData);

        long totalMessages = messageRepository.countByStatusAndCreatedAtAfter(OutboundMessageStatus.SENT, from)
                + messageRepository.countByStatusAndCreatedAtAfter(OutboundMessageStatus.DELIVERED, from)
                + totalFailures;

        double failureRate = totalMessages > 0 ? (totalFailures * 100.0 / totalMessages) : 0.0;
        metrics.setOverallFailureRate(failureRate);

        return metrics;
    }

    private ObservabilityMetricsResponse.DlqMetrics buildDlqMetrics() {
        ObservabilityMetricsResponse.DlqMetrics metrics = new ObservabilityMetricsResponse.DlqMetrics();

        List<OutboundMessageEntity> dlqMessages = messageRepository.findDlqMessages(
                PageRequest.of(0, RECENT_DLQ_LIMIT));

        metrics.setDlqSize((long) dlqMessages.size());

        List<Object[]> dlqByChannel = messageRepository.countDlqMessagesByChannel();
        Map<String, Long> dlqChannelMap = new HashMap<>();
        for (Object[] row : dlqByChannel) {
            MessageChannel channel = (MessageChannel) row[0];
            Long count = (Long) row[1];
            dlqChannelMap.put(channel.name(), count);
        }

        for (MessageChannel channel : MessageChannel.values()) {
            dlqChannelMap.putIfAbsent(channel.name(), 0L);
        }

        metrics.setDlqSizeByChannel(dlqChannelMap);

        List<ObservabilityMetricsResponse.DlqMessage> recentMessages = dlqMessages.stream()
                .map(this::convertToDlqMessage)
                .collect(Collectors.toList());
        metrics.setRecentDlqMessages(recentMessages);

        metrics.setAlertThreshold(DLQ_ALERT_THRESHOLD);
        metrics.setAlertThresholdExceeded(metrics.getDlqSize() > DLQ_ALERT_THRESHOLD);

        return metrics;
    }

    private ObservabilityMetricsResponse.DlqMessage convertToDlqMessage(OutboundMessageEntity entity) {
        ObservabilityMetricsResponse.DlqMessage dlqMessage = new ObservabilityMetricsResponse.DlqMessage();
        dlqMessage.setMessageId(entity.getId());
        dlqMessage.setChannel(entity.getChannel().name());
        dlqMessage.setErrorCode(entity.getErrorCode());
        dlqMessage.setErrorMessage(entity.getErrorMessage());
        dlqMessage.setAttemptCount(entity.getAttemptCount());
        dlqMessage.setLastAttemptAt(entity.getUpdatedAt());
        return dlqMessage;
    }

    private ObservabilityMetricsResponse.QuotaMetrics buildQuotaMetrics(LocalDateTime from, String orgId) {
        ObservabilityMetricsResponse.QuotaMetrics metrics = new ObservabilityMetricsResponse.QuotaMetrics();
        Map<String, ObservabilityMetricsResponse.QuotaUsage> quotaMap = new HashMap<>();

        RateLimitTier tier = null;
        if (orgId != null) {
            tier = rateLimitTierRepository.findByOrgId(orgId).orElse(null);
        }

        for (MessageChannel channel : MessageChannel.values()) {
            long used = messageRepository.countByChannelAndCreatedAtAfter(channel, from);

            ObservabilityMetricsResponse.QuotaUsage usage = new ObservabilityMetricsResponse.QuotaUsage();
            usage.setUsed(used);

            if (tier != null) {
                long limit = tier.getRequestsPerMinute() * 60L;
                usage.setLimit(limit);
                usage.setUsagePercentage(limit > 0 ? (used * 100.0 / limit) : 0.0);
            } else {
                usage.setLimit(0L);
                usage.setUsagePercentage(0.0);
            }

            usage.setPeriod("last_hour");
            quotaMap.put(channel.name(), usage);
        }

        metrics.setQuotaByChannel(quotaMap);
        return metrics;
    }
}
