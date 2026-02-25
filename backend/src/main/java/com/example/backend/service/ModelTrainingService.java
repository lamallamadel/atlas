package com.example.backend.service;

import com.example.backend.entity.MLModelVersion;
import com.example.backend.repository.MLModelVersionRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class ModelTrainingService {

    private static final Logger log = LoggerFactory.getLogger(ModelTrainingService.class);

    private final MLModelVersionRepository modelVersionRepository;
    private final WebClient webClient;

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    @Value("${ml.training.enabled:false}")
    private boolean trainingEnabled;

    public ModelTrainingService(
            MLModelVersionRepository modelVersionRepository, WebClient.Builder webClientBuilder) {
        this.modelVersionRepository = modelVersionRepository;
        this.webClient = webClientBuilder.baseUrl(mlServiceUrl).build();
    }

    @Scheduled(cron = "${ml.training.cron:0 0 2 1 * ?}")
    public void scheduledTraining() {
        if (!trainingEnabled) {
            log.info("ML training is disabled, skipping scheduled training");
            return;
        }

        log.info("Starting scheduled ML model training");

        List<String> orgIds =
                modelVersionRepository.findAll().stream()
                        .map(MLModelVersion::getOrgId)
                        .distinct()
                        .toList();

        for (String orgId : orgIds) {
            try {
                trainModel(orgId);
            } catch (Exception e) {
                log.error("Error training model for org {}: {}", orgId, e.getMessage(), e);
            }
        }
    }

    @Transactional
    public MLModelVersion trainModel(String orgId) {
        log.info("Starting model training for org: {}", orgId);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("org_id", orgId);

        try {
            Map<String, Object> trainingResult =
                    webClient
                            .post()
                            .uri("/api/v1/model/train")
                            .bodyValue(requestBody)
                            .retrieve()
                            .bodyToMono(Map.class)
                            .timeout(Duration.ofMinutes(30))
                            .block();

            if (trainingResult == null) {
                throw new RuntimeException("Null response from ML training service");
            }

            String status = (String) trainingResult.get("status");

            if ("insufficient_data".equals(status)) {
                log.warn(
                        "Insufficient data for training org {}: {}",
                        orgId,
                        trainingResult.get("message"));
                return null;
            }

            if (!"success".equals(status)) {
                throw new RuntimeException("Training failed: " + trainingResult.get("error"));
            }

            modelVersionRepository
                    .findActiveModel(orgId)
                    .ifPresent(
                            activeModel -> {
                                activeModel.setIsActive(false);
                                activeModel.setDeactivatedAt(LocalDateTime.now());
                                activeModel.setUpdatedAt(LocalDateTime.now());
                                modelVersionRepository.save(activeModel);
                            });

            MLModelVersion newVersion = new MLModelVersion();
            newVersion.setOrgId(orgId);
            newVersion.setVersion((String) trainingResult.get("version"));
            newVersion.setModelType("RandomForestClassifier");
            newVersion.setIsActive(true);

            Map<String, Object> metrics = (Map<String, Object>) trainingResult.get("metrics");
            if (metrics != null) {
                newVersion.setMetrics(metrics);
            }

            Integer trainingDataSize = (Integer) trainingResult.get("training_data_size");
            newVersion.setTrainingDataSize(trainingDataSize);

            newVersion.setTrainedAt(LocalDateTime.now());
            newVersion.setActivatedAt(LocalDateTime.now());
            newVersion.setCreatedAt(LocalDateTime.now());
            newVersion.setUpdatedAt(LocalDateTime.now());

            MLModelVersion saved = modelVersionRepository.save(newVersion);

            log.info(
                    "Model training completed for org {}, version: {}, metrics: {}",
                    orgId,
                    saved.getVersion(),
                    metrics);

            return saved;

        } catch (Exception e) {
            log.error("Error training model for org {}: {}", orgId, e.getMessage(), e);
            throw new RuntimeException("Failed to train model", e);
        }
    }

    @Transactional(readOnly = true)
    public List<MLModelVersion> getModelVersions(String orgId) {
        return modelVersionRepository.findByOrgIdOrderByTrainedAtDesc(orgId);
    }

    @Transactional
    public MLModelVersion rollbackToVersion(String orgId, String version) {
        MLModelVersion targetVersion =
                modelVersionRepository
                        .findByVersionAndOrgId(version, orgId)
                        .orElseThrow(
                                () -> new RuntimeException("Version " + version + " not found"));

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("org_id", orgId);
            requestBody.put("version", version);

            Map<String, Object> result =
                    webClient
                            .post()
                            .uri("/api/v1/model/rollback")
                            .bodyValue(requestBody)
                            .retrieve()
                            .bodyToMono(Map.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();

            if (result == null || !"success".equals(result.get("status"))) {
                throw new RuntimeException("Rollback failed on ML service");
            }

            modelVersionRepository
                    .findActiveModel(orgId)
                    .ifPresent(
                            activeModel -> {
                                activeModel.setIsActive(false);
                                activeModel.setDeactivatedAt(LocalDateTime.now());
                                activeModel.setUpdatedAt(LocalDateTime.now());
                                modelVersionRepository.save(activeModel);
                            });

            targetVersion.setIsActive(true);
            targetVersion.setActivatedAt(LocalDateTime.now());
            targetVersion.setUpdatedAt(LocalDateTime.now());

            MLModelVersion rolled = modelVersionRepository.save(targetVersion);

            log.info("Rolled back to model version {} for org {}", version, orgId);

            return rolled;

        } catch (Exception e) {
            log.error("Error rolling back model for org {}: {}", orgId, e.getMessage(), e);
            throw new RuntimeException("Failed to rollback model", e);
        }
    }

    @Transactional(readOnly = true)
    public MLModelVersion getActiveModel(String orgId) {
        return modelVersionRepository.findActiveModel(orgId).orElse(null);
    }
}
