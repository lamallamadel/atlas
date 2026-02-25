package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ActivityVisibility;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.ConversationState;
import com.example.backend.repository.*;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationStateManager {

    private static final Logger log = LoggerFactory.getLogger(ConversationStateManager.class);

    private static final int CONVERSATION_EXPIRY_HOURS = 24;

    private final ConversationStateRepository conversationStateRepository;
    private final InboundMessageRepository inboundMessageRepository;
    private final AppointmentRepository appointmentRepository;
    private final ActivityRepository activityRepository;
    private final DossierRepository dossierRepository;
    private final SmartSuggestionsService smartSuggestionsService;
    private final ConversationResponseService conversationResponseService;

    public ConversationStateManager(
            ConversationStateRepository conversationStateRepository,
            InboundMessageRepository inboundMessageRepository,
            AppointmentRepository appointmentRepository,
            ActivityRepository activityRepository,
            DossierRepository dossierRepository,
            SmartSuggestionsService smartSuggestionsService,
            ConversationResponseService conversationResponseService) {
        this.conversationStateRepository = conversationStateRepository;
        this.inboundMessageRepository = inboundMessageRepository;
        this.appointmentRepository = appointmentRepository;
        this.activityRepository = activityRepository;
        this.dossierRepository = dossierRepository;
        this.smartSuggestionsService = smartSuggestionsService;
        this.conversationResponseService = conversationResponseService;
    }

    @Transactional
    public void processInboundMessage(String orgId, String phoneNumber, String messageBody, String providerMessageId) {
        log.info("Processing inbound message from {} for org {}", phoneNumber, orgId);

        InboundMessageEntity inboundMessage = new InboundMessageEntity();
        inboundMessage.setOrgId(orgId);
        inboundMessage.setPhoneNumber(phoneNumber);
        inboundMessage.setMessageBody(messageBody);
        inboundMessage.setProviderMessageId(providerMessageId);
        inboundMessage.setReceivedAt(LocalDateTime.now());
        inboundMessageRepository.save(inboundMessage);

        Optional<ConversationStateEntity> activeConversation =
                conversationStateRepository.findActiveConversation(orgId, phoneNumber, LocalDateTime.now());

        if (activeConversation.isPresent()) {
            handleConversationReply(activeConversation.get(), messageBody, inboundMessage.getId());
        } else {
            log.info("No active conversation found for phone number {}", phoneNumber);
        }

        inboundMessage.setProcessedAt(LocalDateTime.now());
        inboundMessageRepository.save(inboundMessage);
    }

    @Transactional
    public void initializeConversation(
            String orgId, String phoneNumber, Long appointmentId, Long dossierId) {
        log.info(
                "Initializing conversation for appointment {} with phone {}",
                appointmentId,
                phoneNumber);

        Optional<ConversationStateEntity> existing =
                conversationStateRepository.findActiveConversation(
                        orgId, phoneNumber, LocalDateTime.now());
        if (existing.isPresent()) {
            log.info("Active conversation already exists, updating appointment context");
            ConversationStateEntity state = existing.get();
            state.setAppointmentId(appointmentId);
            state.setDossierId(dossierId);
            state.setExpiresAt(LocalDateTime.now().plusHours(CONVERSATION_EXPIRY_HOURS));
            conversationStateRepository.save(state);
            return;
        }

        ConversationStateEntity conversationState = new ConversationStateEntity();
        conversationState.setOrgId(orgId);
        conversationState.setPhoneNumber(phoneNumber);
        conversationState.setState(ConversationState.AWAITING_CONFIRMATION);
        conversationState.setAppointmentId(appointmentId);
        conversationState.setDossierId(dossierId);
        conversationState.setExpiresAt(LocalDateTime.now().plusHours(CONVERSATION_EXPIRY_HOURS));

        Map<String, Object> contextData = new HashMap<>();
        contextData.put("initiated_at", LocalDateTime.now().toString());
        contextData.put("appointment_id", appointmentId);
        conversationState.setContextData(contextData);

        conversationStateRepository.save(conversationState);

        if (dossierId != null) {
            logActivityForConversation(
                    dossierId,
                    ActivityType.CONVERSATION_STARTED,
                    "Conversation de confirmation de rendez-vous démarrée",
                    appointmentId);
        }
    }

    private void handleConversationReply(
            ConversationStateEntity conversation, String messageBody, Long inboundMessageId) {
        String normalizedMessage = messageBody.toLowerCase().trim();

        ConversationIntent intent = classifyIntent(normalizedMessage);
        log.info(
                "Classified intent: {} for message: {}",
                intent,
                normalizedMessage.substring(0, Math.min(50, normalizedMessage.length())));

        switch (conversation.getState()) {
            case AWAITING_CONFIRMATION:
                handleAwaitingConfirmationState(conversation, intent, messageBody);
                break;
            case CONFIRMED:
            case CANCELLED:
            case RESCHEDULED:
                log.info("Conversation already in terminal state: {}", conversation.getState());
                break;
            default:
                log.warn("Unhandled conversation state: {}", conversation.getState());
        }

        if (conversation.getDossierId() != null) {
            logActivityForConversation(
                    conversation.getDossierId(),
                    ActivityType.CONVERSATION_REPLY,
                    "Client a répondu: " + messageBody,
                    conversation.getAppointmentId());
        }
    }

    private void handleAwaitingConfirmationState(
            ConversationStateEntity conversation, ConversationIntent intent, String messageBody) {
        switch (intent) {
            case CONFIRM:
                handleConfirmation(conversation);
                break;
            case CANCEL:
                handleCancellation(conversation);
                break;
            case RESCHEDULE:
                handleRescheduleRequest(conversation);
                break;
            case UNKNOWN:
            default:
                log.info("Unable to determine clear intent from message: {}", messageBody);
                updateContextData(
                        conversation,
                        "last_unclear_message",
                        messageBody,
                        "unclear_message_count",
                        1);
                conversationResponseService.sendUnknownIntentResponse(conversation);
                break;
        }
    }

    private void handleConfirmation(ConversationStateEntity conversation) {
        log.info("Handling confirmation for appointment {}", conversation.getAppointmentId());

        conversation.setState(ConversationState.CONFIRMED);
        updateContextData(conversation, "confirmed_at", LocalDateTime.now().toString(), null, null);
        conversationStateRepository.save(conversation);

        if (conversation.getAppointmentId() != null) {
            AppointmentEntity appointment =
                    appointmentRepository
                            .findById(conversation.getAppointmentId())
                            .orElse(null);
            if (appointment != null) {
                appointment.setStatus(AppointmentStatus.CONFIRMED);
                appointmentRepository.save(appointment);
                log.info("Updated appointment {} status to CONFIRMED", appointment.getId());
            }
        }

        if (conversation.getDossierId() != null) {
            logActivityForConversation(
                    conversation.getDossierId(),
                    ActivityType.APPOINTMENT_CONFIRMED,
                    "Le client a confirmé le rendez-vous",
                    conversation.getAppointmentId());
        }

        conversationResponseService.sendConfirmationResponse(conversation);
    }

    private void handleCancellation(ConversationStateEntity conversation) {
        log.info("Handling cancellation for appointment {}", conversation.getAppointmentId());

        conversation.setState(ConversationState.CANCELLED);
        updateContextData(conversation, "cancelled_at", LocalDateTime.now().toString(), null, null);
        conversationStateRepository.save(conversation);

        if (conversation.getAppointmentId() != null) {
            AppointmentEntity appointment =
                    appointmentRepository
                            .findById(conversation.getAppointmentId())
                            .orElse(null);
            if (appointment != null) {
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointmentRepository.save(appointment);
                log.info("Updated appointment {} status to CANCELLED", appointment.getId());
            }
        }

        if (conversation.getDossierId() != null) {
            logActivityForConversation(
                    conversation.getDossierId(),
                    ActivityType.APPOINTMENT_CANCELLED_BY_CLIENT,
                    "Le client a annulé le rendez-vous",
                    conversation.getAppointmentId());
        }

        conversationResponseService.sendCancellationResponse(conversation);
    }

    private void handleRescheduleRequest(ConversationStateEntity conversation) {
        log.info("Handling reschedule request for appointment {}", conversation.getAppointmentId());

        conversation.setState(ConversationState.RESCHEDULED);
        updateContextData(
                conversation, "reschedule_requested_at", LocalDateTime.now().toString(), null, null);
        conversationStateRepository.save(conversation);

        if (conversation.getAppointmentId() != null) {
            AppointmentEntity appointment =
                    appointmentRepository
                            .findById(conversation.getAppointmentId())
                            .orElse(null);
            if (appointment != null) {
                appointment.setStatus(AppointmentStatus.RESCHEDULED);
                appointmentRepository.save(appointment);
                log.info("Updated appointment {} status to RESCHEDULED", appointment.getId());
            }
        }

        if (conversation.getDossierId() != null) {
            logActivityForConversation(
                    conversation.getDossierId(),
                    ActivityType.APPOINTMENT_RESCHEDULED_BY_CLIENT,
                    "Le client a demandé à reprogrammer le rendez-vous",
                    conversation.getAppointmentId());
        }

        conversationResponseService.sendRescheduleResponse(conversation);
    }

    private ConversationIntent classifyIntent(String normalizedMessage) {
        if (matchesConfirmationKeywords(normalizedMessage)) {
            return ConversationIntent.CONFIRM;
        } else if (matchesCancellationKeywords(normalizedMessage)) {
            return ConversationIntent.CANCEL;
        } else if (matchesRescheduleKeywords(normalizedMessage)) {
            return ConversationIntent.RESCHEDULE;
        }

        ConversationIntent nlpIntent = classifyIntentUsingNLP(normalizedMessage);
        if (nlpIntent != ConversationIntent.UNKNOWN) {
            return nlpIntent;
        }

        return ConversationIntent.UNKNOWN;
    }

    private ConversationIntent classifyIntentUsingNLP(String message) {
        try {
            double confirmConfidence = calculateSemanticSimilarity(message, "je confirme le rendez-vous");
            double cancelConfidence = calculateSemanticSimilarity(message, "je veux annuler le rendez-vous");
            double rescheduleConfidence = calculateSemanticSimilarity(message, "je veux changer la date");

            double maxConfidence = Math.max(confirmConfidence, Math.max(cancelConfidence, rescheduleConfidence));

            if (maxConfidence > 0.7) {
                if (maxConfidence == confirmConfidence) {
                    return ConversationIntent.CONFIRM;
                } else if (maxConfidence == cancelConfidence) {
                    return ConversationIntent.CANCEL;
                } else if (maxConfidence == rescheduleConfidence) {
                    return ConversationIntent.RESCHEDULE;
                }
            }
        } catch (Exception e) {
            log.debug("NLP classification failed, using keyword fallback", e);
        }
        return ConversationIntent.UNKNOWN;
    }

    private double calculateSemanticSimilarity(String message1, String message2) {
        Set<String> words1 = new HashSet<>(Arrays.asList(message1.split("\\s+")));
        Set<String> words2 = new HashSet<>(Arrays.asList(message2.split("\\s+")));

        Set<String> intersection = new HashSet<>(words1);
        intersection.retainAll(words2);

        Set<String> union = new HashSet<>(words1);
        union.addAll(words2);

        if (union.isEmpty()) {
            return 0.0;
        }

        return (double) intersection.size() / union.size();
    }

    private boolean matchesConfirmationKeywords(String message) {
        String[] confirmKeywords = {
            "oui",
            "yes",
            "ok",
            "confirme",
            "confirmer",
            "confirmé",
            "d'accord",
            "daccord",
            "accord",
            "bien reçu",
            "parfait",
            "très bien"
        };

        for (String keyword : confirmKeywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesCancellationKeywords(String message) {
        String[] cancelKeywords = {
            "annule",
            "annuler",
            "annulé",
            "cancel",
            "cancelled",
            "non",
            "no",
            "pas possible",
            "impossible",
            "ne peux pas",
            "ne peut pas"
        };

        for (String keyword : cancelKeywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesRescheduleKeywords(String message) {
        String[] rescheduleKeywords = {
            "reprogrammer",
            "reporter",
            "décaler",
            "decaler",
            "changer",
            "reschedule",
            "autre date",
            "autre jour",
            "autre heure",
            "plus tard",
            "plus tôt"
        };

        for (String keyword : rescheduleKeywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private void updateContextData(
            ConversationStateEntity conversation,
            String key,
            String value,
            String counterKey,
            Integer counterIncrement) {
        Map<String, Object> contextData = conversation.getContextData();
        if (contextData == null) {
            contextData = new HashMap<>();
        }

        if (key != null && value != null) {
            contextData.put(key, value);
        }

        if (counterKey != null && counterIncrement != null) {
            int currentCount =
                    contextData.containsKey(counterKey)
                            ? ((Number) contextData.get(counterKey)).intValue()
                            : 0;
            contextData.put(counterKey, currentCount + counterIncrement);
        }

        conversation.setContextData(contextData);
    }

    private void logActivityForConversation(
            Long dossierId, ActivityType activityType, String content, Long appointmentId) {
        try {
            Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
            if (dossier == null) {
                log.warn("Dossier {} not found, cannot log activity", dossierId);
                return;
            }

            ActivityEntity activity = new ActivityEntity();
            activity.setOrgId(TenantContext.getOrgId());
            activity.setDossier(dossier);
            activity.setType(activityType);
            activity.setContent(content);
            activity.setVisibility(ActivityVisibility.INTERNAL);

            if (appointmentId != null) {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("appointment_id", appointmentId);
                metadata.put("source", "whatsapp_conversation");
                activity.setMetadata(metadata);
            }

            activityRepository.save(activity);
            log.info("Logged activity for dossier {}: {}", dossierId, activityType);
        } catch (Exception e) {
            log.error("Error logging activity for dossier {}", dossierId, e);
        }
    }

    @Transactional
    public void expireOldConversations() {
        LocalDateTime now = LocalDateTime.now();
        int expiredCount =
                conversationStateRepository.expireOldConversations(
                        ConversationState.AWAITING_CONFIRMATION, ConversationState.EXPIRED, now);
        log.info("Expired {} old conversations", expiredCount);
    }

    private enum ConversationIntent {
        CONFIRM,
        CANCEL,
        RESCHEDULE,
        UNKNOWN
    }
}
