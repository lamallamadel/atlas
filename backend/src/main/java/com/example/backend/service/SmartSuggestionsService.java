package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.*;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SmartSuggestionsService {

        private final UserBehaviorPatternRepository behaviorRepository;
        private final SuggestionTemplateRepository suggestionTemplateRepository;
        private final MessageTemplateRepository messageTemplateRepository;
        private final SuggestionFeedbackRepository feedbackRepository;
        private final DossierRepository dossierRepository;
        private final ActivityRepository activityRepository;
        private final AppointmentRepository appointmentRepository;
        private final AnnonceRepository annonceRepository;

        public SmartSuggestionsService(
                        UserBehaviorPatternRepository behaviorRepository,
                        SuggestionTemplateRepository suggestionTemplateRepository,
                        MessageTemplateRepository messageTemplateRepository,
                        SuggestionFeedbackRepository feedbackRepository,
                        DossierRepository dossierRepository,
                        ActivityRepository activityRepository,
                        AppointmentRepository appointmentRepository,
                        AnnonceRepository annonceRepository) {
                this.behaviorRepository = behaviorRepository;
                this.suggestionTemplateRepository = suggestionTemplateRepository;
                this.messageTemplateRepository = messageTemplateRepository;
                this.feedbackRepository = feedbackRepository;
                this.dossierRepository = dossierRepository;
                this.activityRepository = activityRepository;
                this.appointmentRepository = appointmentRepository;
                this.annonceRepository = annonceRepository;
        }

        @Transactional
        public void trackBehavior(String actionType, String contextType, Long contextId) {
                String orgId = TenantContext.getOrgId();
                String userId = getCurrentUserId();

                Optional<UserBehaviorPattern> existing = behaviorRepository
                                .findByOrgIdAndUserIdAndActionTypeAndContextTypeAndContextId(
                                                orgId, userId, actionType, contextType, contextId);

                if (existing.isPresent()) {
                        UserBehaviorPattern pattern = existing.get();
                        pattern.incrementFrequency();
                        behaviorRepository.save(pattern);
                } else {
                        UserBehaviorPattern pattern = new UserBehaviorPattern();
                        pattern.setOrgId(orgId);
                        pattern.setUserId(userId);
                        pattern.setActionType(actionType);
                        pattern.setContextType(contextType);
                        pattern.setContextId(contextId);
                        pattern.setFrequencyCount(1);
                        pattern.setLastPerformedAt(LocalDateTime.now());
                        behaviorRepository.save(pattern);
                }
        }

        @Transactional(readOnly = true)
        public List<SmartSuggestionResponse> getSuggestionsForDossier(Long dossierId) {
                String orgId = TenantContext.getOrgId();
                String userId = getCurrentUserId();

                Dossier dossier = dossierRepository
                                .findById(dossierId)
                                .orElseThrow(() -> new RuntimeException("Dossier not found"));

                List<SmartSuggestionResponse> suggestions = new ArrayList<>();

                suggestions.addAll(getStatusBasedSuggestions(dossier, orgId));
                suggestions.addAll(getInactivitySuggestions(dossier, orgId));
                suggestions.addAll(getAppointmentBasedSuggestions(dossier, orgId));
                suggestions.addAll(getBehaviorBasedSuggestions(userId, orgId, dossierId));

                return suggestions.stream()
                                .sorted(
                                                Comparator.comparing(SmartSuggestionResponse::getPriority)
                                                                .reversed()
                                                                .thenComparing(
                                                                                s -> s.getConfidenceScore() != null
                                                                                                ? s.getConfidenceScore()
                                                                                                : 0.0,
                                                                                Comparator.reverseOrder()))
                                .limit(5)
                                .collect(Collectors.toList());
        }

        private List<SmartSuggestionResponse> getStatusBasedSuggestions(Dossier dossier, String orgId) {
                List<SmartSuggestionResponse> suggestions = new ArrayList<>();

                if (dossier.getStatus() == DossierStatus.NEW) {
                        suggestions.addAll(
                                        mapTemplatesToSuggestions(
                                                        suggestionTemplateRepository.findActiveByTrigger(orgId,
                                                                        "STATUS_NEW"),
                                                        0.8,
                                                        "Dossier en statut NEW"));
                } else if (dossier.getStatus() == DossierStatus.QUALIFIED) {
                        suggestions.addAll(
                                        mapTemplatesToSuggestions(
                                                        suggestionTemplateRepository.findActiveByTrigger(
                                                                        orgId, "STATUS_QUALIFIED"),
                                                        0.9,
                                                        "Dossier qualifié"));
                }

                return suggestions;
        }

        private List<SmartSuggestionResponse> getInactivitySuggestions(Dossier dossier, String orgId) {
                List<SmartSuggestionResponse> suggestions = new ArrayList<>();
                LocalDateTime now = LocalDateTime.now();

                LocalDateTime lastActivity = activityRepository
                                .findByDossierIdOrderByCreatedAtDesc(
                                                dossier.getId(),
                                                org.springframework.data.domain.PageRequest.of(0, 1))
                                .stream()
                                .findFirst()
                                .map(ActivityEntity::getCreatedAt)
                                .orElse(dossier.getCreatedAt());

                long daysSinceActivity = ChronoUnit.DAYS.between(lastActivity, now);

                if (daysSinceActivity >= 7) {
                        suggestions.addAll(
                                        mapTemplatesToSuggestions(
                                                        suggestionTemplateRepository.findActiveByTrigger(
                                                                        orgId, "NO_ACTIVITY_7_DAYS"),
                                                        0.95,
                                                        "Aucune activité depuis " + daysSinceActivity + " jours"));
                } else if (daysSinceActivity >= 3) {
                        suggestions.addAll(
                                        mapTemplatesToSuggestions(
                                                        suggestionTemplateRepository.findActiveByTrigger(
                                                                        orgId, "DOSSIER_INACTIVE_3_DAYS"),
                                                        0.85,
                                                        "Inactif depuis " + daysSinceActivity + " jours"));
                }

                return suggestions;
        }

        private List<SmartSuggestionResponse> getAppointmentBasedSuggestions(
                        Dossier dossier, String orgId) {
                List<SmartSuggestionResponse> suggestions = new ArrayList<>();

                List<AppointmentEntity> recentAppointments = dossier.getAppointments().stream()
                                .filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED)
                                .filter(
                                                apt -> ChronoUnit.HOURS.between(
                                                                apt.getEndTime(), LocalDateTime.now()) <= 24)
                                .collect(Collectors.toList());

                if (!recentAppointments.isEmpty()) {
                        suggestions.addAll(
                                        mapTemplatesToSuggestions(
                                                        suggestionTemplateRepository.findActiveByTrigger(
                                                                        orgId, "APPOINTMENT_COMPLETED"),
                                                        0.9,
                                                        "Rendez-vous récemment complété"));
                }

                return suggestions;
        }

        private List<SmartSuggestionResponse> getBehaviorBasedSuggestions(
                        String userId, String orgId, Long dossierId) {
                List<SmartSuggestionResponse> suggestions = new ArrayList<>();

                List<UserBehaviorPattern> patterns = behaviorRepository.findTopPatternsByUser(orgId, userId).stream()
                                .limit(3)
                                .collect(Collectors.toList());

                for (UserBehaviorPattern pattern : patterns) {
                        SmartSuggestionResponse suggestion = new SmartSuggestionResponse();
                        suggestion.setSuggestionType("BEHAVIOR_PATTERN");
                        suggestion.setTitle("Action fréquente: " + pattern.getActionType());
                        suggestion.setDescription("Vous effectuez souvent cette action");
                        suggestion.setActionType(pattern.getActionType());
                        suggestion.setPriority(5);
                        suggestion.setConfidenceScore(calculateBehaviorConfidence(pattern));
                        suggestion.setReason(
                                        "Basé sur vos habitudes (" + pattern.getFrequencyCount() + " fois)");
                        suggestions.add(suggestion);
                }

                return suggestions;
        }

        private List<SmartSuggestionResponse> mapTemplatesToSuggestions(
                        List<SuggestionTemplate> templates, double confidence, String reason) {
                return templates.stream()
                                .map(
                                                template -> {
                                                        SmartSuggestionResponse response = new SmartSuggestionResponse();
                                                        response.setId(template.getId());
                                                        response.setSuggestionType(template.getSuggestionType());
                                                        response.setTitle(template.getTitle());
                                                        response.setDescription(template.getDescription());
                                                        response.setActionType(template.getActionType());
                                                        response.setActionPayload(template.getActionPayload());
                                                        response.setPriority(template.getPriority());
                                                        response.setConfidenceScore(
                                                                        adjustConfidenceWithFeedback(template,
                                                                                        confidence));
                                                        response.setReason(reason);
                                                        return response;
                                                })
                                .collect(Collectors.toList());
        }

        private double adjustConfidenceWithFeedback(
                        SuggestionTemplate template, double baseConfidence) {
                String orgId = TenantContext.getOrgId();
                Long accepted = feedbackRepository.countAcceptedBySuggestionType(
                                orgId, template.getSuggestionType());
                Long total = feedbackRepository.countTotalBySuggestionType(orgId, template.getSuggestionType());

                if (total == 0) {
                        return baseConfidence;
                }

                double acceptanceRate = (double) accepted / total;
                return (baseConfidence * 0.7) + (acceptanceRate * 0.3);
        }

        private double calculateBehaviorConfidence(UserBehaviorPattern pattern) {
                long daysSinceLastUse = ChronoUnit.DAYS.between(pattern.getLastPerformedAt(), LocalDateTime.now());
                double recencyScore = Math.max(0, 1.0 - (daysSinceLastUse / 30.0));
                double frequencyScore = Math.min(1.0, pattern.getFrequencyCount() / 20.0);
                return (recencyScore * 0.6) + (frequencyScore * 0.4);
        }

        @Transactional(readOnly = true)
        public List<MessageTemplateResponse> getMessageTemplates(String category, String channel) {
                String orgId = TenantContext.getOrgId();

                List<MessageTemplate> templates;
                if (category != null && !category.isEmpty()) {
                        templates = messageTemplateRepository.findByCategoryOrderByUsage(orgId, category);
                } else if (channel != null && !channel.isEmpty()) {
                        templates = messageTemplateRepository.findByChannelOrderByUsage(orgId, channel);
                } else {
                        templates = messageTemplateRepository.findAllActiveTemplates(orgId);
                }

                return templates.stream()
                                .map(this::mapToMessageTemplateResponse)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public PrefilledMessageResponse getPrefilledMessage(Long templateId, Long dossierId) {
                String orgId = TenantContext.getOrgId();

                MessageTemplate template = messageTemplateRepository
                                .findById(templateId)
                                .orElseThrow(() -> new RuntimeException("Template not found"));

                Dossier dossier = dossierRepository
                                .findById(dossierId)
                                .orElseThrow(() -> new RuntimeException("Dossier not found"));

                Map<String, String> variables = buildVariablesMap(dossier);
                String filledContent = fillTemplate(template.getContent(), variables);
                String filledSubject = template.getSubject() != null
                                ? fillTemplate(template.getSubject(), variables)
                                : null;

                PrefilledMessageResponse response = new PrefilledMessageResponse();
                response.setTemplateId(templateId);
                response.setTemplateName(template.getName());
                response.setChannel(template.getChannel());
                response.setSubject(filledSubject);
                response.setContent(filledContent);

                return response;
        }

        @Transactional
        public void recordTemplateUsage(Long templateId) {
                MessageTemplate template = messageTemplateRepository
                                .findById(templateId)
                                .orElseThrow(() -> new RuntimeException("Template not found"));
                template.incrementUsageCount();
                messageTemplateRepository.save(template);
        }

        @Transactional
        public void submitFeedback(
                        String suggestionType,
                        String contextType,
                        Long contextId,
                        boolean wasAccepted,
                        String feedbackText) {
                String orgId = TenantContext.getOrgId();
                String userId = getCurrentUserId();

                SuggestionFeedback feedback = new SuggestionFeedback();
                feedback.setOrgId(orgId);
                feedback.setUserId(userId);
                feedback.setSuggestionType(suggestionType);
                feedback.setContextType(contextType);
                feedback.setContextId(contextId);
                feedback.setWasAccepted(wasAccepted);
                feedback.setFeedbackText(feedbackText);

                feedbackRepository.save(feedback);
        }

        private Map<String, String> buildVariablesMap(Dossier dossier) {
                Map<String, String> variables = new HashMap<>();
                variables.put("leadName", dossier.getLeadName() != null ? dossier.getLeadName() : "Client");
                variables.put("leadPhone", dossier.getLeadPhone() != null ? dossier.getLeadPhone() : "");
                variables.put("leadEmail", dossier.getLeadEmail() != null ? dossier.getLeadEmail() : "");

                if (dossier.getAnnonceId() != null) {
                        annonceRepository
                                        .findById(dossier.getAnnonceId())
                                        .ifPresent(
                                                        annonce -> {
                                                                variables.put(
                                                                                "annonceTitle",
                                                                                annonce.getTitle() != null
                                                                                                ? annonce.getTitle()
                                                                                                : "le bien");
                                                                variables.put(
                                                                                "annonceCity",
                                                                                annonce.getCity() != null
                                                                                                ? annonce.getCity()
                                                                                                : "");
                                                        });
                } else {
                        variables.put("annonceTitle", "le bien");
                        variables.put("annonceCity", "");
                }

                variables.put("proposedDate", "prochainement");

                return variables;
        }

        private String fillTemplate(String template, Map<String, String> variables) {
                String result = template;
                for (Map.Entry<String, String> entry : variables.entrySet()) {
                        result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
                }
                return result;
        }

        private MessageTemplateResponse mapToMessageTemplateResponse(MessageTemplate template) {
                MessageTemplateResponse response = new MessageTemplateResponse();
                response.setId(template.getId());
                response.setName(template.getName());
                response.setCategory(template.getCategory());
                response.setChannel(template.getChannel());
                response.setSubject(template.getSubject());
                response.setContent(template.getContent());
                response.setVariables(template.getVariables());
                response.setUsageCount(template.getUsageCount());
                return response;
        }

        private String getCurrentUserId() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                return authentication != null ? authentication.getName() : "system";
        }
}
