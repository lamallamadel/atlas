package com.example.backend.service;

import com.example.backend.entity.OutboundAttemptEntity;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.OutboundAttemptStatus;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.observability.MetricsService;
import com.example.backend.repository.OutboundAttemptRepository;
import com.example.backend.repository.OutboundMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OutboundJobWorker {
    
    private static final Logger logger = LoggerFactory.getLogger(OutboundJobWorker.class);
    private static final int[] BACKOFF_MINUTES = {1, 5, 15, 60, 360};
    
    private final OutboundMessageRepository outboundMessageRepository;
    private final OutboundAttemptRepository outboundAttemptRepository;
    private final List<OutboundMessageProvider> providers;
    private final AuditEventService auditEventService;
    private final ActivityService activityService;
    private final MetricsService metricsService;
    
    @Value("${outbound.worker.batch-size:10}")
    private int batchSize;
    
    @Value("${outbound.worker.enabled:true}")
    private boolean enabled;
    
    public OutboundJobWorker(
            OutboundMessageRepository outboundMessageRepository,
            OutboundAttemptRepository outboundAttemptRepository,
            List<OutboundMessageProvider> providers,
            AuditEventService auditEventService,
            ActivityService activityService,
            MetricsService metricsService) {
        this.outboundMessageRepository = outboundMessageRepository;
        this.outboundAttemptRepository = outboundAttemptRepository;
        this.providers = providers;
        this.auditEventService = auditEventService;
        this.activityService = activityService;
        this.metricsService = metricsService;
    }
    
    @Scheduled(fixedDelayString = "${outbound.worker.poll-interval-ms:5000}")
    @Transactional
    public void processPendingMessages() {
        if (!enabled) {
            return;
        }
        
        try {
            recoverStaleMessages();
            
            List<OutboundMessageEntity> messages = outboundMessageRepository.findPendingMessages(
                OutboundMessageStatus.QUEUED,
                PageRequest.of(0, batchSize)
            );
            
            if (messages.isEmpty()) {
                return;
            }
            
            logger.info("Processing {} pending outbound messages", messages.size());
            
            for (OutboundMessageEntity message : messages) {
                try {
                    if (isReadyForProcessing(message)) {
                        processMessage(message);
                    } else {
                        logger.debug("Message {} not ready for processing yet (waiting for retry window)", message.getId());
                    }
                } catch (Exception e) {
                    logger.error("Error processing message {}: {}", message.getId(), e.getMessage(), e);
                }
            }
            
        } catch (Exception e) {
            logger.error("Error in outbound job worker: {}", e.getMessage(), e);
        }
    }

    private void recoverStaleMessages() {
        LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(10);
        List<OutboundMessageEntity> staleMessages = outboundMessageRepository.findStaleMessages(
            OutboundMessageStatus.SENDING,
            staleThreshold,
            PageRequest.of(0, batchSize)
        );
        
        if (!staleMessages.isEmpty()) {
            logger.warn("Recovering {} stale messages stuck in SENDING state", staleMessages.size());
            for (OutboundMessageEntity message : staleMessages) {
                message.setStatus(OutboundMessageStatus.QUEUED);
                message.setUpdatedAt(LocalDateTime.now());
                outboundMessageRepository.save(message);
                logger.info("Recovered stale message {} back to QUEUED", message.getId());
            }
        }
    }

    private boolean isReadyForProcessing(OutboundMessageEntity message) {
        if (message.getAttemptCount() == 0) {
            return true;
        }
        
        List<OutboundAttemptEntity> attempts = outboundAttemptRepository.findByOutboundMessageIdOrderByAttemptNoAsc(message.getId());
        if (attempts.isEmpty()) {
            return true;
        }
        
        OutboundAttemptEntity lastAttempt = attempts.get(attempts.size() - 1);
        if (lastAttempt.getNextRetryAt() == null) {
            return true;
        }
        
        return LocalDateTime.now().isAfter(lastAttempt.getNextRetryAt()) || 
               LocalDateTime.now().isEqual(lastAttempt.getNextRetryAt());
    }
    
    @Transactional
    public void processMessage(OutboundMessageEntity message) {
        logger.debug("Processing outbound message: id={}, attempt={}/{}", 
            message.getId(), message.getAttemptCount() + 1, message.getMaxAttempts());
        
        message.setStatus(OutboundMessageStatus.SENDING);
        message.setAttemptCount(message.getAttemptCount() + 1);
        message.setUpdatedAt(LocalDateTime.now());
        outboundMessageRepository.save(message);
        
        OutboundAttemptEntity attempt = createAttempt(message, OutboundAttemptStatus.TRYING);
        
        try {
            OutboundMessageProvider provider = findProvider(message.getChannel().name());
            
            if (provider == null) {
                String errorMsg = "No provider found for channel: " + message.getChannel();
                logger.error(errorMsg);
                handleFailure(message, attempt, "NO_PROVIDER", errorMsg, false);
                return;
            }
            
            ProviderSendResult result = provider.send(message);
            
            if (result.isSuccess()) {
                handleSuccess(message, attempt, result);
            } else {
                handleFailure(message, attempt, result.getErrorCode(), result.getErrorMessage(), result.isRetryable());
            }
            
        } catch (Exception e) {
            logger.error("Unexpected error processing message {}: {}", message.getId(), e.getMessage(), e);
            handleFailure(message, attempt, "WORKER_ERROR", e.getMessage(), true);
        }
    }
    
    private void handleSuccess(OutboundMessageEntity message, OutboundAttemptEntity attempt, ProviderSendResult result) {
        logger.info("Outbound message sent successfully: id={}, providerMessageId={}", 
            message.getId(), result.getProviderMessageId());
        
        LocalDateTime now = LocalDateTime.now();
        message.setStatus(OutboundMessageStatus.SENT);
        message.setProviderMessageId(result.getProviderMessageId());
        message.setErrorCode(null);
        message.setErrorMessage(null);
        message.setUpdatedAt(now);
        outboundMessageRepository.save(message);
        
        attempt.setStatus(OutboundAttemptStatus.SUCCESS);
        attempt.setProviderResponseJson(result.getResponseData());
        attempt.setUpdatedAt(now);
        outboundAttemptRepository.save(attempt);
        
        String channelName = message.getChannel().name().toLowerCase();
        metricsService.incrementOutboundMessageSendSuccess(channelName);
        
        Duration deliveryLatency = Duration.between(message.getCreatedAt(), now);
        metricsService.recordOutboundMessageDeliveryLatency(channelName, deliveryLatency);
        
        logAuditEvent(message, "SENT", "Message sent successfully");
        logMessageSentActivity(message, result);
    }
    
    private void handleFailure(OutboundMessageEntity message, OutboundAttemptEntity attempt, 
                               String errorCode, String errorMessage, boolean retryable) {
        
        logger.warn("Outbound message failed: id={}, attempt={}/{}, errorCode={}, retryable={}", 
            message.getId(), message.getAttemptCount(), message.getMaxAttempts(), errorCode, retryable);
        
        String channelName = message.getChannel().name().toLowerCase();
        
        attempt.setStatus(OutboundAttemptStatus.FAILED);
        attempt.setErrorCode(errorCode);
        attempt.setErrorMessage(errorMessage);
        
        boolean canRetry = retryable && message.getAttemptCount() < message.getMaxAttempts();
        
        if (canRetry) {
            LocalDateTime nextRetryAt = calculateNextRetry(message.getAttemptCount());
            attempt.setNextRetryAt(nextRetryAt);
            
            message.setStatus(OutboundMessageStatus.QUEUED);
            message.setErrorCode(errorCode);
            message.setErrorMessage(errorMessage);
            
            metricsService.incrementOutboundMessageRetry(channelName);
            
            logger.info("Scheduling retry for message {}: nextRetryAt={}, attempt={}/{}", 
                message.getId(), nextRetryAt, message.getAttemptCount(), message.getMaxAttempts());
        } else {
            message.setStatus(OutboundMessageStatus.FAILED);
            message.setErrorCode(errorCode);
            message.setErrorMessage(errorMessage);
            
            metricsService.incrementOutboundMessageSendFailure(channelName, errorCode != null ? errorCode : "UNKNOWN");
            metricsService.incrementOutboundMessageDeadLetter(channelName);
            
            String reason = !retryable ? "non-retryable error" : "max attempts reached";
            logger.warn("Message {} moved to FAILED: {}", message.getId(), reason);
            
            logAuditEvent(message, "FAILED", String.format("Message failed: %s (%s)", errorMessage, reason));
            logMessageFailedActivity(message, errorCode, errorMessage, reason);
        }
        
        message.setUpdatedAt(LocalDateTime.now());
        outboundMessageRepository.save(message);
        
        attempt.setUpdatedAt(LocalDateTime.now());
        outboundAttemptRepository.save(attempt);
    }
    
    private OutboundAttemptEntity createAttempt(OutboundMessageEntity message, OutboundAttemptStatus status) {
        OutboundAttemptEntity attempt = new OutboundAttemptEntity();
        attempt.setOrgId(message.getOrgId());
        attempt.setOutboundMessage(message);
        attempt.setAttemptNo(message.getAttemptCount());
        attempt.setStatus(status);
        
        LocalDateTime now = LocalDateTime.now();
        attempt.setCreatedAt(now);
        attempt.setUpdatedAt(now);
        
        return outboundAttemptRepository.save(attempt);
    }
    
    private LocalDateTime calculateNextRetry(int attemptCount) {
        int index = Math.min(attemptCount - 1, BACKOFF_MINUTES.length - 1);
        int delayMinutes = BACKOFF_MINUTES[index];
        return LocalDateTime.now().plusMinutes(delayMinutes);
    }
    
    private OutboundMessageProvider findProvider(String channel) {
        for (OutboundMessageProvider provider : providers) {
            if (provider.supports(channel)) {
                return provider;
            }
        }
        return null;
    }
    
    private void logAuditEvent(OutboundMessageEntity message, String action, String details) {
        if (auditEventService != null) {
            try {
                auditEventService.logEvent("OUTBOUND_MESSAGE", message.getId(), action, details);
            } catch (Exception e) {
                logger.warn("Failed to log audit event", e);
            }
        }
    }
    
    private void logMessageSentActivity(OutboundMessageEntity message, ProviderSendResult result) {
        if (activityService != null && message.getDossierId() != null) {
            try {
                String description = String.format("Outbound %s message sent to %s", 
                    message.getChannel(), message.getTo());
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("outboundMessageId", message.getId());
                metadata.put("channel", message.getChannel().name());
                metadata.put("to", message.getTo());
                metadata.put("status", message.getStatus().name());
                metadata.put("providerMessageId", result.getProviderMessageId());
                metadata.put("attemptCount", message.getAttemptCount());
                metadata.put("timestamp", LocalDateTime.now().toString());
                if (message.getTemplateCode() != null) {
                    metadata.put("templateCode", message.getTemplateCode());
                }
                
                activityService.logActivity(
                    message.getDossierId(),
                    ActivityType.MESSAGE_SENT,
                    description,
                    metadata
                );
            } catch (Exception e) {
                logger.warn("Failed to log MESSAGE_SENT activity", e);
            }
        }
    }

    private void logMessageFailedActivity(OutboundMessageEntity message, String errorCode, 
                                         String errorMessage, String reason) {
        if (activityService != null && message.getDossierId() != null) {
            try {
                String description = String.format("Outbound %s message failed: %s", 
                    message.getChannel(), errorCode != null ? errorCode : "UNKNOWN");
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("outboundMessageId", message.getId());
                metadata.put("channel", message.getChannel().name());
                metadata.put("to", message.getTo());
                metadata.put("status", message.getStatus().name());
                metadata.put("errorCode", errorCode);
                metadata.put("errorMessage", errorMessage);
                metadata.put("reason", reason);
                metadata.put("attemptCount", message.getAttemptCount());
                metadata.put("maxAttempts", message.getMaxAttempts());
                metadata.put("timestamp", LocalDateTime.now().toString());
                if (message.getTemplateCode() != null) {
                    metadata.put("templateCode", message.getTemplateCode());
                }
                
                activityService.logActivity(
                    message.getDossierId(),
                    ActivityType.MESSAGE_FAILED,
                    description,
                    metadata
                );
            } catch (Exception e) {
                logger.warn("Failed to log MESSAGE_FAILED activity", e);
            }
        }
    }
}
