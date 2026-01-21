package com.example.backend.dto;

public class ChannelHealthMetricsDto {
    private String channel;
    private long totalMessages;
    private long sentMessages;
    private long deliveredMessages;
    private long failedMessages;
    private double successRate;
    private double failureRate;
    private double averageDeliveryLatencySeconds;

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public long getTotalMessages() {
        return totalMessages;
    }

    public void setTotalMessages(long totalMessages) {
        this.totalMessages = totalMessages;
    }

    public long getSentMessages() {
        return sentMessages;
    }

    public void setSentMessages(long sentMessages) {
        this.sentMessages = sentMessages;
    }

    public long getDeliveredMessages() {
        return deliveredMessages;
    }

    public void setDeliveredMessages(long deliveredMessages) {
        this.deliveredMessages = deliveredMessages;
    }

    public long getFailedMessages() {
        return failedMessages;
    }

    public void setFailedMessages(long failedMessages) {
        this.failedMessages = failedMessages;
    }

    public double getSuccessRate() {
        return successRate;
    }

    public void setSuccessRate(double successRate) {
        this.successRate = successRate;
    }

    public double getFailureRate() {
        return failureRate;
    }

    public void setFailureRate(double failureRate) {
        this.failureRate = failureRate;
    }

    public double getAverageDeliveryLatencySeconds() {
        return averageDeliveryLatencySeconds;
    }

    public void setAverageDeliveryLatencySeconds(double averageDeliveryLatencySeconds) {
        this.averageDeliveryLatencySeconds = averageDeliveryLatencySeconds;
    }
}
