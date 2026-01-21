package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class OutboundHealthMetricsDto {
    private long queuedMessages;
    private long sendingMessages;
    private long totalPendingMessages;
    private long deadLetterQueueSize;
    private LocalDateTime timestamp;
    private Map<String, ChannelHealthMetricsDto> channelMetrics;

    public long getQueuedMessages() {
        return queuedMessages;
    }

    public void setQueuedMessages(long queuedMessages) {
        this.queuedMessages = queuedMessages;
    }

    public long getSendingMessages() {
        return sendingMessages;
    }

    public void setSendingMessages(long sendingMessages) {
        this.sendingMessages = sendingMessages;
    }

    public long getTotalPendingMessages() {
        return totalPendingMessages;
    }

    public void setTotalPendingMessages(long totalPendingMessages) {
        this.totalPendingMessages = totalPendingMessages;
    }

    public long getDeadLetterQueueSize() {
        return deadLetterQueueSize;
    }

    public void setDeadLetterQueueSize(long deadLetterQueueSize) {
        this.deadLetterQueueSize = deadLetterQueueSize;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, ChannelHealthMetricsDto> getChannelMetrics() {
        return channelMetrics;
    }

    public void setChannelMetrics(Map<String, ChannelHealthMetricsDto> channelMetrics) {
        this.channelMetrics = channelMetrics;
    }
}
