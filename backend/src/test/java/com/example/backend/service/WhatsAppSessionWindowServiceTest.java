package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.backend.entity.WhatsAppSessionWindow;
import com.example.backend.repository.WhatsAppSessionWindowRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WhatsAppSessionWindowServiceTest {

    @Mock private WhatsAppSessionWindowRepository sessionWindowRepository;

    @InjectMocks private WhatsAppSessionWindowService service;

    private String orgId = "test-org";
    private String phoneNumber = "+1234567890";
    private LocalDateTime inboundTime;

    @BeforeEach
    void setUp() {
        inboundTime = LocalDateTime.now();
    }

    @Test
    void updateSessionWindow_CreatesNewSession_WhenNoneExists() {
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.empty());

        service.updateSessionWindow(orgId, phoneNumber, inboundTime);

        ArgumentCaptor<WhatsAppSessionWindow> captor =
                ArgumentCaptor.forClass(WhatsAppSessionWindow.class);
        verify(sessionWindowRepository).save(captor.capture());

        WhatsAppSessionWindow saved = captor.getValue();
        assertEquals(orgId, saved.getOrgId());
        assertEquals(phoneNumber, saved.getPhoneNumber());
        assertEquals(inboundTime, saved.getLastInboundMessageAt());
        assertEquals(inboundTime, saved.getWindowOpensAt());
        assertEquals(inboundTime.plusHours(24), saved.getWindowExpiresAt());
    }

    @Test
    void updateSessionWindow_UpdatesExistingSession() {
        WhatsAppSessionWindow existing = new WhatsAppSessionWindow();
        existing.setOrgId(orgId);
        existing.setPhoneNumber(phoneNumber);
        existing.setWindowOpensAt(inboundTime.minusHours(2));
        existing.setWindowExpiresAt(inboundTime.plusHours(22));
        existing.setLastInboundMessageAt(inboundTime.minusHours(2));

        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.of(existing));

        service.updateSessionWindow(orgId, phoneNumber, inboundTime);

        verify(sessionWindowRepository).save(existing);
        assertEquals(inboundTime, existing.getLastInboundMessageAt());
        assertEquals(inboundTime, existing.getWindowOpensAt());
        assertEquals(inboundTime.plusHours(24), existing.getWindowExpiresAt());
    }

    @Test
    void isWithinSessionWindow_ReturnsTrue_WhenSessionActive() {
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setWindowOpensAt(LocalDateTime.now().minusHours(1));
        session.setWindowExpiresAt(LocalDateTime.now().plusHours(23));

        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.of(session));

        boolean result = service.isWithinSessionWindow(orgId, phoneNumber);

        assertTrue(result);
    }

    @Test
    void isWithinSessionWindow_ReturnsFalse_WhenSessionExpired() {
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setWindowOpensAt(LocalDateTime.now().minusHours(25));
        session.setWindowExpiresAt(LocalDateTime.now().minusHours(1));

        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.of(session));

        boolean result = service.isWithinSessionWindow(orgId, phoneNumber);

        assertFalse(result);
    }

    @Test
    void isWithinSessionWindow_ReturnsFalse_WhenNoSession() {
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.empty());

        boolean result = service.isWithinSessionWindow(orgId, phoneNumber);

        assertFalse(result);
    }

    @Test
    void recordOutboundMessage_UpdatesLastOutboundTime() {
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setWindowOpensAt(LocalDateTime.now().minusHours(1));
        session.setWindowExpiresAt(LocalDateTime.now().plusHours(23));

        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.of(session));

        service.recordOutboundMessage(orgId, phoneNumber);

        verify(sessionWindowRepository).save(session);
        assertNotNull(session.getLastOutboundMessageAt());
    }

    @Test
    void getSessionWindowExpiry_ReturnsExpiryTime() {
        LocalDateTime expiry = LocalDateTime.now().plusHours(23);
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setWindowExpiresAt(expiry);

        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.of(session));

        Optional<LocalDateTime> result = service.getSessionWindowExpiry(orgId, phoneNumber);

        assertTrue(result.isPresent());
        assertEquals(expiry, result.get());
    }

    @Test
    void cleanupExpiredSessions_DeletesOldSessions() {
        service.cleanupExpiredSessions();

        verify(sessionWindowRepository).deleteExpiredSessions(any(LocalDateTime.class));
    }

    @Test
    void normalizesPhoneNumbers() {
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(eq(orgId), eq("+1234567890")))
                .thenReturn(Optional.empty());

        service.updateSessionWindow(orgId, "1234567890", inboundTime);

        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(orgId, "+1234567890");
    }
}
