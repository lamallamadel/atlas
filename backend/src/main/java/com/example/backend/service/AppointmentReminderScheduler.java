package com.example.backend.service;

import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.repository.AppointmentRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AppointmentReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentReminderScheduler.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    
    private static final String DEFAULT_TEMPLATE_CODE = "appointment_reminder";
    private static final List<String> DEFAULT_CHANNELS = Arrays.asList("WHATSAPP", "SMS", "EMAIL");

    private final AppointmentRepository appointmentRepository;
    private final OutboundMessageService outboundMessageService;
    private final ActivityService activityService;
    private final TemplateInterpolationService templateInterpolationService;

    @Value("${appointment.reminder.enabled:true}")
    private boolean remindersEnabled;

    @Value("${appointment.reminder.hours-ahead:24}")
    private int hoursAhead;

    public AppointmentReminderScheduler(
            AppointmentRepository appointmentRepository,
            OutboundMessageService outboundMessageService,
            ActivityService activityService,
            TemplateInterpolationService templateInterpolationService) {
        this.appointmentRepository = appointmentRepository;
        this.outboundMessageService = outboundMessageService;
        this.activityService = activityService;
        this.templateInterpolationService = templateInterpolationService;
    }

    @Scheduled(cron = "${appointment.reminder.cron:0 0/15 * * * ?}")
    @Transactional
    public void processUpcomingAppointments() {
        if (!remindersEnabled) {
            logger.debug("Appointment reminder scheduler is disabled");
            return;
        }

        logger.info("Running appointment reminder scheduler...");

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
                sendReminderWithFallback(appointment);
            } catch (Exception e) {
                logger.error("Failed to send reminder for appointment {}: {}", appointment.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void sendReminderWithFallback(AppointmentEntity appointment) {
        if (appointment.getDossier() == null) {
            logger.warn("Appointment {} has no dossier. Skipping reminder.", appointment.getId());
            return;
        }

        Long dossierId = appointment.getDossier().getId();
        List<String> channels = getReminderChannels(appointment);
        String templateCode = getTemplateCode(appointment);
        
        Map<String, String> templateVariables = buildTemplateVariables(appointment);

        boolean reminderSent = false;
        List<String> attemptedChannels = new ArrayList<>();
        List<String> failureReasons = new ArrayList<>();

        for (String channelStr : channels) {
            MessageChannel channel;
            try {
                channel = MessageChannel.valueOf(channelStr);
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid channel '{}' for appointment {}. Skipping.", channelStr, appointment.getId());
                attemptedChannels.add(channelStr);
                failureReasons.add("Invalid channel: " + channelStr);
                continue;
            }

            attemptedChannels.add(channelStr);

            String recipientContact = getRecipientContact(appointment, channel);
            if (recipientContact == null || recipientContact.trim().isEmpty()) {
                String reason = String.format("No contact info for channel %s", channel);
                logger.warn("Dossier {} has no contact for channel {}. Trying next channel.", 
                        dossierId, channel);
                failureReasons.add(reason);
                logFallbackEvent(appointment, channel, reason);
                continue;
            }

            try {
                String messageContent = interpolateTemplate(templateCode, templateVariables);
                
                Map<String, Object> payload = new HashMap<>();
                payload.put("body", messageContent);

                outboundMessageService.createOutboundMessage(
                        dossierId,
                        channel,
                        recipientContact,
                        templateCode,
                        "Rappel de rendez-vous",
                        payload,
                        "appointment_reminder_" + appointment.getId() + "_" + channel,
                        ConsentementType.TRANSACTIONNEL
                );

                logger.info("Successfully queued reminder for appointment {} via {} to {}", 
                        appointment.getId(), channel, recipientContact);
                
                reminderSent = true;
                logSuccessfulReminder(appointment, channel, attemptedChannels, failureReasons);
                break;

            } catch (ResponseStatusException e) {
                String reason = String.format("Consent validation failed: %s", e.getReason());
                logger.warn("Consent validation failed for appointment {} on channel {}: {}. Trying next channel.",
                        appointment.getId(), channel, e.getReason());
                failureReasons.add(reason);
                logFallbackEvent(appointment, channel, reason);
                
            } catch (Exception e) {
                String reason = String.format("Error: %s", e.getMessage());
                logger.error("Failed to send reminder for appointment {} on channel {}: {}. Trying next channel.",
                        appointment.getId(), channel, e.getMessage(), e);
                failureReasons.add(reason);
                logFallbackEvent(appointment, channel, reason);
            }
        }

        if (reminderSent) {
            appointment.setReminderSent(true);
            appointmentRepository.save(appointment);
            logger.info("Reminder flagged as sent for appointment {}", appointment.getId());
        } else {
            logger.error("Failed to send reminder for appointment {} on all channels: {}. Attempted: {}, Failures: {}",
                    appointment.getId(), channels, attemptedChannels, failureReasons);
            logAllChannelsFailedEvent(appointment, attemptedChannels, failureReasons);
        }
    }

    private List<String> getReminderChannels(AppointmentEntity appointment) {
        List<String> channels = appointment.getReminderChannels();
        if (channels == null || channels.isEmpty()) {
            return new ArrayList<>(DEFAULT_CHANNELS);
        }
        return new ArrayList<>(channels);
    }

    private String getTemplateCode(AppointmentEntity appointment) {
        String templateCode = appointment.getTemplateCode();
        if (templateCode == null || templateCode.trim().isEmpty()) {
            return DEFAULT_TEMPLATE_CODE;
        }
        return templateCode;
    }

    private Map<String, String> buildTemplateVariables(AppointmentEntity appointment) {
        Map<String, String> variables = new HashMap<>();
        
        String clientName = appointment.getDossier().getLeadName();
        if (clientName == null || clientName.trim().isEmpty()) {
            clientName = "Client";
        }
        
        String agentName = appointment.getAssignedTo() != null ? appointment.getAssignedTo() : "votre conseiller";
        String location = appointment.getLocation() != null ? appointment.getLocation() : "notre agence";
        String dateStr = appointment.getStartTime().format(DATE_FORMATTER);
        String timeStr = appointment.getStartTime().format(TIME_FORMATTER);

        variables.put("clientName", clientName);
        variables.put("dateStr", dateStr);
        variables.put("timeStr", timeStr);
        variables.put("location", location);
        variables.put("agentName", agentName);

        return variables;
    }

    private String interpolateTemplate(String templateCode, Map<String, String> variables) {
        try {
            return templateInterpolationService.interpolateTemplate(templateCode, variables);
        } catch (Exception e) {
            logger.warn("Failed to interpolate template '{}': {}. Using fallback message.", 
                    templateCode, e.getMessage());
            return buildFallbackMessage(variables);
        }
    }

    private String buildFallbackMessage(Map<String, String> variables) {
        return String.format(
                "Bonjour %s, nous vous rappelons votre rendez-vous prévu le %s à %s pour la visite %s. Votre agent %s sera sur place.",
                variables.get("clientName"),
                variables.get("dateStr"),
                variables.get("timeStr"),
                variables.get("location"),
                variables.get("agentName")
        );
    }

    private String getRecipientContact(AppointmentEntity appointment, MessageChannel channel) {
        return switch (channel) {
            case EMAIL -> appointment.getDossier().getLeadEmail();
            case SMS, WHATSAPP, PHONE -> appointment.getDossier().getLeadPhone();
            default -> null;
        };
    }

    private void logFallbackEvent(AppointmentEntity appointment, MessageChannel channel, String reason) {
        if (activityService == null || appointment.getDossier() == null) {
            return;
        }

        try {
            String description = String.format(
                    "Appointment reminder fallback: Failed to send via %s, trying next channel. Reason: %s",
                    channel, reason
            );

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("appointmentId", appointment.getId());
            metadata.put("failedChannel", channel.name());
            metadata.put("failureReason", reason);
            metadata.put("timestamp", LocalDateTime.now().toString());

            activityService.logActivity(
                    appointment.getDossier().getId(),
                    ActivityType.MESSAGE_FAILED,
                    description,
                    metadata
            );
        } catch (Exception e) {
            logger.warn("Failed to log fallback event for appointment {}: {}", 
                    appointment.getId(), e.getMessage());
        }
    }

    private void logSuccessfulReminder(
            AppointmentEntity appointment,
            MessageChannel successChannel,
            List<String> attemptedChannels,
            List<String> previousFailures) {
        if (activityService == null || appointment.getDossier() == null) {
            return;
        }

        try {
            String description;
            if (attemptedChannels.size() == 1) {
                description = String.format(
                        "Appointment reminder sent successfully via %s",
                        successChannel
                );
            } else {
                description = String.format(
                        "Appointment reminder sent successfully via %s after %d failed attempt(s)",
                        successChannel,
                        attemptedChannels.size() - 1
                );
            }

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("appointmentId", appointment.getId());
            metadata.put("successChannel", successChannel.name());
            metadata.put("attemptedChannels", attemptedChannels);
            if (!previousFailures.isEmpty()) {
                metadata.put("previousFailures", previousFailures);
            }
            metadata.put("timestamp", LocalDateTime.now().toString());

            activityService.logActivity(
                    appointment.getDossier().getId(),
                    ActivityType.MESSAGE_SENT,
                    description,
                    metadata
            );
        } catch (Exception e) {
            logger.warn("Failed to log successful reminder for appointment {}: {}", 
                    appointment.getId(), e.getMessage());
        }
    }

    private void logAllChannelsFailedEvent(
            AppointmentEntity appointment,
            List<String> attemptedChannels,
            List<String> failureReasons) {
        if (activityService == null || appointment.getDossier() == null) {
            return;
        }

        try {
            String description = String.format(
                    "Appointment reminder failed on all channels. Attempted: %s",
                    String.join(", ", attemptedChannels)
            );

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("appointmentId", appointment.getId());
            metadata.put("attemptedChannels", attemptedChannels);
            metadata.put("failureReasons", failureReasons);
            metadata.put("timestamp", LocalDateTime.now().toString());

            activityService.logActivity(
                    appointment.getDossier().getId(),
                    ActivityType.MESSAGE_FAILED,
                    description,
                    metadata
            );
        } catch (Exception e) {
            logger.warn("Failed to log all-channels-failed event for appointment {}: {}", 
                    appointment.getId(), e.getMessage());
        }
    }
}
