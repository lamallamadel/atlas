package com.example.backend.service;

import com.example.backend.entity.ABTestExperiment;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MLPrediction;
import com.example.backend.repository.ABTestExperimentRepository;
import com.example.backend.repository.MLPredictionRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ABTestingService {

    private static final Logger log = LoggerFactory.getLogger(ABTestingService.class);

    private final ABTestExperimentRepository experimentRepository;
    private final MLPredictionRepository predictionRepository;
    private final PredictiveLeadScoringService mlScoringService;
    private final LeadScoringEngine ruleBasedScoringEngine;
    private final Random random = new Random();

    public ABTestingService(
            ABTestExperimentRepository experimentRepository,
            MLPredictionRepository predictionRepository,
            PredictiveLeadScoringService mlScoringService,
            LeadScoringEngine ruleBasedScoringEngine) {
        this.experimentRepository = experimentRepository;
        this.predictionRepository = predictionRepository;
        this.mlScoringService = mlScoringService;
        this.ruleBasedScoringEngine = ruleBasedScoringEngine;
    }

    @Transactional
    public ABTestExperiment createExperiment(
            String orgId,
            String experimentName,
            String description,
            String controlMethod,
            String treatmentMethod,
            Double trafficSplit) {
        ABTestExperiment experiment = new ABTestExperiment();
        experiment.setOrgId(orgId);
        experiment.setExperimentName(experimentName);
        experiment.setDescription(description);
        experiment.setControlMethod(controlMethod);
        experiment.setTreatmentMethod(treatmentMethod);
        experiment.setTrafficSplit(trafficSplit != null ? trafficSplit : 0.5);
        experiment.setStatus("RUNNING");
        experiment.setStartedAt(LocalDateTime.now());
        experiment.setCreatedAt(LocalDateTime.now());
        experiment.setUpdatedAt(LocalDateTime.now());

        return experimentRepository.save(experiment);
    }

    @Transactional
    public String assignToVariant(Dossier dossier) {
        String orgId = dossier.getOrgId();
        List<ABTestExperiment> runningExperiments =
                experimentRepository.findRunningExperiments(orgId);

        if (runningExperiments.isEmpty()) {
            return "ML";
        }

        ABTestExperiment experiment = runningExperiments.get(0);

        double randomValue = random.nextDouble();
        if (randomValue < experiment.getTrafficSplit()) {
            return experiment.getControlMethod();
        } else {
            return experiment.getTreatmentMethod();
        }
    }

    @Transactional
    public void scoreWithAssignedMethod(Dossier dossier, String method) {
        if ("RULE_BASED".equals(method)) {
            ruleBasedScoringEngine.calculateScore(dossier);
            log.info("Scored dossier {} with rule-based method", dossier.getId());
        } else if ("ML".equals(method)) {
            mlScoringService.predictLeadConversion(dossier);
            log.info("Scored dossier {} with ML method", dossier.getId());
        }
    }

    @Transactional
    public Map<String, Object> calculateExperimentMetrics(Long experimentId) {
        ABTestExperiment experiment =
                experimentRepository
                        .findById(experimentId)
                        .orElseThrow(() -> new RuntimeException("Experiment not found"));

        LocalDateTime startDate = experiment.getStartedAt();
        LocalDateTime endDate =
                experiment.getEndedAt() != null ? experiment.getEndedAt() : LocalDateTime.now();

        Map<String, Object> controlMetrics =
                calculateMethodMetrics(
                        experiment.getOrgId(), experiment.getControlMethod(), startDate, endDate);
        Map<String, Object> treatmentMetrics =
                calculateMethodMetrics(
                        experiment.getOrgId(), experiment.getTreatmentMethod(), startDate, endDate);

        experiment.setControlMetrics(controlMetrics);
        experiment.setTreatmentMetrics(treatmentMetrics);

        double controlConversionRate = (double) controlMetrics.get("conversion_rate");
        double treatmentConversionRate = (double) treatmentMetrics.get("conversion_rate");

        if (treatmentConversionRate > controlConversionRate * 1.05) {
            experiment.setWinner(experiment.getTreatmentMethod());
        } else if (controlConversionRate > treatmentConversionRate * 1.05) {
            experiment.setWinner(experiment.getControlMethod());
        } else {
            experiment.setWinner("NO_CLEAR_WINNER");
        }

        experiment.setUpdatedAt(LocalDateTime.now());
        experimentRepository.save(experiment);

        Map<String, Object> result = new HashMap<>();
        result.put("experiment", experiment);
        result.put("control_metrics", controlMetrics);
        result.put("treatment_metrics", treatmentMetrics);
        result.put("winner", experiment.getWinner());

        return result;
    }

    private Map<String, Object> calculateMethodMetrics(
            String orgId, String method, LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> metrics = new HashMap<>();

        if ("ML".equals(method)) {
            List<MLPrediction> predictions =
                    predictionRepository.findByOrgIdAndDateRange(orgId, startDate, endDate);

            long totalPredictions = predictions.size();
            long conversions =
                    predictions.stream()
                            .filter(p -> p.getActualOutcome() != null && p.getActualOutcome() == 1)
                            .count();

            double conversionRate =
                    totalPredictions > 0 ? (double) conversions / totalPredictions : 0.0;

            metrics.put("total_predictions", totalPredictions);
            metrics.put("conversions", conversions);
            metrics.put("conversion_rate", conversionRate);
        } else {
            metrics.put("total_predictions", 0);
            metrics.put("conversions", 0);
            metrics.put("conversion_rate", 0.0);
        }

        return metrics;
    }

    @Transactional
    public ABTestExperiment stopExperiment(Long experimentId) {
        ABTestExperiment experiment =
                experimentRepository
                        .findById(experimentId)
                        .orElseThrow(() -> new RuntimeException("Experiment not found"));

        experiment.setStatus("STOPPED");
        experiment.setEndedAt(LocalDateTime.now());
        experiment.setUpdatedAt(LocalDateTime.now());

        return experimentRepository.save(experiment);
    }

    @Transactional(readOnly = true)
    public List<ABTestExperiment> getExperiments(String orgId) {
        return experimentRepository.findByOrgIdOrderByStartedAtDesc(orgId);
    }
}
