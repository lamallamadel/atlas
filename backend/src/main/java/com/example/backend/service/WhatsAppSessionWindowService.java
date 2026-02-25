package com.example.backend.service;

import com.example.backend.entity.WhatsAppSessionWindow;
import com.example.backend.repository.WhatsAppSessionWindowRepository;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.annotation.SpanTag;
import java.time.LocalDateTime;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppSessionWindowService {

    private static final Logger logger =
            LoggerFactory.getLogger(WhatsAppSessionWindowService.class);
    private static final int SESSION_WINDOW_HOURS = 24;

    private final WhatsAppSessionWindowRepository sessionWindowRepository;

    public WhatsAppSessionWindowService(WhatsAppSessionWindowRepository sessionWindowRepository) {
        this.sessionWindowRepository = sessionWindowRepository;
    }

    @Transactional
    public void updateSessionWindow(
            String orgId, String phoneNumber, LocalDateTime inboundMessageTime) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        Optional<WhatsAppSessionWindow> existingSession =
                sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, normalizedPhone);

        if (existingSession.isPresent()) {
            WhatsAppSessionWindow session = existingSession.get();
            session.setLastInboundMessageAt(inboundMessageTime);
            session.setWindowOpensAt(inboundMessageTime);
            session.setWindowExpiresAt(inboundMessageTime.plusHours(SESSION_WINDOW_HOURS));
            sessionWindowRepository.save(session);
            logger.debug(
                    "Updated session window for orgId={}, phone={}, expiresAt={}",
                    orgId,
                    normalizedPhone,
                    session.getWindowExpiresAt());
        } else {
            WhatsAppSessionWindow session = new WhatsAppSessionWindow();
            session.setOrgId(orgId);
            session.setPhoneNumber(normalizedPhone);
            session.setLastInboundMessageAt(inboundMessageTime);
            session.setWindowOpensAt(inboundMessageTime);
            session.setWindowExpiresAt(inboundMessageTime.plusHours(SESSION_WINDOW_HOURS));
            sessionWindowRepository.save(session);
            logger.debug(
                    "Created new session window for orgId={}, phone={}, expiresAt={}",
                    orgId,
                    normalizedPhone,
                    session.getWindowExpiresAt());
        }
    }

    @Transactional
    public void recordOutboundMessage(String orgId, String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        Optional<WhatsAppSessionWindow> session =
                sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, normalizedPhone);

        if (session.isPresent()) {
            WhatsAppSessionWindow window = session.get();
            window.setLastOutboundMessageAt(LocalDateTime.now());
            sessionWindowRepository.save(window);
        }
    }

    @Transactional(readOnly = true)
    @Observed(name = "whatsapp.session.check", contextualName = "whatsapp-session-window-check")
    public boolean isWithinSessionWindow(
            @SpanTag("org.id") String orgId, @SpanTag("phone.number") String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        Optional<WhatsAppSessionWindow> session =
                sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, normalizedPhone);

        if (session.isEmpty()) {
            logger.debug("No session window found for orgId={}, phone={}", orgId, normalizedPhone);
            return false;
        }

        WhatsAppSessionWindow window = session.get();
        boolean withinWindow = window.isWithinWindow();

        logger.debug(
                "Session window check for orgId={}, phone={}: withinWindow={}, expiresAt={}",
                orgId,
                normalizedPhone,
                withinWindow,
                window.getWindowExpiresAt());

        return withinWindow;
    }

    @Transactional(readOnly = true)
    public Optional<LocalDateTime> getSessionWindowExpiry(String orgId, String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        return sessionWindowRepository
                .findByOrgIdAndPhoneNumber(orgId, normalizedPhone)
                .map(WhatsAppSessionWindow::getWindowExpiresAt);
    }

    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void cleanupExpiredSessions() {
        LocalDateTime cutoffTime = LocalDateTime.now();
        logger.info("Cleaning up expired WhatsApp session windows before {}", cutoffTime);
        sessionWindowRepository.deleteExpiredSessions(cutoffTime);
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }

        String normalized = phoneNumber.replaceAll("[^0-9+]", "");

        if (!normalized.startsWith("+")) {
            normalized = "+" + normalized;
        }

        return normalized;
    }
}
