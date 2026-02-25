package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.service.AppointmentReminderScheduler;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AppointmentReminderIntegrationTest {

    @Autowired
    private AppointmentReminderScheduler scheduler;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private DossierRepository dossierRepository;
    @Autowired
    private OutboundMessageRepository outboundMessageRepository;
    @Autowired
    private ConsentementRepository consentementRepository;

    private Dossier testDossier;

    @BeforeEach
    void setUp() {
        outboundMessageRepository.deleteAll();
        appointmentRepository.deleteAll();
        dossierRepository.deleteAll();

        testDossier = new Dossier();
        testDossier.setOrgId("org-test");
        testDossier.setLeadName("Jean Dupont");
        testDossier.setLeadPhone("+33612345678");
        testDossier.setStatus(DossierStatus.NEW);
        testDossier = dossierRepository.save(testDossier);

        ConsentementEntity consent = new ConsentementEntity();
        consent.setOrgId("org-test");
        consent.setDossier(testDossier);
        consent.setChannel(ConsentementChannel.WHATSAPP);
        consent.setConsentType(ConsentementType.TRANSACTIONNEL);
        consent.setStatus(ConsentementStatus.GRANTED);
        
        Map<String, Object> meta = new HashMap<>();
        meta.put("ipAddress", "127.0.0.1");
        consent.setMeta(meta);
        
        consentementRepository.save(consent);
    }

    @Test
    void testSchedulerCreatesOutboundMessageForUpcomingAppointment() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusHours(24);

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setOrgId("org-test");
        appointment.setDossier(testDossier);
        appointment.setStartTime(tomorrow);
        appointment.setEndTime(tomorrow.plusHours(1));
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setLocation("Appartement Paris 15e");
        appointment.setAssignedTo("Agent Test");
        appointment.setReminderSent(false);
        appointmentRepository.save(appointment);

        // Act
        scheduler.processUpcomingAppointments();

        // Assert
        // 1. Check reminder flag is updated
        AppointmentEntity updatedAppointment = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertThat(updatedAppointment.getReminderSent()).isTrue();

        // 2. Check outbound message is queued
        List<OutboundMessageEntity> pendingMessages = outboundMessageRepository.findAll();
        assertThat(pendingMessages).hasSize(1);

        OutboundMessageEntity msg = pendingMessages.get(0);
        assertThat(msg.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(msg.getTo()).isEqualTo("+33612345678");
        assertThat(msg.getPayloadJson()).isNotNull();
        String body = (String) msg.getPayloadJson().get("body");
        assertThat(body).contains("Jean Dupont");
        assertThat(body).contains("Appartement Paris 15e");
        assertThat(body).contains("Agent Test");
    }

    @Test
    void testSchedulerIgnoresAlreadyRemindedAppointments() {
        // Arrange
        LocalDateTime tomorrow = LocalDateTime.now().plusHours(24);

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setOrgId("org-test");
        appointment.setDossier(testDossier);
        appointment.setStartTime(tomorrow);
        appointment.setEndTime(tomorrow.plusHours(1));
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setReminderSent(true); // Already sent
        appointmentRepository.save(appointment);

        // Act
        scheduler.processUpcomingAppointments();

        // Assert
        List<OutboundMessageEntity> pendingMessages = outboundMessageRepository.findAll();
        assertThat(pendingMessages).isEmpty();
    }
}
