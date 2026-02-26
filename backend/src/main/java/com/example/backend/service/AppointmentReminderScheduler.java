package com.example.backend.service;

import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.ReminderStrategy;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.AppointmentReminderMetricsRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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

    private static final Logger logger =
            LoggerFactory.getLogger(AppointmentReminderScheduler.class);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private static final String DEFAULT_TEMPLATE_CODE = "appointment_reminder";
    private static final List<String> DEFAULT_CHANNELS = Arrays.asList("WHATSAPP", "SMS", "EMAIL");

    private final AppointmentRepository appointmentRepository;
    private final OutboundMessageService outboundMessageService;
    private final ActivityService activityService;
    private final TemplateInterpolationService templateInterpolationService;
    private final ConversationStateManager conversationStateManager;
    private final ModelTrainingService modelTrainingService;
    private final AppointmentReminderMetricsService metricsService;
    private final AppointmentReminderMetricsRepository metricsRepository;
    private final WhatsAppTemplateService whatsAppTemplateService;

    @Value("${appointment.reminder.enabled:true}")
    private boolean remindersEnabled;

    @Value("${appointment.reminder.hours-ahead:24}")
    private int hoursAhead;

    @Value("${appointment.reminder.aggressive-threshold:0.7}")
    private double aggressiveThreshold;

    public AppointmentReminderScheduler(
            AppointmentRepository appointmentRepository,
            OutboundMessageService outboundMessageService,
            ActivityService activityService,
            TemplateInterpolationService templateInterpolationService,
            ConversationStateManager conversationStateManager,
            ModelTrainingService modelTrainingService,
            AppointmentReminderMetricsService metricsService,
            AppointmentReminderMetricsRepository metricsRepository,
            WhatsAppTemplateService whatsAppTemplateService) {
        this.appointmentRepository = appointmentRepository;
        this.outboundMessageService = outboundMessageService;
        this.activityService = activityService;
        this.templateInterpolationService = templateInterpolationService;
        this.conversationStateManager = conversationStateManager;
        this.modelTrainingService = modelTrainingService;
        this.metricsService = metricsService;
        this.metricsRepository = metricsRepository;
        this.whatsAppTemplateService = whatsAppTemplateService;
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

        List<AppointmentEntity> upcomingAppointments =
                appointmentRepository.findAppointmentsForReminder(
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
                logger.error(
                        "Failed to send reminder for appointment {}: {}",
                        appointment.getId(),
                        e.getMessage());
            }
        }
    }

    @Scheduled(cron = "${appointment.reminder.aggressive-cron:0 0/10 * * * ?}")
    @Transactional
    public void processAggressiveReminders() {
        if (!remindersEnabled) {
            logger.debug("Appointment reminder scheduler is disabled");
            return;
        }

        logger.info("Running aggressive appointment reminder scheduler...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.plusHours(2).minusMinutes(5);
        LocalDateTime windowEnd = now.plusHours(2).plusMinutes(10);

        List<AppointmentEntity> upcomingAppointments = appointmentRepository.findAppointmentsForAdditionalReminder(
                AppointmentStatus.SCHEDULED, windowStart, windowEnd);

        if (upcomingAppointments.isEmpty()) {
            logger.debug("No appointments found for aggressive reminders in this window");
            return;
        }

        logger.info("Found {} appointments to evaluate for aggressive reminders", upcomingAppointments.size());

        for (AppointmentEntity appointment : upcomingAppointments) {
            try {
                ReminderStrategy strategy = appointment.getReminderStrategy();
                if (strategy == null) {
                    strategy = ReminderStrategy.STANDARD;
                }

                if (strategy == ReminderStrategy.MINIMAL) {
                    logger.debug("Skipping aggressive reminder for appointment {} with MINIMAL strategy", 
                            appointment.getId());
                    continue;
                }

                double noShowProbability = predictNoShowProbability(appointment);
                
                logger.info("Appointment {} has no-show probability: {}", appointment.getId(), noShowProbability);

                if (noShowProbability > aggressiveThreshold || strategy == ReminderStrategy.AGGRESSIVE) {
                    logger.info("Sending aggressive reminder for appointment {} (probability: {}, strategy: {})", 
                            appointment.getId(), noShowProbability, strategy);
                    sendAggressiveReminder(appointment, noShowProbability);
                } else {
                    logger.debug("No-show probability {} below threshold {} for appointment {}", 
                            noShowProbability, aggressiveThreshold, appointment.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to process aggressive reminder for appointment {}: {}", 
                        appointment.getId(), e.getMessage(), e);
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
                logger.warn(
                        "Invalid channel '{}' for appointment {}. Skipping.",
                        channelStr,
                        appointment.getId());
                attemptedChannels.add(channelStr);
                failureReasons.add("Invalid channel: " + channelStr);
                continue;
            }

            attemptedChannels.add(channelStr);

            String recipientContact = getRecipientContact(appointment, channel);
            if (recipientContact == null || recipientContact.trim().isEmpty()) {
                String reason = String.format("No contact info for channel %s", channel);
                logger.warn(
                        "Dossier {} has no contact for channel {}. Trying next channel.",
                        dossierId,
                        channel);
                failureReasons.add(reason);
                logFallbackEvent(appointment, channel, reason);
                continue;
            }

            try {
                String dossierLocale = appointment.getDossier().getLocale();
                if (dossierLocale == null || dossierLocale.trim().isEmpty()) {
                    dossierLocale = "fr_FR";
                }

                String messageContent;
                if (channel == MessageChannel.WHATSAPP) {
                    messageContent =
                            getLocalizedTemplateContent(
                                    templateCode, dossierLocale, templateVariables);
                } else {
                    messageContent = interpolateTemplate(templateCode, templateVariables);
                }

                Map<String, Object> payload = new HashMap<>();
                payload.put("body", messageContent);

                outboundMessageService.createOutboundMessage(
                        dossierId,
                        channel,
                        recipientContact,
                        templateCode,
                        getLocalizedSubject(dossierLocale),
                        payload,
                        "appointment_reminder_" + appointment.getId() + "_" + channel,
                        ConsentementType.TRANSACTIONNEL);

                logger.info(
                        "Successfully queued reminder for appointment {} via {} to {}",
                        appointment.getId(),
                        channel,
                        recipientContact);

                double noShowProbability = predictNoShowProbability(appointment);
                ReminderStrategy strategy = appointment.getReminderStrategy();

                metricsService.recordReminderSentWithStrategy(
                        appointment,
                        channel.name(),
                        templateCode,
                        appointment.getAssignedTo(),
                        "SENT",
                        LocalDateTime.now(),
                        strategy != null ? strategy.name() : ReminderStrategy.STANDARD.name(),
                        noShowProbability);

                if (channel == MessageChannel.WHATSAPP) {
                    initializeConversationForReminder(appointment, recipientContact);
                }

                reminderSent = true;
                logSuccessfulReminder(appointment, channel, attemptedChannels, failureReasons);
                break;

            } catch (ResponseStatusException e) {
                String reason = String.format("Consent validation failed: %s", e.getReason());
                logger.warn(
                        "Consent validation failed for appointment {} on channel {}: {}. Trying next channel.",
                        appointment.getId(),
                        channel,
                        e.getReason());
                failureReasons.add(reason);
                logFallbackEvent(appointment, channel, reason);

            } catch (Exception e) {
                String reason = String.format("Error: %s", e.getMessage());
                logger.error(
                        "Failed to send reminder for appointment {} on channel {}: {}. Trying next channel.",
                        appointment.getId(),
                        channel,
                        e.getMessage(),
                        e);
                failureReasons.add(reason);
                logFallbackEvent(appointment, channel, reason);
            }
        }

        if (reminderSent) {
            appointment.setReminderSent(true);
            appointmentRepository.save(appointment);
            logger.info("Reminder flagged as sent for appointment {}", appointment.getId());
        } else {
            logger.error(
                    "Failed to send reminder for appointment {} on all channels: {}. Attempted: {}, Failures: {}",
                    appointment.getId(),
                    channels,
                    attemptedChannels,
                    failureReasons);
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

        String dossierLocale = appointment.getDossier().getLocale();
        if (dossierLocale == null || dossierLocale.trim().isEmpty()) {
            dossierLocale = "fr_FR";
        }

        Locale locale = parseLocale(dossierLocale);

        String clientName = appointment.getDossier().getLeadName();
        if (clientName == null || clientName.trim().isEmpty()) {
            clientName = getLocalizedDefaultName(dossierLocale);
        }

        String agentName =
                appointment.getAssignedTo() != null
                        ? appointment.getAssignedTo()
                        : getLocalizedAgentName(dossierLocale);
        String location =
                appointment.getLocation() != null
                        ? appointment.getLocation()
                        : getLocalizedLocation(dossierLocale);

        String dateStr = formatDateForLocale(appointment.getStartTime(), locale);
        String timeStr = formatTimeForLocale(appointment.getStartTime(), locale);

        variables.put("clientName", clientName);
        variables.put("dateStr", dateStr);
        variables.put("timeStr", timeStr);
        variables.put("location", location);
        variables.put("agentName", agentName);

        return variables;
    }

    private Locale parseLocale(String localeString) {
        if (localeString == null || localeString.trim().isEmpty()) {
            return Locale.FRANCE;
        }

        String[] parts = localeString.split("_");
        if (parts.length == 2) {
            return new Locale(parts[0], parts[1]);
        }
        return Locale.FRANCE;
    }

    private String formatDateForLocale(LocalDateTime dateTime, Locale locale) {
        try {
            DateTimeFormatter formatter =
                    DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale);
            return dateTime.format(formatter);
        } catch (Exception e) {
            logger.warn("Failed to format date with locale {}, using default", locale);
            return dateTime.format(DATE_FORMATTER);
        }
    }

    private String formatTimeForLocale(LocalDateTime dateTime, Locale locale) {
        try {
            DateTimeFormatter formatter =
                    DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withLocale(locale);
            return dateTime.format(formatter);
        } catch (Exception e) {
            logger.warn("Failed to format time with locale {}, using default", locale);
            return dateTime.format(TIME_FORMATTER);
        }
    }

    private String getLocalizedDefaultName(String locale) {
        if (locale == null) {
            return "Client";
        }
        return switch (locale.toLowerCase()) {
            case "en_us", "en_gb" -> "Client";
            case "ar_ma", "ar_sa" -> "العميل";
            case "es_es" -> "Cliente";
            case "de_de" -> "Kunde";
            default -> "Client";
        };
    }

    private String getLocalizedAgentName(String locale) {
        if (locale == null) {
            return "votre conseiller";
        }
        return switch (locale.toLowerCase()) {
            case "en_us", "en_gb" -> "your advisor";
            case "ar_ma", "ar_sa" -> "مستشارك";
            case "es_es" -> "su asesor";
            case "de_de" -> "Ihr Berater";
            default -> "votre conseiller";
        };
    }

    private String getLocalizedLocation(String locale) {
        if (locale == null) {
            return "notre agence";
        }
        return switch (locale.toLowerCase()) {
            case "en_us", "en_gb" -> "our office";
            case "ar_ma", "ar_sa" -> "مكتبنا";
            case "es_es" -> "nuestra oficina";
            case "de_de" -> "unser Büro";
            default -> "notre agence";
        };
    }

    private String getLocalizedSubject(String locale) {
        if (locale == null) {
            return "Rappel de rendez-vous";
        }
        return switch (locale.toLowerCase()) {
            case "en_us", "en_gb" -> "Appointment Reminder";
            case "ar_ma", "ar_sa" -> "تذكير بالموعد";
            case "es_es" -> "Recordatorio de cita";
            case "de_de" -> "Terminerinnerung";
            default -> "Rappel de rendez-vous";
        };
    }

    private String getLocalizedTemplateContent(
            String templateCode, String locale, Map<String, String> variables) {
        try {
            com.example.backend.entity.WhatsAppTemplate template =
                    whatsAppTemplateService.getLocalizedTemplate(templateCode, locale);

            if (template != null && template.getComponents() != null) {
                return extractBodyFromTemplate(template, variables);
            }
        } catch (Exception e) {
            logger.warn(
                    "Failed to get localized template '{}' for locale '{}': {}. Using interpolation.",
                    templateCode,
                    locale,
                    e.getMessage());
        }

        return interpolateTemplate(templateCode, variables);
    }

    private String extractBodyFromTemplate(
            com.example.backend.entity.WhatsAppTemplate template, Map<String, String> variables) {
        if (template.getComponents() == null) {
            return buildFallbackMessage(variables);
        }

        for (Map<String, Object> component : template.getComponents()) {
            String type = (String) component.get("type");
            if ("BODY".equalsIgnoreCase(type)) {
                String bodyText = (String) component.get("text");
                if (bodyText != null) {
                    return replaceTemplateVariables(bodyText, variables);
                }
            }
        }

        return buildFallbackMessage(variables);
    }

    private String replaceTemplateVariables(String text, Map<String, String> variables) {
        if (text == null || variables == null) {
            return text;
        }

        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }

        return result;
    }

    private String interpolateTemplate(String templateCode, Map<String, String> variables) {
        try {
            return templateInterpolationService.interpolateTemplate(templateCode, variables);
        } catch (Exception e) {
            logger.warn(
                    "Failed to interpolate template '{}': {}. Using fallback message.",
                    templateCode,
                    e.getMessage());
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
                variables.get("agentName"));
    }

    private String getRecipientContact(AppointmentEntity appointment, MessageChannel channel) {
        return switch (channel) {
            case EMAIL -> appointment.getDossier().getLeadEmail();
            case SMS, WHATSAPP, PHONE -> appointment.getDossier().getLeadPhone();
            default -> null;
        };
    }

    private void logFallbackEvent(
            AppointmentEntity appointment, MessageChannel channel, String reason) {
        if (activityService == null || appointment.getDossier() == null) {
            return;
        }

        try {
            String description =
                    String.format(
                            "Appointment reminder fallback: Failed to send via %s, trying next channel. Reason: %s",
                            channel, reason);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("appointmentId", appointment.getId());
            metadata.put("failedChannel", channel.name());
            metadata.put("failureReason", reason);
            metadata.put("timestamp", LocalDateTime.now().toString());

            activityService.logActivity(
                    appointment.getDossier().getId(),
                    ActivityType.MESSAGE_FAILED,
                    description,
                    metadata);
        } catch (Exception e) {
            logger.warn(
                    "Failed to log fallback event for appointment {}: {}",
                    appointment.getId(),
                    e.getMessage());
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
                description =
                        String.format(
                                "Appointment reminder sent successfully via %s", successChannel);
            } else {
                description =
                        String.format(
                                "Appointment reminder sent successfully via %s after %d failed attempt(s)",
                                successChannel, attemptedChannels.size() - 1);
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
                    metadata);
        } catch (Exception e) {
            logger.warn(
                    "Failed to log successful reminder for appointment {}: {}",
                    appointment.getId(),
                    e.getMessage());
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
            String description =
                    String.format(
                            "Appointment reminder failed on all channels. Attempted: %s",
                            String.join(", ", attemptedChannels));

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("appointmentId", appointment.getId());
            metadata.put("attemptedChannels", attemptedChannels);
            metadata.put("failureReasons", failureReasons);
            metadata.put("timestamp", LocalDateTime.now().toString());

            activityService.logActivity(
                    appointment.getDossier().getId(),
                    ActivityType.MESSAGE_FAILED,
                    description,
                    metadata);
        } catch (Exception e) {
            logger.warn(
                    "Failed to log all-channels-failed event for appointment {}: {}",
                    appointment.getId(),
                    e.getMessage());
        }
    }

    private void initializeConversationForReminder(
            AppointmentEntity appointment, String phoneNumber) {
        try {
            String orgId = appointment.getOrgId();
            Long dossierId =
                    appointment.getDossier() != null ? appointment.getDossier().getId() : null;

            conversationStateManager.initializeConversation(
                    orgId, phoneNumber, appointment.getId(), dossierId);

            logger.info(
                    "Initialized conversation flow for appointment {} with phone {}",
                    appointment.getId(),
                    phoneNumber);
        } catch (Exception e) {
            logger.error(
                    "Failed to initialize conversation for appointment {}: {}",
                    appointment.getId(),
                    e.getMessage(),
                    e);
        }
    }

    private double predictNoShowProbability(AppointmentEntity appointment) {
        try {
            Map<String, Object> features = buildPredictionFeatures(appointment);
            String orgId = appointment.getOrgId();
            
            return modelTrainingService.predictNoShowProbability(orgId, appointment.getId(), features);
        } catch (Exception e) {
            logger.error("Error predicting no-show probability for appointment {}: {}", 
                    appointment.getId(), e.getMessage(), e);
            return 0.3;
        }
    }

    private Map<String, Object> buildPredictionFeatures(AppointmentEntity appointment) {
        Map<String, Object> features = new HashMap<>();
        
        if (appointment.getDossier() == null) {
            return features;
        }

        Long dossierId = appointment.getDossier().getId();
        LocalDateTime now = LocalDateTime.now();

        Long cancelledCount = appointmentRepository.countByDossierIdAndStatusAndStartTimeBefore(
                dossierId, AppointmentStatus.CANCELLED, now);
        features.put("previous_cancelled_count", cancelledCount != null ? cancelledCount : 0L);

        Integer dossierScore = appointment.getDossier().getScore();
        features.put("dossier_score", dossierScore != null ? dossierScore : 0);

        Double averageResponseRate = metricsRepository.calculateAverageResponseRateForDossier(dossierId, now);
        features.put("average_response_rate", averageResponseRate != null ? averageResponseRate : 0.0);

        ReminderStrategy strategy = appointment.getReminderStrategy();
        features.put("reminder_strategy", strategy != null ? strategy.name() : ReminderStrategy.STANDARD.name());

        features.put("hours_until_appointment", 
                java.time.Duration.between(now, appointment.getStartTime()).toHours());

        return features;
    }

    private void sendAggressiveReminder(AppointmentEntity appointment, double noShowProbability) {
        if (appointment.getDossier() == null) {
            logger.warn("Appointment {} has no dossier. Skipping aggressive reminder.", appointment.getId());
            return;
        }

        Long dossierId = appointment.getDossier().getId();
        List<String> channels = getReminderChannels(appointment);
        String templateCode = getTemplateCode(appointment);
        
        Map<String, String> templateVariables = buildTemplateVariables(appointment);
        templateVariables.put("urgency", "urgent");

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
                        "Rappel urgent de rendez-vous",
                        payload,
                        "appointment_aggressive_reminder_" + appointment.getId() + "_" + channel,
                        ConsentementType.TRANSACTIONNEL
                );

                logger.info("Successfully queued aggressive reminder for appointment {} via {} to {}", 
                        appointment.getId(), channel, recipientContact);
                
                metricsService.recordReminderSentWithStrategy(
                        appointment,
                        channel.name(),
                        templateCode,
                        appointment.getAssignedTo(),
                        "SENT",
                        LocalDateTime.now(),
                        "AGGRESSIVE",
                        noShowProbability
                );
                
                reminderSent = true;
                logAggressiveReminderActivity(appointment, channel, noShowProbability);
                break;

            } catch (Exception e) {
                String reason = String.format("Error: %s", e.getMessage());
                logger.error("Failed to send aggressive reminder for appointment {} on channel {}: {}",
                        appointment.getId(), channel, e.getMessage(), e);
                failureReasons.add(reason);
            }
        }

        if (!reminderSent) {
            logger.error("Failed to send aggressive reminder for appointment {} on all channels: {}", 
                    appointment.getId(), channels);
        }
    }

    private void logAggressiveReminderActivity(AppointmentEntity appointment, MessageChannel channel, 
            double noShowProbability) {
        if (activityService == null || appointment.getDossier() == null) {
            return;
        }

        try {
            String description = String.format(
                    "Aggressive appointment reminder sent via %s (no-show probability: %.2f)",
                    channel, noShowProbability
            );

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("appointmentId", appointment.getId());
            metadata.put("channel", channel.name());
            metadata.put("noShowProbability", noShowProbability);
            metadata.put("reminderType", "AGGRESSIVE");
            metadata.put("timestamp", LocalDateTime.now().toString());

            activityService.logActivity(
                    appointment.getDossier().getId(),
                    ActivityType.MESSAGE_SENT,
                    description,
                    metadata
            );
        } catch (Exception e) {
            logger.warn("Failed to log aggressive reminder activity for appointment {}: {}", 
                    appointment.getId(), e.getMessage());
        }
    }
}
