package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.observability.MetricsService;
import com.example.backend.repository.OutboundAttemptRepository;
import com.example.backend.repository.OutboundMessageRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class OutboundMessageAlertService {

    private static final Logger logger = LoggerFactory.getLogger(OutboundMessageAlertService.class);

    private final OutboundMessageRepository outboundMessageRepository;
    private final OutboundAttemptRepository outboundAttemptRepository;
    private final MetricsService metricsService;
    private final RestTemplate restTemplate;
    private final BasicEmailProvider emailProvider;

    @Value("${outbound.alert.stuck-message-threshold-attempts:3}")
    private int stuckMessageThresholdAttempts;

    @Value("${outbound.alert.stuck-message-age-hours:2}")
    private int stuckMessageAgeHours;

    @Value("${outbound.alert.enabled:true}")
    private boolean alertEnabled;

    @Value("${outbound.alert.max-results:100}")
    private int maxResults;

    @Value("${outbound.alert.dlq-threshold:100}")
    private int dlqThreshold;

    @Value("${outbound.alert.high-queue-threshold:1000}")
    private int highQueueThreshold;

    @Value("${outbound.alert.failure-rate-threshold:0.30}")
    private double failureRateThreshold;

    @Value("${outbound.alert.time-window-minutes:60}")
    private int timeWindowMinutes;

    @Value("${outbound.alert.escalation-attempts:5}")
    private int escalationAttempts;

    @Value("${outbound.alert.email.enabled:false}")
    private boolean emailAlertsEnabled;

    @Value("${outbound.alert.email.recipients:}")
    private String emailRecipients;

    @Value("${outbound.alert.slack.enabled:false}")
    private boolean slackAlertsEnabled;

    @Value("${outbound.alert.slack.webhook-url:}")
    private String slackWebhookUrl;

    private final Map<MessageChannel, ChannelHealthMetrics> channelHealthCache = new HashMap<>();
    private volatile OutboundHealthMetrics latestHealthMetrics;

    public OutboundMessageAlertService(
            OutboundMessageRepository outboundMessageRepository,
            OutboundAttemptRepository outboundAttemptRepository,
            MetricsService metricsService,
            RestTemplate restTemplate,
            BasicEmailProvider emailProvider) {
        this.outboundMessageRepository = outboundMessageRepository;
        this.outboundAttemptRepository = outboundAttemptRepository;
        this.metricsService = metricsService;
        this.restTemplate = restTemplate;
        this.emailProvider = emailProvider;
    }

    @Scheduled(cron = "${outbound.alert.cron:0 */15 * * * *}")
    public void checkForStuckMessages() {
        if (!alertEnabled) {
            logger.debug("Stuck message alerts are disabled");
            return;
        }

        try {
            LocalDateTime thresholdTime = LocalDateTime.now().minusHours(stuckMessageAgeHours);

            List<OutboundMessageEntity> stuckQueuedMessages =
                    outboundMessageRepository.findStuckMessages(
                            OutboundMessageStatus.QUEUED,
                            stuckMessageThresholdAttempts,
                            thresholdTime,
                            PageRequest.of(0, maxResults));

            List<OutboundMessageEntity> stuckSendingMessages =
                    outboundMessageRepository.findStuckMessages(
                            OutboundMessageStatus.SENDING,
                            stuckMessageThresholdAttempts,
                            thresholdTime,
                            PageRequest.of(0, maxResults));

            if (!stuckQueuedMessages.isEmpty() || !stuckSendingMessages.isEmpty()) {
                int totalStuck = stuckQueuedMessages.size() + stuckSendingMessages.size();

                String alertMessage =
                        String.format(
                                "ALERT: Found %d stuck outbound messages (threshold: %d attempts, age: %d hours)",
                                totalStuck, stuckMessageThresholdAttempts, stuckMessageAgeHours);

                logger.warn(alertMessage);

                if (!stuckQueuedMessages.isEmpty()) {
                    logger.warn("Stuck QUEUED messages: {}", stuckQueuedMessages.size());
                    for (OutboundMessageEntity msg : stuckQueuedMessages) {
                        logger.warn(
                                "  - Message ID: {}, Channel: {}, Attempts: {}/{}, Age: {} hours, Error: {}",
                                msg.getId(),
                                msg.getChannel(),
                                msg.getAttemptCount(),
                                msg.getMaxAttempts(),
                                Duration.between(msg.getCreatedAt(), LocalDateTime.now()).toHours(),
                                msg.getErrorCode());

                        metricsService
                                .counter(
                                        "outbound_message_stuck_alert_total",
                                        "channel",
                                        msg.getChannel().name().toLowerCase(),
                                        "status",
                                        "queued")
                                .increment();
                    }
                }

                if (!stuckSendingMessages.isEmpty()) {
                    logger.warn("Stuck SENDING messages: {}", stuckSendingMessages.size());
                    for (OutboundMessageEntity msg : stuckSendingMessages) {
                        logger.warn(
                                "  - Message ID: {}, Channel: {}, Attempts: {}/{}, Age: {} hours",
                                msg.getId(),
                                msg.getChannel(),
                                msg.getAttemptCount(),
                                msg.getMaxAttempts(),
                                Duration.between(msg.getCreatedAt(), LocalDateTime.now())
                                        .toHours());

                        metricsService
                                .counter(
                                        "outbound_message_stuck_alert_total",
                                        "channel",
                                        msg.getChannel().name().toLowerCase(),
                                        "status",
                                        "sending")
                                .increment();
                    }
                }

                sendAlert("Stuck Messages Alert", alertMessage, "warning");
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
            long queuedCount =
                    outboundMessageRepository.countByStatus(OutboundMessageStatus.QUEUED);
            long sendingCount =
                    outboundMessageRepository.countByStatus(OutboundMessageStatus.SENDING);
            long totalPending = queuedCount + sendingCount;

            if (totalPending > highQueueThreshold) {
                String alertMessage =
                        String.format(
                                "ALERT: High outbound message queue depth detected - Queued: %d, Sending: %d, Total: %d (threshold: %d)",
                                queuedCount, sendingCount, totalPending, highQueueThreshold);
                logger.warn(alertMessage);
                metricsService.counter("outbound_message_high_queue_depth_alert_total").increment();

                sendAlert("High Queue Depth Alert", alertMessage, "warning");
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
            long failedCount =
                    outboundMessageRepository.countByStatus(OutboundMessageStatus.FAILED);

            if (failedCount > dlqThreshold) {
                String detailedReport = buildDlqReport(failedCount);
                String alertMessage =
                        String.format(
                                "ALERT: Dead letter queue has %d failed messages (threshold: %d)\n\n%s",
                                failedCount, dlqThreshold, detailedReport);
                logger.warn(alertMessage);
                metricsService.counter("outbound_message_dead_letter_alert_total").increment();

                sendAlert("Dead Letter Queue Alert", alertMessage, "critical");
            }

        } catch (Exception e) {
            logger.error("Error checking dead letter queue", e);
            metricsService.counter("outbound_message_alert_error_total").increment();
        }
    }

    private String buildDlqReport(long totalFailed) {
        StringBuilder report = new StringBuilder();
        report.append("DLQ Breakdown:\n");
        report.append("================\n\n");

        List<Object[]> dlqByChannel = outboundMessageRepository.countDlqMessagesByChannel();
        report.append("By Channel:\n");
        for (Object[] row : dlqByChannel) {
            MessageChannel channel = (MessageChannel) row[0];
            Long count = (Long) row[1];
            report.append(String.format("  - %s: %d messages\n", channel.name(), count));
        }

        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        List<Object[]> errorCodes = outboundMessageRepository.countFailuresByErrorCode(last24Hours);
        if (!errorCodes.isEmpty()) {
            report.append("\nTop Error Codes (last 24h):\n");
            int limit = Math.min(5, errorCodes.size());
            for (int i = 0; i < limit; i++) {
                Object[] row = errorCodes.get(i);
                String errorCode = (String) row[0];
                Long count = (Long) row[1];
                report.append(String.format("  - %s: %d occurrences\n", errorCode, count));
            }
        }

        report.append("\nAction Required:\n");
        report.append("  1. Review failed messages in the dashboard\n");
        report.append("  2. Investigate recurring error patterns\n");
        report.append("  3. Consider manual intervention for non-retryable errors\n");

        return report.toString();
    }

    @Scheduled(cron = "${outbound.alert.failure-rate.cron:0 */5 * * * *}")
    public void checkChannelFailureRates() {
        if (!alertEnabled) {
            return;
        }

        try {
            LocalDateTime timeWindowStart = LocalDateTime.now().minusMinutes(timeWindowMinutes);

            for (MessageChannel channel : MessageChannel.values()) {
                ChannelFailureRate failureRate =
                        calculateChannelFailureRate(channel, timeWindowStart);

                if (failureRate.getFailureRate() > failureRateThreshold
                        && failureRate.getTotalMessages() >= 10) {
                    String alertMessage =
                            String.format(
                                    "ALERT: High failure rate for channel %s: %.2f%% (%d failures out of %d messages in last %d minutes)",
                                    channel.name(),
                                    failureRate.getFailureRate() * 100,
                                    failureRate.getFailedMessages(),
                                    failureRate.getTotalMessages(),
                                    timeWindowMinutes);
                    logger.warn(alertMessage);

                    metricsService
                            .counter(
                                    "outbound_message_high_failure_rate_alert_total",
                                    "channel",
                                    channel.name().toLowerCase())
                            .increment();

                    sendAlert("High Failure Rate Alert", alertMessage, "critical");
                }
            }

        } catch (Exception e) {
            logger.error("Error checking channel failure rates", e);
            metricsService.counter("outbound_message_alert_error_total").increment();
        }
    }

    @Scheduled(cron = "${outbound.alert.escalation.cron:0 */20 * * * *}")
    public void checkForEscalation() {
        if (!alertEnabled) {
            return;
        }

        try {
            List<OutboundMessageEntity> messagesNeedingEscalation =
                    outboundMessageRepository.findMessagesNeedingEscalation(
                            OutboundMessageStatus.QUEUED,
                            escalationAttempts,
                            PageRequest.of(0, maxResults));

            if (!messagesNeedingEscalation.isEmpty()) {
                String alertMessage =
                        String.format(
                                "ALERT: %d messages need escalation (exceeded %d delivery attempts)",
                                messagesNeedingEscalation.size(), escalationAttempts);
                logger.error(alertMessage);

                for (OutboundMessageEntity msg : messagesNeedingEscalation) {
                    logger.error(
                            "  - Message ID: {}, Channel: {}, Attempts: {}, Recipient: {}, Error: {}",
                            msg.getId(),
                            msg.getChannel(),
                            msg.getAttemptCount(),
                            msg.getTo(),
                            msg.getErrorCode());

                    metricsService
                            .counter(
                                    "outbound_message_escalation_alert_total",
                                    "channel",
                                    msg.getChannel().name().toLowerCase())
                            .increment();
                }

                sendAlert("Message Escalation Required", alertMessage, "critical");
            }

        } catch (Exception e) {
            logger.error("Error checking for escalation", e);
            metricsService.counter("outbound_message_alert_error_total").increment();
        }
    }

    @Scheduled(fixedDelayString = "${outbound.alert.health-metrics-update-ms:30000}")
    public void updateHealthMetrics() {
        try {
            OutboundHealthMetrics metrics = new OutboundHealthMetrics();

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime windowStart = now.minusMinutes(timeWindowMinutes);

            long queuedCount =
                    outboundMessageRepository.countByStatus(OutboundMessageStatus.QUEUED);
            long sendingCount =
                    outboundMessageRepository.countByStatus(OutboundMessageStatus.SENDING);
            long failedCount =
                    outboundMessageRepository.countByStatus(OutboundMessageStatus.FAILED);

            metrics.setQueuedMessages(queuedCount);
            metrics.setSendingMessages(sendingCount);
            metrics.setDeadLetterQueueSize(failedCount);
            metrics.setTotalPendingMessages(queuedCount + sendingCount);
            metrics.setTimestamp(now);

            Map<String, ChannelHealthMetrics> channelMetrics = new HashMap<>();
            for (MessageChannel channel : MessageChannel.values()) {
                ChannelHealthMetrics channelHealth = calculateChannelHealth(channel, windowStart);
                channelMetrics.put(channel.name(), channelHealth);
                channelHealthCache.put(channel, channelHealth);
            }
            metrics.setChannelMetrics(channelMetrics);

            latestHealthMetrics = metrics;

            metricsService.getRegistry().gauge("outbound_message_queue_depth", queuedCount);
            metricsService.getRegistry().gauge("outbound_message_dlq_size", failedCount);

        } catch (Exception e) {
            logger.error("Error updating health metrics", e);
        }
    }

    public OutboundHealthMetrics getHealthMetrics() {
        if (latestHealthMetrics == null) {
            updateHealthMetrics();
        }
        return latestHealthMetrics;
    }

    public ChannelHealthMetrics getChannelHealth(MessageChannel channel) {
        return channelHealthCache.getOrDefault(channel, new ChannelHealthMetrics());
    }

    private ChannelHealthMetrics calculateChannelHealth(
            MessageChannel channel, LocalDateTime windowStart) {
        ChannelHealthMetrics metrics = new ChannelHealthMetrics();
        metrics.setChannel(channel.name());

        long totalInWindow =
                outboundMessageRepository.countByChannelAndCreatedAtAfter(channel, windowStart);
        long sentInWindow =
                outboundMessageRepository.countByChannelAndStatusAndCreatedAtAfter(
                        channel, OutboundMessageStatus.SENT, windowStart);
        long deliveredInWindow =
                outboundMessageRepository.countByChannelAndStatusAndCreatedAtAfter(
                        channel, OutboundMessageStatus.DELIVERED, windowStart);
        long failedInWindow =
                outboundMessageRepository.countByChannelAndStatusAndCreatedAtAfter(
                        channel, OutboundMessageStatus.FAILED, windowStart);

        metrics.setTotalMessages(totalInWindow);
        metrics.setSentMessages(sentInWindow);
        metrics.setDeliveredMessages(deliveredInWindow);
        metrics.setFailedMessages(failedInWindow);

        if (totalInWindow > 0) {
            metrics.setSuccessRate((double) (sentInWindow + deliveredInWindow) / totalInWindow);
            metrics.setFailureRate((double) failedInWindow / totalInWindow);
        } else {
            metrics.setSuccessRate(1.0);
            metrics.setFailureRate(0.0);
        }

        Double avgLatency = calculateAverageDeliveryLatency(channel, windowStart);
        metrics.setAverageDeliveryLatencySeconds(avgLatency != null ? avgLatency : 0.0);

        return metrics;
    }

    private Double calculateAverageDeliveryLatency(
            MessageChannel channel, LocalDateTime windowStart) {
        var attempts = outboundAttemptRepository.findSuccessfulAttempts(channel, windowStart);
        if (attempts.isEmpty()) {
            return null;
        }

        double totalLatency = 0.0;
        for (var attempt : attempts) {
            Duration duration = Duration.between(attempt.getCreatedAt(), attempt.getUpdatedAt());
            totalLatency += duration.toSeconds();
        }

        return totalLatency / attempts.size();
    }

    private ChannelFailureRate calculateChannelFailureRate(
            MessageChannel channel, LocalDateTime windowStart) {
        long totalMessages =
                outboundMessageRepository.countByChannelAndCreatedAtAfter(channel, windowStart);
        long failedMessages =
                outboundMessageRepository.countByChannelAndStatusAndCreatedAtAfter(
                        channel, OutboundMessageStatus.FAILED, windowStart);

        double failureRate = totalMessages > 0 ? (double) failedMessages / totalMessages : 0.0;

        return new ChannelFailureRate(channel, totalMessages, failedMessages, failureRate);
    }

    private void sendAlert(String title, String message, String severity) {
        try {
            if (emailAlertsEnabled && emailRecipients != null && !emailRecipients.isEmpty()) {
                sendEmailAlert(title, message, severity);
            }

            if (slackAlertsEnabled && slackWebhookUrl != null && !slackWebhookUrl.isEmpty()) {
                sendSlackAlert(title, message, severity);
            }
        } catch (Exception e) {
            logger.error("Error sending alert", e);
        }
    }

    private void sendEmailAlert(String title, String message, String severity) {
        try {
            if (emailRecipients == null || emailRecipients.isEmpty()) {
                logger.debug("Email recipients not configured, skipping email alert");
                return;
            }

            String[] recipients = emailRecipients.split(",");
            for (String recipient : recipients) {
                recipient = recipient.trim();
                if (recipient.isEmpty()) {
                    continue;
                }

                try {
                    com.example.backend.entity.NotificationEntity notification =
                            new com.example.backend.entity.NotificationEntity();
                    notification.setRecipient(recipient);
                    notification.setSubject(
                            "[" + severity.toUpperCase() + "] Outbound Messaging Alert: " + title);

                    String emailBody = buildEmailBody(title, message, severity);
                    java.util.Map<String, Object> variables = new java.util.HashMap<>();
                    variables.put("body", emailBody);
                    notification.setVariables(variables);

                    emailProvider.send(notification);
                    logger.info("Email alert sent to {}: {} - {}", recipient, title, message);
                    metricsService
                            .counter("outbound_alert_email_sent_total", "severity", severity)
                            .increment();
                } catch (Exception e) {
                    logger.error("Failed to send email alert to {}", recipient, e);
                    metricsService.counter("outbound_alert_email_error_total").increment();
                }
            }
        } catch (Exception e) {
            logger.error("Failed to send email alerts", e);
            metricsService.counter("outbound_alert_email_error_total").increment();
        }
    }

    private String buildEmailBody(String title, String message, String severity) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".alert-box { padding: 20px; margin: 20px 0; border-left: 5px solid; }");
        html.append(".alert-critical { background-color: #fee; border-left-color: #c00; }");
        html.append(".alert-warning { background-color: #ffc; border-left-color: #f90; }");
        html.append(".alert-good { background-color: #efe; border-left-color: #0a0; }");
        html.append(".title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }");
        html.append(".message { font-size: 14px; white-space: pre-wrap; }");
        html.append(".footer { margin-top: 30px; font-size: 12px; color: #666; }");
        html.append("</style></head><body>");

        String alertClass =
                switch (severity) {
                    case "critical" -> "alert-critical";
                    case "warning" -> "alert-warning";
                    default -> "alert-good";
                };

        html.append("<div class='alert-box ").append(alertClass).append("'>");
        html.append("<div class='title'>").append(escapeHtml(title)).append("</div>");
        html.append("<div class='message'>").append(escapeHtml(message)).append("</div>");
        html.append("</div>");
        html.append("<div class='footer'>");
        html.append("Severity: ").append(severity.toUpperCase()).append("<br>");
        html.append("Timestamp: ").append(LocalDateTime.now().toString()).append("<br>");
        html.append("This is an automated alert from the Outbound Messaging System.");
        html.append("</div>");
        html.append("</body></html>");

        return html.toString();
    }

    private String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private void sendSlackAlert(String title, String message, String severity) {
        try {
            String color =
                    switch (severity) {
                        case "critical" -> "danger";
                        case "warning" -> "warning";
                        default -> "good";
                    };

            Map<String, Object> payload = new HashMap<>();
            payload.put("text", title);

            Map<String, Object> attachment = new HashMap<>();
            attachment.put("color", color);
            attachment.put("text", message);
            attachment.put("ts", System.currentTimeMillis() / 1000);

            payload.put("attachments", List.of(attachment));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(slackWebhookUrl, request, String.class);

            logger.info("Slack alert sent: {} - {}", title, message);
            metricsService
                    .counter("outbound_alert_slack_sent_total", "severity", severity)
                    .increment();

        } catch (Exception e) {
            logger.error("Failed to send Slack alert", e);
            metricsService.counter("outbound_alert_slack_error_total").increment();
        }
    }

    public static class OutboundHealthMetrics {
        private long queuedMessages;
        private long sendingMessages;
        private long totalPendingMessages;
        private long deadLetterQueueSize;
        private LocalDateTime timestamp;
        private Map<String, ChannelHealthMetrics> channelMetrics;

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

        public Map<String, ChannelHealthMetrics> getChannelMetrics() {
            return channelMetrics;
        }

        public void setChannelMetrics(Map<String, ChannelHealthMetrics> channelMetrics) {
            this.channelMetrics = channelMetrics;
        }
    }

    public static class ChannelHealthMetrics {
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

    private static class ChannelFailureRate {
        private final MessageChannel channel;
        private final long totalMessages;
        private final long failedMessages;
        private final double failureRate;

        public ChannelFailureRate(
                MessageChannel channel,
                long totalMessages,
                long failedMessages,
                double failureRate) {
            this.channel = channel;
            this.totalMessages = totalMessages;
            this.failedMessages = failedMessages;
            this.failureRate = failureRate;
        }

        public MessageChannel getChannel() {
            return channel;
        }

        public long getTotalMessages() {
            return totalMessages;
        }

        public long getFailedMessages() {
            return failedMessages;
        }

        public double getFailureRate() {
            return failureRate;
        }
    }
}
