package com.example.backend.service;

import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.ConversationStateEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.ConversationState;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationResponseService {

    private static final Logger log = LoggerFactory.getLogger(ConversationResponseService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final OutboundMessageService outboundMessageService;
    private final AppointmentRepository appointmentRepository;
    private final DossierRepository dossierRepository;

    public ConversationResponseService(
            OutboundMessageService outboundMessageService,
            AppointmentRepository appointmentRepository,
            DossierRepository dossierRepository) {
        this.outboundMessageService = outboundMessageService;
        this.appointmentRepository = appointmentRepository;
        this.dossierRepository = dossierRepository;
    }

    @Transactional
    public void sendConfirmationResponse(ConversationStateEntity conversation) {
        String message = buildConfirmationMessage(conversation);
        sendResponse(conversation, message, "appointment_confirmation_received");
    }

    @Transactional
    public void sendCancellationResponse(ConversationStateEntity conversation) {
        String message = buildCancellationMessage(conversation);
        sendResponse(conversation, message, "appointment_cancellation_received");
    }

    @Transactional
    public void sendRescheduleResponse(ConversationStateEntity conversation) {
        String message = buildRescheduleMessage(conversation);
        sendResponse(conversation, message, "appointment_reschedule_received");
    }

    @Transactional
    public void sendUnknownIntentResponse(ConversationStateEntity conversation) {
        String message = buildUnknownIntentMessage(conversation);
        sendResponse(conversation, message, "conversation_clarification_needed");
    }

    private void sendResponse(
            ConversationStateEntity conversation, String messageBody, String idempotencyKey) {
        try {
            if (conversation.getDossierId() == null) {
                log.warn("Cannot send response: conversation has no dossier");
                return;
            }

            Dossier dossier = dossierRepository.findById(conversation.getDossierId()).orElse(null);
            if (dossier == null) {
                log.warn("Cannot send response: dossier {} not found", conversation.getDossierId());
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("body", messageBody);

            outboundMessageService.createOutboundMessage(
                    conversation.getDossierId(),
                    MessageChannel.WHATSAPP,
                    conversation.getPhoneNumber(),
                    null,
                    "Réponse automatique",
                    payload,
                    idempotencyKey + "_" + conversation.getId(),
                    ConsentementType.TRANSACTIONNEL);

            log.info("Sent conversation response to {} for conversation {}", 
                    conversation.getPhoneNumber(), conversation.getId());
        } catch (Exception e) {
            log.error("Failed to send conversation response", e);
        }
    }

    private String buildConfirmationMessage(ConversationStateEntity conversation) {
        AppointmentEntity appointment = getAppointment(conversation);
        if (appointment == null) {
            return "Merci pour votre confirmation ! Nous avons bien enregistré votre rendez-vous.";
        }

        String dateStr = appointment.getStartTime().format(DATE_FORMATTER);
        String timeStr = appointment.getStartTime().format(TIME_FORMATTER);
        String location = appointment.getLocation() != null ? appointment.getLocation() : "notre agence";

        return String.format(
                "✅ Parfait ! Votre rendez-vous du %s à %s à %s est confirmé. Nous vous attendons !",
                dateStr, timeStr, location);
    }

    private String buildCancellationMessage(ConversationStateEntity conversation) {
        AppointmentEntity appointment = getAppointment(conversation);
        if (appointment == null) {
            return "Votre rendez-vous a bien été annulé. N'hésitez pas à nous contacter pour reprogrammer.";
        }

        String dateStr = appointment.getStartTime().format(DATE_FORMATTER);

        return String.format(
                "Votre rendez-vous du %s a bien été annulé. N'hésitez pas à nous recontacter pour fixer une nouvelle date.",
                dateStr);
    }

    private String buildRescheduleMessage(ConversationStateEntity conversation) {
        return "Nous avons bien noté votre demande de report. Un membre de notre équipe vous recontactera pour convenir d'une nouvelle date. Merci !";
    }

    private String buildUnknownIntentMessage(ConversationStateEntity conversation) {
        AppointmentEntity appointment = getAppointment(conversation);
        if (appointment == null) {
            return "Je n'ai pas bien compris votre message. Pour confirmer votre rendez-vous, répondez 'OUI'. Pour annuler, répondez 'ANNULER'. Pour changer la date, répondez 'REPORTER'.";
        }

        String dateStr = appointment.getStartTime().format(DATE_FORMATTER);
        String timeStr = appointment.getStartTime().format(TIME_FORMATTER);

        return String.format(
                "Je n'ai pas bien compris votre message concernant votre rendez-vous du %s à %s.\n\n"
                        + "Pour confirmer, répondez 'OUI'\n"
                        + "Pour annuler, répondez 'ANNULER'\n"
                        + "Pour changer la date, répondez 'REPORTER'",
                dateStr, timeStr);
    }

    private AppointmentEntity getAppointment(ConversationStateEntity conversation) {
        if (conversation.getAppointmentId() == null) {
            return null;
        }
        return appointmentRepository.findById(conversation.getAppointmentId()).orElse(null);
    }
}
