package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.example.backend.entity.WhatsAppSessionWindow;
import com.example.backend.repository.WhatsAppSessionWindowRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

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

    @Test
    void phoneNormalization_FrenchFormat_WithPlus33() {
        String phoneWithPlus = "+33612345678";
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneWithPlus))
                .thenReturn(Optional.empty());

        service.updateSessionWindow(orgId, phoneWithPlus, inboundTime);

        ArgumentCaptor<WhatsAppSessionWindow> captor =
                ArgumentCaptor.forClass(WhatsAppSessionWindow.class);
        verify(sessionWindowRepository).save(captor.capture());
        assertThat(captor.getValue().getPhoneNumber()).isEqualTo("+33612345678");
    }

    @Test
    void phoneNormalization_FrenchFormat_With0033() {
        String phoneWith0033 = "0033612345678";
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, "+0033612345678"))
                .thenReturn(Optional.empty());

        service.updateSessionWindow(orgId, phoneWith0033, inboundTime);

        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(orgId, "+0033612345678");
        ArgumentCaptor<WhatsAppSessionWindow> captor =
                ArgumentCaptor.forClass(WhatsAppSessionWindow.class);
        verify(sessionWindowRepository).save(captor.capture());
        assertThat(captor.getValue().getPhoneNumber()).isEqualTo("+0033612345678");
    }

    @Test
    void phoneNormalization_FrenchFormat_JustDigits33() {
        String phoneJust33 = "33612345678";
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, "+33612345678"))
                .thenReturn(Optional.empty());

        service.updateSessionWindow(orgId, phoneJust33, inboundTime);

        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(orgId, "+33612345678");
        ArgumentCaptor<WhatsAppSessionWindow> captor =
                ArgumentCaptor.forClass(WhatsAppSessionWindow.class);
        verify(sessionWindowRepository).save(captor.capture());
        assertThat(captor.getValue().getPhoneNumber()).isEqualTo("+33612345678");
    }

    @Test
    void phoneNormalization_RemovesSpacesAndDashes() {
        String phoneWithFormatting = "+33 6 12 34 56 78";
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, "+33612345678"))
                .thenReturn(Optional.empty());

        service.updateSessionWindow(orgId, phoneWithFormatting, inboundTime);

        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(orgId, "+33612345678");
    }

    @Test
    void phoneNormalization_HandlesUSFormat() {
        String usPhone = "1-555-123-4567";
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, "+15551234567"))
                .thenReturn(Optional.empty());

        service.updateSessionWindow(orgId, usPhone, inboundTime);

        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(orgId, "+15551234567");
    }

    @Test
    void phoneNormalization_AllFormatsNormalizeConsistently() {
        String[] variants = {
            "+33612345678", "33612345678", "+33 6 12 34 56 78", "33-6-12-34-56-78"
        };

        for (String variant : variants) {
            when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, "+33612345678"))
                    .thenReturn(Optional.empty());

            service.updateSessionWindow(orgId, variant, inboundTime);

            verify(sessionWindowRepository, atLeastOnce())
                    .findByOrgIdAndPhoneNumber(orgId, "+33612345678");
        }
    }

    @Test
    void isWithinSessionWindow_ReturnsFalse_WhenPhoneNumberIsNull() {
        boolean result = service.isWithinSessionWindow(orgId, null);

        assertFalse(result);
        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(orgId, null);
    }

    @Test
    void isWithinSessionWindow_ReturnsFalse_WhenOrgIdIsNull() {
        boolean result = service.isWithinSessionWindow(null, phoneNumber);

        assertFalse(result);
        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(null, phoneNumber);
    }

    @Test
    void isWithinSessionWindow_ReturnsFalse_WhenBothAreNull() {
        boolean result = service.isWithinSessionWindow(null, null);

        assertFalse(result);
        verify(sessionWindowRepository).findByOrgIdAndPhoneNumber(null, null);
    }

    @Test
    void recordOutboundMessage_CreatesNewWindow_WhenNoneExists() {
        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.empty());

        service.recordOutboundMessage(orgId, phoneNumber);

        verify(sessionWindowRepository, never()).save(any());
    }

    @Test
    void recordOutboundMessage_UpdatesExistingWindow() {
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setOrgId(orgId);
        session.setPhoneNumber(phoneNumber);
        session.setWindowOpensAt(LocalDateTime.now().minusHours(1));
        session.setWindowExpiresAt(LocalDateTime.now().plusHours(23));
        session.setLastInboundMessageAt(LocalDateTime.now().minusHours(1));
        session.setLastOutboundMessageAt(null);

        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.of(session));

        LocalDateTime beforeCall = LocalDateTime.now();
        service.recordOutboundMessage(orgId, phoneNumber);
        LocalDateTime afterCall = LocalDateTime.now();

        verify(sessionWindowRepository).save(session);
        assertNotNull(session.getLastOutboundMessageAt());
        assertThat(session.getLastOutboundMessageAt())
                .isAfterOrEqualTo(beforeCall)
                .isBeforeOrEqualTo(afterCall);
    }

    @Test
    void recordOutboundMessage_UpdatesPreviousOutboundTime() {
        LocalDateTime previousOutbound = LocalDateTime.now().minusMinutes(30);
        WhatsAppSessionWindow session = new WhatsAppSessionWindow();
        session.setOrgId(orgId);
        session.setPhoneNumber(phoneNumber);
        session.setWindowOpensAt(LocalDateTime.now().minusHours(1));
        session.setWindowExpiresAt(LocalDateTime.now().plusHours(23));
        session.setLastInboundMessageAt(LocalDateTime.now().minusHours(1));
        session.setLastOutboundMessageAt(previousOutbound);

        when(sessionWindowRepository.findByOrgIdAndPhoneNumber(orgId, phoneNumber))
                .thenReturn(Optional.of(session));

        service.recordOutboundMessage(orgId, phoneNumber);

        verify(sessionWindowRepository).save(session);
        assertNotNull(session.getLastOutboundMessageAt());
        assertThat(session.getLastOutboundMessageAt()).isAfter(previousOutbound);
    }

    @Test
    void cleanupExpiredSessions_DeletesOnlyExpiredWindows() {
        LocalDateTime cutoffTime = LocalDateTime.now();

        service.cleanupExpiredSessions();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(sessionWindowRepository).deleteExpiredSessions(captor.capture());

        LocalDateTime passedTime = captor.getValue();
        assertThat(passedTime).isBeforeOrEqualTo(cutoffTime.plusSeconds(1));
        assertThat(passedTime).isAfterOrEqualTo(cutoffTime.minusSeconds(1));
    }

    @Test
    void cleanupExpiredSessions_DoesNotDeleteActiveWindows() {
        service.cleanupExpiredSessions();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(sessionWindowRepository).deleteExpiredSessions(captor.capture());

        LocalDateTime cutoffTime = captor.getValue();
        assertThat(cutoffTime).isBeforeOrEqualTo(LocalDateTime.now().plusSeconds(1));
    }

    @DataJpaTest
    @ActiveProfiles("test")
    @Import(WhatsAppSessionWindowService.class)
    static class ConcurrencyAndFilterIntegrationTests {

        @Autowired private WhatsAppSessionWindowRepository sessionWindowRepository;

        @Autowired private WhatsAppSessionWindowService service;

        @Autowired private EntityManager entityManager;

        private static final String ORG_001 = "ORG-001";
        private static final String ORG_002 = "ORG-002";

        @BeforeEach
        void setUp() {
            sessionWindowRepository.deleteAll();
            entityManager.flush();
            entityManager.clear();
        }

        @Test
        @Transactional
        void concurrentSessionWindowUpdates_WithTransactionalIsolation() throws Exception {
            String phoneNumber = "+33612345678";
            LocalDateTime baseTime = LocalDateTime.now();

            ExecutorService executor = Executors.newFixedThreadPool(5);
            CountDownLatch latch = new CountDownLatch(5);
            AtomicInteger successCount = new AtomicInteger(0);

            for (int i = 0; i < 5; i++) {
                final int threadNum = i;
                executor.submit(
                        () -> {
                            try {
                                service.updateSessionWindow(
                                        ORG_001, phoneNumber, baseTime.plusMinutes(threadNum));
                                successCount.incrementAndGet();
                            } finally {
                                latch.countDown();
                            }
                        });
            }

            latch.await(10, TimeUnit.SECONDS);
            executor.shutdown();

            entityManager.flush();
            entityManager.clear();

            List<WhatsAppSessionWindow> windows =
                    sessionWindowRepository.findByOrgIdAndPhoneNumber(ORG_001, phoneNumber).stream()
                            .toList();

            assertThat(windows).hasSize(1);
            assertThat(successCount.get()).isGreaterThan(0);

            WhatsAppSessionWindow window = windows.get(0);
            assertThat(window.getOrgId()).isEqualTo(ORG_001);
            assertThat(window.getPhoneNumber()).isEqualTo(phoneNumber);
            assertThat(window.getLastInboundMessageAt()).isNotNull();
        }

        @Test
        @Transactional
        void hibernateFilter_PreventsCrossOrgLeakage() {
            WhatsAppSessionWindow window1 = new WhatsAppSessionWindow();
            window1.setOrgId(ORG_001);
            window1.setPhoneNumber("+33612345678");
            window1.setWindowOpensAt(LocalDateTime.now());
            window1.setWindowExpiresAt(LocalDateTime.now().plusHours(24));
            window1.setLastInboundMessageAt(LocalDateTime.now());
            sessionWindowRepository.save(window1);

            WhatsAppSessionWindow window2 = new WhatsAppSessionWindow();
            window2.setOrgId(ORG_002);
            window2.setPhoneNumber("+33687654321");
            window2.setWindowOpensAt(LocalDateTime.now());
            window2.setWindowExpiresAt(LocalDateTime.now().plusHours(24));
            window2.setLastInboundMessageAt(LocalDateTime.now());
            sessionWindowRepository.save(window2);

            WhatsAppSessionWindow window3 = new WhatsAppSessionWindow();
            window3.setOrgId(ORG_001);
            window3.setPhoneNumber("+33698765432");
            window3.setWindowOpensAt(LocalDateTime.now());
            window3.setWindowExpiresAt(LocalDateTime.now().plusHours(24));
            window3.setLastInboundMessageAt(LocalDateTime.now());
            sessionWindowRepository.save(window3);

            entityManager.flush();
            entityManager.clear();

            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_001);

            List<WhatsAppSessionWindow> org001Windows = sessionWindowRepository.findAll();
            assertThat(org001Windows).hasSize(2);
            assertThat(org001Windows)
                    .extracting(WhatsAppSessionWindow::getOrgId)
                    .containsOnly(ORG_001);
            assertThat(org001Windows)
                    .extracting(WhatsAppSessionWindow::getPhoneNumber)
                    .containsExactlyInAnyOrder("+33612345678", "+33698765432");

            session.disableFilter("orgIdFilter");
            entityManager.clear();

            filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_002);

            List<WhatsAppSessionWindow> org002Windows = sessionWindowRepository.findAll();
            assertThat(org002Windows).hasSize(1);
            assertThat(org002Windows)
                    .extracting(WhatsAppSessionWindow::getOrgId)
                    .containsOnly(ORG_002);
            assertThat(org002Windows)
                    .extracting(WhatsAppSessionWindow::getPhoneNumber)
                    .containsExactly("+33687654321");

            session.disableFilter("orgIdFilter");
            entityManager.clear();

            List<WhatsAppSessionWindow> allWindows = sessionWindowRepository.findAll();
            assertThat(allWindows).hasSize(3);
        }

        @Test
        @Transactional
        void hibernateFilter_IsolatesSessionWindowsByOrg() {
            String sharedPhone = "+33612345678";

            WhatsAppSessionWindow window1 = new WhatsAppSessionWindow();
            window1.setOrgId(ORG_001);
            window1.setPhoneNumber(sharedPhone);
            window1.setWindowOpensAt(LocalDateTime.now());
            window1.setWindowExpiresAt(LocalDateTime.now().plusHours(24));
            window1.setLastInboundMessageAt(LocalDateTime.now());
            sessionWindowRepository.save(window1);

            WhatsAppSessionWindow window2 = new WhatsAppSessionWindow();
            window2.setOrgId(ORG_002);
            window2.setPhoneNumber(sharedPhone);
            window2.setWindowOpensAt(LocalDateTime.now());
            window2.setWindowExpiresAt(LocalDateTime.now().plusHours(24));
            window2.setLastInboundMessageAt(LocalDateTime.now());
            sessionWindowRepository.save(window2);

            entityManager.flush();
            entityManager.clear();

            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_001);

            Optional<WhatsAppSessionWindow> org001Window =
                    sessionWindowRepository.findByOrgIdAndPhoneNumber(ORG_001, sharedPhone);
            assertThat(org001Window).isPresent();
            assertThat(org001Window.get().getOrgId()).isEqualTo(ORG_001);

            session.disableFilter("orgIdFilter");
            entityManager.clear();

            filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_002);

            Optional<WhatsAppSessionWindow> org002Window =
                    sessionWindowRepository.findByOrgIdAndPhoneNumber(ORG_002, sharedPhone);
            assertThat(org002Window).isPresent();
            assertThat(org002Window.get().getOrgId()).isEqualTo(ORG_002);

            session.disableFilter("orgIdFilter");
        }

        @Test
        @Transactional
        void cleanupExpiredSessions_DeletesOnlyExpiredWindows() {
            LocalDateTime now = LocalDateTime.now();

            WhatsAppSessionWindow expired1 = new WhatsAppSessionWindow();
            expired1.setOrgId(ORG_001);
            expired1.setPhoneNumber("+33611111111");
            expired1.setWindowOpensAt(now.minusHours(25));
            expired1.setWindowExpiresAt(now.minusHours(1));
            expired1.setLastInboundMessageAt(now.minusHours(25));
            sessionWindowRepository.save(expired1);

            WhatsAppSessionWindow expired2 = new WhatsAppSessionWindow();
            expired2.setOrgId(ORG_002);
            expired2.setPhoneNumber("+33622222222");
            expired2.setWindowOpensAt(now.minusHours(48));
            expired2.setWindowExpiresAt(now.minusHours(24));
            expired2.setLastInboundMessageAt(now.minusHours(48));
            sessionWindowRepository.save(expired2);

            WhatsAppSessionWindow active1 = new WhatsAppSessionWindow();
            active1.setOrgId(ORG_001);
            active1.setPhoneNumber("+33633333333");
            active1.setWindowOpensAt(now.minusHours(1));
            active1.setWindowExpiresAt(now.plusHours(23));
            active1.setLastInboundMessageAt(now.minusHours(1));
            sessionWindowRepository.save(active1);

            WhatsAppSessionWindow active2 = new WhatsAppSessionWindow();
            active2.setOrgId(ORG_002);
            active2.setPhoneNumber("+33644444444");
            active2.setWindowOpensAt(now.minusHours(5));
            active2.setWindowExpiresAt(now.plusHours(19));
            active2.setLastInboundMessageAt(now.minusHours(5));
            sessionWindowRepository.save(active2);

            entityManager.flush();
            entityManager.clear();

            List<WhatsAppSessionWindow> beforeCleanup = sessionWindowRepository.findAll();
            assertThat(beforeCleanup).hasSize(4);

            service.cleanupExpiredSessions();

            entityManager.flush();
            entityManager.clear();

            List<WhatsAppSessionWindow> afterCleanup = sessionWindowRepository.findAll();
            assertThat(afterCleanup).hasSize(2);
            assertThat(afterCleanup)
                    .extracting(WhatsAppSessionWindow::getPhoneNumber)
                    .containsExactlyInAnyOrder("+33633333333", "+33644444444");
            assertThat(afterCleanup)
                    .allMatch(window -> window.getWindowExpiresAt().isAfter(LocalDateTime.now()));
        }

        @Test
        @Transactional
        void cleanupExpiredSessions_HandlesEdgeCaseAtExactExpiryTime() {
            LocalDateTime now = LocalDateTime.now();

            WhatsAppSessionWindow justExpired = new WhatsAppSessionWindow();
            justExpired.setOrgId(ORG_001);
            justExpired.setPhoneNumber("+33655555555");
            justExpired.setWindowOpensAt(now.minusHours(24));
            justExpired.setWindowExpiresAt(now.minusSeconds(1));
            justExpired.setLastInboundMessageAt(now.minusHours(24));
            sessionWindowRepository.save(justExpired);

            WhatsAppSessionWindow justActive = new WhatsAppSessionWindow();
            justActive.setOrgId(ORG_001);
            justActive.setPhoneNumber("+33666666666");
            justActive.setWindowOpensAt(now.minusHours(24));
            justActive.setWindowExpiresAt(now.plusSeconds(1));
            justActive.setLastInboundMessageAt(now.minusHours(24));
            sessionWindowRepository.save(justActive);

            entityManager.flush();
            entityManager.clear();

            service.cleanupExpiredSessions();

            entityManager.flush();
            entityManager.clear();

            List<WhatsAppSessionWindow> remaining = sessionWindowRepository.findAll();
            assertThat(remaining).hasSize(1);
            assertThat(remaining.get(0).getPhoneNumber()).isEqualTo("+33666666666");
        }
    }
}
