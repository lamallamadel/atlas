package com.example.backend.controller;

import com.example.backend.entity.ABTestExperiment;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MLModelVersion;
import com.example.backend.entity.MLPrediction;
import com.example.backend.repository.DossierRepository;
import com.example.backend.service.ABTestingService;
import com.example.backend.service.ModelTrainingService;
import com.example.backend.service.PredictiveLeadScoringService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ml")
@Tag(name = "ML Predictions", description = "Machine Learning Lead Conversion Predictions")
public class ConversionPredictionController {

    private final PredictiveLeadScoringService predictiveService;
    private final ModelTrainingService trainingService;
    private final ABTestingService abTestingService;
    private final DossierRepository dossierRepository;

    public ConversionPredictionController(PredictiveLeadScoringService predictiveService,
                                         ModelTrainingService trainingService,
                                         ABTestingService abTestingService,
                                         DossierRepository dossierRepository) {
        this.predictiveService = predictiveService;
        this.trainingService = trainingService;
        this.abTestingService = abTestingService;
        this.dossierRepository = dossierRepository;
    }

    @PostMapping("/predict/{dossierId}")
    @PreAuthorize("hasAuthority('SCOPE_lead:write')")
    @Operation(summary = "Get ML prediction for a lead")
    public ResponseEntity<MLPrediction> predictConversion(@PathVariable Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier not found"));
        
        MLPrediction prediction = predictiveService.predictLeadConversion(dossier);
        return ResponseEntity.ok(prediction);
    }

    @GetMapping("/predict/{dossierId}/latest")
    @PreAuthorize("hasAuthority('SCOPE_lead:read')")
    @Operation(summary = "Get latest ML prediction for a lead")
    public ResponseEntity<MLPrediction> getLatestPrediction(@PathVariable Long dossierId) {
        MLPrediction prediction = predictiveService.getLatestPrediction(dossierId);
        if (prediction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(prediction);
    }

    @GetMapping("/predict/{dossierId}/history")
    @PreAuthorize("hasAuthority('SCOPE_lead:read')")
    @Operation(summary = "Get prediction history for a lead")
    public ResponseEntity<List<MLPrediction>> getPredictionHistory(@PathVariable Long dossierId) {
        List<MLPrediction> history = predictiveService.getPredictionHistory(dossierId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/predict/{dossierId}/outcome")
    @PreAuthorize("hasAuthority('SCOPE_lead:write')")
    @Operation(summary = "Record actual outcome for a prediction")
    public ResponseEntity<Void> recordOutcome(@PathVariable Long dossierId, 
                                              @RequestParam Integer outcome) {
        predictiveService.recordActualOutcome(dossierId, outcome);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/model/info")
    @PreAuthorize("hasAuthority('SCOPE_lead:read')")
    @Operation(summary = "Get current model information")
    public ResponseEntity<Map<String, Object>> getModelInfo() {
        String orgId = TenantContext.getCurrentTenant();
        Map<String, Object> info = predictiveService.getModelInfo(orgId);
        return ResponseEntity.ok(info);
    }

    @GetMapping("/model/feature-importance")
    @PreAuthorize("hasAuthority('SCOPE_lead:read')")
    @Operation(summary = "Get feature importance from the current model")
    public ResponseEntity<Map<String, Object>> getFeatureImportance() {
        String orgId = TenantContext.getCurrentTenant();
        Map<String, Object> importance = predictiveService.getFeatureImportance(orgId);
        return ResponseEntity.ok(importance);
    }

    @PostMapping("/model/train")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "Train a new model version")
    public ResponseEntity<MLModelVersion> trainModel() {
        String orgId = TenantContext.getCurrentTenant();
        MLModelVersion version = trainingService.trainModel(orgId);
        if (version == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(version);
    }

    @GetMapping("/model/versions")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "List all model versions")
    public ResponseEntity<List<MLModelVersion>> getModelVersions() {
        String orgId = TenantContext.getCurrentTenant();
        List<MLModelVersion> versions = trainingService.getModelVersions(orgId);
        return ResponseEntity.ok(versions);
    }

    @PostMapping("/model/rollback/{version}")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "Rollback to a previous model version")
    public ResponseEntity<MLModelVersion> rollbackModel(@PathVariable String version) {
        String orgId = TenantContext.getCurrentTenant();
        MLModelVersion rolled = trainingService.rollbackToVersion(orgId, version);
        return ResponseEntity.ok(rolled);
    }

    @PostMapping("/ab-test")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "Create A/B test experiment")
    public ResponseEntity<ABTestExperiment> createExperiment(@RequestBody Map<String, Object> request) {
        String orgId = TenantContext.getCurrentTenant();
        String experimentName = (String) request.get("experiment_name");
        String description = (String) request.get("description");
        String controlMethod = (String) request.get("control_method");
        String treatmentMethod = (String) request.get("treatment_method");
        Double trafficSplit = request.containsKey("traffic_split") 
            ? ((Number) request.get("traffic_split")).doubleValue() 
            : 0.5;

        ABTestExperiment experiment = abTestingService.createExperiment(
            orgId, experimentName, description, controlMethod, treatmentMethod, trafficSplit);
        
        return ResponseEntity.ok(experiment);
    }

    @GetMapping("/ab-test")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "List A/B test experiments")
    public ResponseEntity<List<ABTestExperiment>> getExperiments() {
        String orgId = TenantContext.getCurrentTenant();
        List<ABTestExperiment> experiments = abTestingService.getExperiments(orgId);
        return ResponseEntity.ok(experiments);
    }

    @GetMapping("/ab-test/{experimentId}/metrics")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "Get A/B test experiment metrics")
    public ResponseEntity<Map<String, Object>> getExperimentMetrics(@PathVariable Long experimentId) {
        Map<String, Object> metrics = abTestingService.calculateExperimentMetrics(experimentId);
        return ResponseEntity.ok(metrics);
    }

    @PostMapping("/ab-test/{experimentId}/stop")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "Stop A/B test experiment")
    public ResponseEntity<ABTestExperiment> stopExperiment(@PathVariable Long experimentId) {
        ABTestExperiment experiment = abTestingService.stopExperiment(experimentId);
        return ResponseEntity.ok(experiment);
    }
}
