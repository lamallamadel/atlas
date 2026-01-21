package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ObservabilityMetricsResponse {

    private QueueMetrics queueMetrics;
    private LatencyMetrics latencyMetrics;
    private FailureMetrics failureMetrics;
    private DlqMetrics dlqMetrics;
    private QuotaMetrics quotaMetrics;
    private LocalDateTime timestamp;

    public static class QueueMetrics {
        private Map<String, Long> queueDepthByChannel;
        private Long totalQueued;

        public Map<String, Long> getQueueDepthByChannel() {
            return queueDepthByChannel;
        }

        public void setQueueDepthByChannel(Map<String, Long> queueDepthByChannel) {
            this.queueDepthByChannel = queueDepthByChannel;
        }

        public Long getTotalQueued() {
            return totalQueued;
        }

        public void setTotalQueued(Long totalQueued) {
            this.totalQueued = totalQueued;
        }
    }

    public static class LatencyMetrics {
        private Map<String, LatencyPercentiles> latencyByChannel;

        public Map<String, LatencyPercentiles> getLatencyByChannel() {
            return latencyByChannel;
        }

        public void setLatencyByChannel(Map<String, LatencyPercentiles> latencyByChannel) {
            this.latencyByChannel = latencyByChannel;
        }
    }

    public static class LatencyPercentiles {
        private Double p50;
        private Double p95;
        private Double p99;
        private Double average;

        public Double getP50() {
            return p50;
        }

        public void setP50(Double p50) {
            this.p50 = p50;
        }

        public Double getP95() {
            return p95;
        }

        public void setP95(Double p95) {
            this.p95 = p95;
        }

        public Double getP99() {
            return p99;
        }

        public void setP99(Double p99) {
            this.p99 = p99;
        }

        public Double getAverage() {
            return average;
        }

        public void setAverage(Double average) {
            this.average = average;
        }
    }

    public static class FailureMetrics {
        private Map<String, Long> failuresByChannel;
        private Map<String, Long> failuresByErrorCode;
        private List<TimeSeriesDataPointDto> failureTrend;
        private Double overallFailureRate;

        public Map<String, Long> getFailuresByChannel() {
            return failuresByChannel;
        }

        public void setFailuresByChannel(Map<String, Long> failuresByChannel) {
            this.failuresByChannel = failuresByChannel;
        }

        public Map<String, Long> getFailuresByErrorCode() {
            return failuresByErrorCode;
        }

        public void setFailuresByErrorCode(Map<String, Long> failuresByErrorCode) {
            this.failuresByErrorCode = failuresByErrorCode;
        }

        public List<TimeSeriesDataPointDto> getFailureTrend() {
            return failureTrend;
        }

        public void setFailureTrend(List<TimeSeriesDataPointDto> failureTrend) {
            this.failureTrend = failureTrend;
        }

        public Double getOverallFailureRate() {
            return overallFailureRate;
        }

        public void setOverallFailureRate(Double overallFailureRate) {
            this.overallFailureRate = overallFailureRate;
        }
    }

    public static class DlqMetrics {
        private Long dlqSize;
        private Map<String, Long> dlqSizeByChannel;
        private List<DlqMessage> recentDlqMessages;
        private Boolean alertThresholdExceeded;
        private Long alertThreshold;

        public Long getDlqSize() {
            return dlqSize;
        }

        public void setDlqSize(Long dlqSize) {
            this.dlqSize = dlqSize;
        }

        public Map<String, Long> getDlqSizeByChannel() {
            return dlqSizeByChannel;
        }

        public void setDlqSizeByChannel(Map<String, Long> dlqSizeByChannel) {
            this.dlqSizeByChannel = dlqSizeByChannel;
        }

        public List<DlqMessage> getRecentDlqMessages() {
            return recentDlqMessages;
        }

        public void setRecentDlqMessages(List<DlqMessage> recentDlqMessages) {
            this.recentDlqMessages = recentDlqMessages;
        }

        public Boolean getAlertThresholdExceeded() {
            return alertThresholdExceeded;
        }

        public void setAlertThresholdExceeded(Boolean alertThresholdExceeded) {
            this.alertThresholdExceeded = alertThresholdExceeded;
        }

        public Long getAlertThreshold() {
            return alertThreshold;
        }

        public void setAlertThreshold(Long alertThreshold) {
            this.alertThreshold = alertThreshold;
        }
    }

    public static class DlqMessage {
        private Long messageId;
        private String channel;
        private String errorCode;
        private String errorMessage;
        private Integer attemptCount;
        private LocalDateTime lastAttemptAt;

        public Long getMessageId() {
            return messageId;
        }

        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }

        public String getChannel() {
            return channel;
        }

        public void setChannel(String channel) {
            this.channel = channel;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public void setErrorCode(String errorCode) {
            this.errorCode = errorCode;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public Integer getAttemptCount() {
            return attemptCount;
        }

        public void setAttemptCount(Integer attemptCount) {
            this.attemptCount = attemptCount;
        }

        public LocalDateTime getLastAttemptAt() {
            return lastAttemptAt;
        }

        public void setLastAttemptAt(LocalDateTime lastAttemptAt) {
            this.lastAttemptAt = lastAttemptAt;
        }
    }

    public static class QuotaMetrics {
        private Map<String, QuotaUsage> quotaByChannel;

        public Map<String, QuotaUsage> getQuotaByChannel() {
            return quotaByChannel;
        }

        public void setQuotaByChannel(Map<String, QuotaUsage> quotaByChannel) {
            this.quotaByChannel = quotaByChannel;
        }
    }

    public static class QuotaUsage {
        private Long used;
        private Long limit;
        private Double usagePercentage;
        private String period;

        public Long getUsed() {
            return used;
        }

        public void setUsed(Long used) {
            this.used = used;
        }

        public Long getLimit() {
            return limit;
        }

        public void setLimit(Long limit) {
            this.limit = limit;
        }

        public Double getUsagePercentage() {
            return usagePercentage;
        }

        public void setUsagePercentage(Double usagePercentage) {
            this.usagePercentage = usagePercentage;
        }

        public String getPeriod() {
            return period;
        }

        public void setPeriod(String period) {
            this.period = period;
        }
    }

    public QueueMetrics getQueueMetrics() {
        return queueMetrics;
    }

    public void setQueueMetrics(QueueMetrics queueMetrics) {
        this.queueMetrics = queueMetrics;
    }

    public LatencyMetrics getLatencyMetrics() {
        return latencyMetrics;
    }

    public void setLatencyMetrics(LatencyMetrics latencyMetrics) {
        this.latencyMetrics = latencyMetrics;
    }

    public FailureMetrics getFailureMetrics() {
        return failureMetrics;
    }

    public void setFailureMetrics(FailureMetrics failureMetrics) {
        this.failureMetrics = failureMetrics;
    }

    public DlqMetrics getDlqMetrics() {
        return dlqMetrics;
    }

    public void setDlqMetrics(DlqMetrics dlqMetrics) {
        this.dlqMetrics = dlqMetrics;
    }

    public QuotaMetrics getQuotaMetrics() {
        return quotaMetrics;
    }

    public void setQuotaMetrics(QuotaMetrics quotaMetrics) {
        this.quotaMetrics = quotaMetrics;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
