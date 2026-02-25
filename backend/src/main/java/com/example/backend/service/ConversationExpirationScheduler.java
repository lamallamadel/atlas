package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ConversationExpirationScheduler.class);

    private final ConversationStateManager conversationStateManager;

    public ConversationExpirationScheduler(ConversationStateManager conversationStateManager) {
        this.conversationStateManager = conversationStateManager;
    }

    @Scheduled(cron = "${conversation.expiration.cron:0 0 * * * ?}")
    @Transactional
    public void expireOldConversations() {
        log.info("Running conversation expiration scheduler...");
        try {
            conversationStateManager.expireOldConversations();
            log.info("Successfully expired old conversations");
        } catch (Exception e) {
            log.error("Error expiring old conversations", e);
        }
    }
}
