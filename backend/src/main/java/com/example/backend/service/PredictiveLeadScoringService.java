package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.repository.*;
import com.example.backend.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PredictiveLeadScoringService {

    private static final Logger log = LoggerFactory.getLogger(PredictiveLeadScoringService.class);

    private final MLPredictionRepository predictionRepository;
    private final MLModelVersionRepository modelVersionRepository;
    private final LeadScoreRepository leadScoreRepository;
    private final MessageRepository messageRepository;
    private final AppointmentRepository appointmentRepository;
    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final WebClient webClient;

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    public PredictiveLeadScoringService(MLPredictionRepository predictionRepository,
                                       MLModelVersionRepository modelVersionRepository,
                                       LeadScoreRepository leadScoreRepository,
                                       MessageRepository messageRepository,
                                       AppointmentRepository appointmentRepository,
                                       AnnonceRepository annonceRepository,
                                       DossierRepository dossierRepository,
                                       WebClient.Builder webClientBuilder) {
        this.predictionRepository = predictionRepository;
        this.modelVersionRepository = modelVersionRepository;
        this.leadScoreRepository = leadScoreRepository;
        this.messageRepository = messageRepository;
        this.appointmentRepository = appointmentRepository;
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.webClient = webClientBuilder.baseUrl(mlServiceUrl).build();
    }

    @Transactional
    public MLPrediction predictLeadConversion(Dossier dossier) {
        String orgId = dossier.getOrgId();
        
        Map<String, Object> features = extractFeatures(dossier);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("org_id", orgId);
        requestBody.put("features", features);

        try {
            Map<String, Object> predictionResult = webClient.post()
                .uri("/api/v1/predict")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(10))
                .block();

            if (predictionResult == null) {
                throw new RuntimeException("Null response from ML service");
            }

            MLPrediction prediction = new MLPrediction();
            prediction.setDossierId(dossier.getId());
            prediction.setOrgId(orgId);
            prediction.setModelVersion((String) predictionResult.get("model_version"));
            prediction.setPrediction((Integer) predictionResult.get("prediction"));
            prediction.setConversionProbability(
                ((Number) predictionResult.get("conversion_probability")).doubleValue()
            );
            prediction.setConfidence(
                ((Number) predictionResult.get("confidence")).doubleValue()
            );
            prediction.setRecommendedAction((String) predictionResult.get("recommended_action"));
            
            if (predictionResult.containsKey("feature_contributions")) {
                prediction.setFeatureContributions(
                    (Map<String, Object>) predictionResult.get("feature_contributions")
                );
            }
            
            prediction.setPredictedAt(LocalDateTime.now());
            prediction.setCreatedAt(LocalDateTime.now());
            prediction.setUpdatedAt(LocalDateTime.now());

            MLPrediction saved = predictionRepository.save(prediction);

            log.info("ML prediction for dossier {}: probability={}, action={}", 
                dossier.getId(), 
                saved.getConversionProbability(), 
                saved.getRecommendedAction());

            return saved;

        } catch (Exception e) {
            log.error("Error getting ML prediction for dossier {}: {}", dossier.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to get ML prediction", e);
        }
    }

    private Map<String, Object> extractFeatures(Dossier dossier) {
        Map<String, Object> features = new HashMap<>();
        
        LeadScore leadScore = leadScoreRepository.findByDossierId(dossier.getId()).orElse(null);
        if (leadScore != null) {
            features.put("lead_source_score", leadScore.getSourceScore());
            features.put("response_time_minutes", 
                leadScore.getResponseTimeScore() != null ? leadScore.getResponseTimeScore() * 3 : 120);
        } else {
            features.put("lead_source_score", 10);
            features.put("response_time_minutes", 120);
        }

        List<MessageEntity> inboundMessages = messageRepository.findByDossierIdWithFiltersUnpaged(
            dossier.getId(), null, com.example.backend.entity.enums.MessageDirection.INBOUND, null, null);
        features.put("inbound_messages_count", inboundMessages.size());

        List<MessageEntity> outboundMessages = messageRepository.findByDossierIdWithFiltersUnpaged(
            dossier.getId(), null, com.example.backend.entity.enums.MessageDirection.OUTBOUND, null, null);
        features.put("outbound_messages_count", outboundMessages.size());

        List<AppointmentEntity> appointments = appointmentRepository.findAll(
            (root, query, cb) -> cb.equal(root.get("dossier").get("id"), dossier.getId()));
        features.put("appointments_count", appointments.size());

        double engagementRate = outboundMessages.size() > 0 
            ? (double) inboundMessages.size() / outboundMessages.size() 
            : 0.0;
        features.put("engagement_rate", engagementRate);

        long daysSinceCreation = Duration.between(dossier.getCreatedAt(), LocalDateTime.now()).toDays();
        features.put("days_since_creation", daysSinceCreation);

        if (dossier.getAnnonceId() != null) {
            Annonce annonce = annonceRepository.findById(dossier.getAnnonceId()).orElse(null);
            if (annonce != null) {
                features.put("has_property", 1);
                features.put("property_price", annonce.getPrice() != null ? annonce.getPrice() : 0);
                features.put("property_has_photos", 
                    annonce.getPhotos() != null && !annonce.getPhotos().isEmpty() ? 1 : 0);
            } else {
                features.put("has_property", 0);
                features.put("property_price", 0);
                features.put("property_has_photos", 0);
            }
        } else {
            features.put("has_property", 0);
            features.put("property_price", 0);
            features.put("property_has_photos", 0);
        }

        features.put("market_activity_score", 50);

        return features;
    }

    @Transactional(readOnly = true)
    public MLPrediction getLatestPrediction(Long dossierId) {
        return predictionRepository.findTopByDossierIdOrderByPredictedAtDesc(dossierId)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<MLPrediction> getPredictionHistory(Long dossierId) {
        return predictionRepository.findByDossierIdOrderByPredictedAtDesc(dossierId);
    }

    public Map<String, Object> getFeatureImportance(String orgId) {
        try {
            return webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/v1/model/feature-importance")
                    .queryParam("org_id", orgId)
                    .build())
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(10))
                .block();
        } catch (Exception e) {
            log.error("Error getting feature importance: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get feature importance", e);
        }
    }

    public Map<String, Object> getModelInfo(String orgId) {
        try {
            return webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/v1/model/info")
                    .queryParam("org_id", orgId)
                    .build())
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(10))
                .block();
        } catch (Exception e) {
            log.error("Error getting model info: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get model info", e);
        }
    }

    @Transactional
    public void recordActualOutcome(Long dossierId, Integer outcome) {
        MLPrediction prediction = predictionRepository.findTopByDossierIdOrderByPredictedAtDesc(dossierId)
            .orElse(null);
        
        if (prediction != null) {
            prediction.setActualOutcome(outcome);
            prediction.setOutcomeRecordedAt(LocalDateTime.now());
            prediction.setUpdatedAt(LocalDateTime.now());
            predictionRepository.save(prediction);
            
            log.info("Recorded actual outcome for dossier {}: {}", dossierId, outcome);
        }
    }
}
