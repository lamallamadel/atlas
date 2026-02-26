package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.OutboundMessageRepository;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuotaExceededHandler {

    private static final Logger logger = LoggerFactory.getLogger(QuotaExceededHandler.class);

    private final OutboundMessageRepository outboundMessageRepository;

    public QuotaExceededHandler(OutboundMessageRepository outboundMessageRepository) {
        this.outboundMessageRepository = outboundMessageRepository;
    }

    @Transactional
    public void handleQuotaExceeded(
            OutboundMessageEntity message, LocalDateTime nextWindowResetAt) {
        message.setStatus(OutboundMessageStatus.THROTTLED);
        message.setErrorCode("QUOTA_EXCEEDED");
        message.setErrorMessage(
                String.format(
                        "WhatsApp quota exceeded for organization. Message will be retried after quota reset at %s",
                        nextWindowResetAt));
        outboundMessageRepository.save(message);

        logger.warn(
                "Message {} throttled due to quota exceeded for orgId={}. Next window reset at: {}",
                message.getId(),
                message.getOrgId(),
                nextWindowResetAt);
    }

    @Transactional
    public void requeueThrottledMessages(String orgId) {
        logger.info("Requeuing throttled messages for orgId={}", orgId);

        outboundMessageRepository
                .findByOrgIdAndStatus(orgId, OutboundMessageStatus.THROTTLED)
                .forEach(
                        message -> {
                            message.setStatus(OutboundMessageStatus.QUEUED);
                            message.setErrorCode(null);
                            message.setErrorMessage(null);
                            outboundMessageRepository.save(message);
                            logger.debug(
                                    "Requeued message {} for orgId={}", message.getId(), orgId);
                        });
    }
}
