package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.*;
import com.example.backend.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LeadScoringEngine {

    private static final Logger log = LoggerFactory.getLogger(LeadScoringEngine.class);

    private final LeadScoringConfigRepository configRepository;
    private final LeadScoreRepository leadScoreRepository;
    private final MessageRepository messageRepository;
    private final AppointmentRepository appointmentRepository;
    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;

    public LeadScoringEngine(LeadScoringConfigRepository configRepository,
                            LeadScoreRepository leadScoreRepository,
                            MessageRepository messageRepository,
                            AppointmentRepository appointmentRepository,
                            AnnonceRepository annonceRepository,
                            DossierRepository dossierRepository) {
        this.configRepository = configRepository;
        this.leadScoreRepository = leadScoreRepository;
        this.messageRepository = messageRepository;
        this.appointmentRepository = appointmentRepository;
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
    }

    @Transactional
    public LeadScore calculateScore(Dossier dossier) {
        String orgId = dossier.getOrgId();
        LeadScoringConfig config = configRepository.findActiveConfig(orgId)
                .orElseGet(() -> createDefaultConfig(orgId));

        LeadScore leadScore = leadScoreRepository.findByDossierId(dossier.getId())
                .orElse(new LeadScore());
        
        leadScore.setDossierId(dossier.getId());
        leadScore.setOrgId(orgId);

        int sourceScore = calculateSourceScore(dossier, config);
        int responseTimeScore = calculateResponseTimeScore(dossier, config);
        int engagementScore = calculateEngagementScore(dossier, config);
        int propertyMatchScore = calculatePropertyMatchScore(dossier, config);

        leadScore.setSourceScore(sourceScore);
        leadScore.setResponseTimeScore(responseTimeScore);
        leadScore.setEngagementScore(engagementScore);
        leadScore.setPropertyMatchScore(propertyMatchScore);
        leadScore.setTotalScore(sourceScore + responseTimeScore + engagementScore + propertyMatchScore);

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("sourceScore", sourceScore);
        breakdown.put("responseTimeScore", responseTimeScore);
        breakdown.put("engagementScore", engagementScore);
        breakdown.put("propertyMatchScore", propertyMatchScore);
        breakdown.put("configId", config.getId());
        leadScore.setScoreBreakdown(breakdown);

        leadScore.setLastCalculatedAt(LocalDateTime.now());
        leadScore.setCreatedAt(LocalDateTime.now());
        leadScore.setUpdatedAt(LocalDateTime.now());

        LeadScore saved = leadScoreRepository.save(leadScore);

        dossier.setScore(saved.getTotalScore());
        dossierRepository.save(dossier);

        log.info("Calculated lead score for dossier {}: total={}, source={}, responseTime={}, engagement={}, propertyMatch={}",
                dossier.getId(), saved.getTotalScore(), sourceScore, responseTimeScore, engagementScore, propertyMatchScore);

        return saved;
    }

    private int calculateSourceScore(Dossier dossier, LeadScoringConfig config) {
        if (dossier.getSource() == null) {
            return 0;
        }
        
        String sourceKey = dossier.getSource().getValue();
        return config.getSourceWeights().getOrDefault(sourceKey, 10);
    }

    private int calculateResponseTimeScore(Dossier dossier, LeadScoringConfig config) {
        List<MessageEntity> messages = messageRepository.findByDossierIdWithFiltersUnpaged(
                dossier.getId(), null, MessageDirection.OUTBOUND, null, null);

        if (messages.isEmpty()) {
            return 0;
        }

        LocalDateTime firstOutboundMessage = messages.stream()
                .map(MessageEntity::getTimestamp)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        if (firstOutboundMessage == null) {
            return 0;
        }

        long minutesElapsed = Duration.between(dossier.getCreatedAt(), firstOutboundMessage).toMinutes();

        if (minutesElapsed <= config.getFastResponseMinutes()) {
            return config.getResponseTimeWeight();
        } else if (minutesElapsed <= config.getMediumResponseMinutes()) {
            return config.getResponseTimeWeight() / 2;
        } else {
            return 0;
        }
    }

    private int calculateEngagementScore(Dossier dossier, LeadScoringConfig config) {
        int score = 0;
        
        List<MessageEntity> inboundMessages = messageRepository.findByDossierIdWithFiltersUnpaged(
                dossier.getId(), null, MessageDirection.INBOUND, null, null);
        score += config.getEngagementWeights().getOrDefault("inboundMessage", 5) * Math.min(inboundMessages.size(), 5);

        List<MessageEntity> outboundMessages = messageRepository.findByDossierIdWithFiltersUnpaged(
                dossier.getId(), null, MessageDirection.OUTBOUND, null, null);
        score += config.getEngagementWeights().getOrDefault("outboundMessage", 2) * Math.min(outboundMessages.size(), 10);

        List<AppointmentEntity> appointments = appointmentRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("dossier").get("id"), dossier.getId()));
        score += config.getEngagementWeights().getOrDefault("appointment", 15) * appointments.size();

        return Math.min(score, 50);
    }

    private int calculatePropertyMatchScore(Dossier dossier, LeadScoringConfig config) {
        if (dossier.getAnnonceId() == null) {
            return 0;
        }

        Annonce annonce = annonceRepository.findById(dossier.getAnnonceId()).orElse(null);
        if (annonce == null) {
            return config.getPropertyMatchWeights().getOrDefault("noProperty", 0);
        }

        int score = config.getPropertyMatchWeights().getOrDefault("hasProperty", 10);

        if (annonce.getPrice() != null) {
            score += config.getPropertyMatchWeights().getOrDefault("hasPrice", 5);
        }

        if (annonce.getPhotos() != null && !annonce.getPhotos().isEmpty()) {
            score += config.getPropertyMatchWeights().getOrDefault("hasPhotos", 5);
        }

        return score;
    }

    private LeadScoringConfig createDefaultConfig(String orgId) {
        LeadScoringConfig config = new LeadScoringConfig();
        config.setOrgId(orgId);
        config.setConfigName("Default Configuration");
        config.setIsActive(true);
        config.setAutoQualificationThreshold(70);
        config.setResponseTimeWeight(20);
        config.setFastResponseMinutes(60);
        config.setMediumResponseMinutes(240);

        Map<String, Integer> sourceWeights = new HashMap<>();
        sourceWeights.put("referral", 25);
        sourceWeights.put("web", 15);
        sourceWeights.put("social_media", 12);
        sourceWeights.put("email", 10);
        sourceWeights.put("phone", 20);
        sourceWeights.put("walk_in", 18);
        sourceWeights.put("mobile", 15);
        sourceWeights.put("unknown", 5);
        config.setSourceWeights(sourceWeights);

        Map<String, Integer> engagementWeights = new HashMap<>();
        engagementWeights.put("inboundMessage", 5);
        engagementWeights.put("outboundMessage", 2);
        engagementWeights.put("appointment", 15);
        config.setEngagementWeights(engagementWeights);

        Map<String, Integer> propertyMatchWeights = new HashMap<>();
        propertyMatchWeights.put("noProperty", 0);
        propertyMatchWeights.put("hasProperty", 10);
        propertyMatchWeights.put("hasPrice", 5);
        propertyMatchWeights.put("hasPhotos", 5);
        config.setPropertyMatchWeights(propertyMatchWeights);

        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());

        return configRepository.save(config);
    }

    @Transactional(readOnly = true)
    public LeadScore getScore(Long dossierId) {
        return leadScoreRepository.findByDossierId(dossierId).orElse(null);
    }
}
