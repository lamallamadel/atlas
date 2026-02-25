package com.example.backend.service;

import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.repository.AppointmentRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentReminderScheduler.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final AppointmentRepository appointmentRepository;
    private final OutboundMessageService outboundMessageService;

    @Value("${appointment.reminder.enabled:true}")
    private boolean remindersEnabled;

    @Value("${appointment.reminder.hours-ahead:24}")
    private int hoursAhead;

    public AppointmentReminderScheduler(
            AppointmentRepository appointmentRepository,
            OutboundMessageService outboundMessageService) {
        this.appointmentRepository = appointmentRepository;
        this.outboundMessageService = outboundMessageService;
    }

    /**
     * Checks for appointments exactly 'hoursAhead' in the future and queues a
     * WhatsApp reminder message.
     * We run this every 15 minutes by default to catch appointments effectively.
     */
    @Scheduled(cron = "${appointment.reminder.cron:0 0/15 * * * ?}")
    @Transactional
    public void processUpcomingAppointments() {
        if (!remindersEnabled) {
            logger.debug("Appointment reminder scheduler is disabled");
            return;
        }

        logger.info("Running appointment reminder scheduler...");

        // Find appointments happening 'hoursAhead' from now, within a 15-minute window
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.plusHours(hoursAhead).minusMinutes(5);
        LocalDateTime windowEnd = now.plusHours(hoursAhead).plusMinutes(15);

        List<AppointmentEntity> upcomingAppointments = appointmentRepository.findAppointmentsForReminder(
                AppointmentStatus.SCHEDULED, windowStart, windowEnd);

        if (upcomingAppointments.isEmpty()) {
            logger.debug("No upcoming appointments found for reminders in this window");
            return;
        }

        logger.info("Found {} upcoming appointments to remind", upcomingAppointments.size());

        for (AppointmentEntity appointment : upcomingAppointments) {
            try {
                sendReminder(appointment);
            } catch (Exception e) {
                logger.error("Failed to send reminder for appointment {}: {}", appointment.getId(), e.getMessage());
            }
        }
    }

    private void sendReminder(AppointmentEntity appointment) {
        if (appointment.getDossier() == null) {
            logger.warn("Appointment {} has no dossier. Skipping reminder.", appointment.getId());
            return;
        }

        String clientName = appointment.getDossier().getLeadName();
        if (clientName == null || clientName.trim().isEmpty()) {
            clientName = "Client";
        }

        String agentName = appointment.getAssignedTo() != null ? appointment.getAssignedTo() : "votre conseiller";
        String location = appointment.getLocation() != null ? appointment.getLocation() : "notre agence";

        String dateStr = appointment.getStartTime().format(DATE_FORMATTER);
        String timeStr = appointment.getStartTime().format(TIME_FORMATTER);

        String messageContent = String.format(
                "Bonjour %s, nous vous rappelons votre rendez-vous prévu le %s à %s pour la visite %s. Votre agent %s sera sur place.",
                clientName, dateStr, timeStr, location, agentName);

        String phoneNumber = appointment.getDossier().getLeadPhone();
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            logger.warn("Dossier {} has no lead phone number. Skipping WhatsApp reminder for appointment {}.",
                    appointment.getDossier().getId(), appointment.getId());
            return;
        }

        logger.info("Queueing WhatsApp reminder for appointment {} to phone {}", appointment.getId(), phoneNumber);

        // Queue message via existing outbound infra (which handles consent, retry, rate
        // limit)
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("body", messageContent);

        outboundMessageService.createOutboundMessage(
                appointment.getDossier().getId(),
                MessageChannel.WHATSAPP,
                phoneNumber,
                null, // templateCode is null for our custom internal freeform template
                "Rappel de rendez-vous", // subject
                payload,
                "appointment_reminder_" + appointment.getId() // idempotencyKey
        );

        // Update the flag to avoid duplicate reminders
        appointment.setReminderSent(true);
        appointmentRepository.save(appointment);

        logger.info("Reminder flagged as sent for appointment {}", appointment.getId());
    }
}
