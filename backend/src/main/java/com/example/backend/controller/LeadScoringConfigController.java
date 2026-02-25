package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.LeadScore;
import com.example.backend.entity.LeadScoringConfig;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LeadScoreRepository;
import com.example.backend.repository.LeadScoringConfigRepository;
import com.example.backend.service.AutoQualificationService;
import com.example.backend.service.LeadScoringEngine;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lead-scoring")
public class LeadScoringConfigController {

    private final LeadScoringConfigRepository configRepository;
    private final LeadScoringConfigMapper configMapper;
    private final LeadScoringEngine scoringEngine;
    private final LeadScoreRepository leadScoreRepository;
    private final LeadScoreMapper leadScoreMapper;
    private final DossierRepository dossierRepository;
    private final DossierMapper dossierMapper;
    private final AutoQualificationService autoQualificationService;

    public LeadScoringConfigController(
            LeadScoringConfigRepository configRepository,
            LeadScoringConfigMapper configMapper,
            LeadScoringEngine scoringEngine,
            LeadScoreRepository leadScoreRepository,
            LeadScoreMapper leadScoreMapper,
            DossierRepository dossierRepository,
            DossierMapper dossierMapper,
            AutoQualificationService autoQualificationService) {
        this.configRepository = configRepository;
        this.configMapper = configMapper;
        this.scoringEngine = scoringEngine;
        this.leadScoreRepository = leadScoreRepository;
        this.leadScoreMapper = leadScoreMapper;
        this.dossierRepository = dossierRepository;
        this.dossierMapper = dossierMapper;
        this.autoQualificationService = autoQualificationService;
    }

    @GetMapping("/config")
    public ResponseEntity<List<LeadScoringConfigResponse>> getAllConfigs() {
        List<LeadScoringConfig> configs = configRepository.findAll();
        List<LeadScoringConfigResponse> responses =
                configs.stream().map(configMapper::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/config/active")
    public ResponseEntity<LeadScoringConfigResponse> getActiveConfig() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LeadScoringConfig config = configRepository.findActiveConfig(orgId).orElse(null);

        if (config == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(configMapper.toResponse(config));
    }

    @GetMapping("/config/{id}")
    public ResponseEntity<LeadScoringConfigResponse> getConfig(@PathVariable Long id) {
        LeadScoringConfig config =
                configRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Config not found with id: " + id));
        return ResponseEntity.ok(configMapper.toResponse(config));
    }

    @PostMapping("/config")
    public ResponseEntity<LeadScoringConfigResponse> createConfig(
            @RequestBody LeadScoringConfigRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LeadScoringConfig config = configMapper.toEntity(request);
        config.setOrgId(orgId);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());

        LeadScoringConfig saved = configRepository.save(config);
        return ResponseEntity.status(HttpStatus.CREATED).body(configMapper.toResponse(saved));
    }

    @PutMapping("/config/{id}")
    public ResponseEntity<LeadScoringConfigResponse> updateConfig(
            @PathVariable Long id, @RequestBody LeadScoringConfigRequest request) {

        LeadScoringConfig config =
                configRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Config not found with id: " + id));

        configMapper.updateEntity(config, request);
        config.setUpdatedAt(LocalDateTime.now());

        LeadScoringConfig updated = configRepository.save(config);
        return ResponseEntity.ok(configMapper.toResponse(updated));
    }

    @DeleteMapping("/config/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        configRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/calculate/{dossierId}")
    public ResponseEntity<LeadScoreResponse> calculateScore(@PathVariable Long dossierId) {
        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + dossierId));

        LeadScore score = scoringEngine.calculateScore(dossier);
        return ResponseEntity.ok(leadScoreMapper.toResponse(score));
    }

    @GetMapping("/score/{dossierId}")
    public ResponseEntity<LeadScoreResponse> getScore(@PathVariable Long dossierId) {
        LeadScore score = leadScoreRepository.findByDossierId(dossierId).orElse(null);

        if (score == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(leadScoreMapper.toResponse(score));
    }

    @GetMapping("/priority-queue")
    public ResponseEntity<List<LeadPriorityResponse>> getPriorityQueue(
            @RequestParam(defaultValue = "50") int limit) {

        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Dossier> highPriorityLeads =
                autoQualificationService.getHighPriorityLeads(orgId, limit);

        List<Long> dossierIds =
                highPriorityLeads.stream().map(Dossier::getId).collect(Collectors.toList());

        List<LeadScore> scores = leadScoreRepository.findByDossierIdIn(dossierIds);
        Map<Long, LeadScore> scoreMap =
                scores.stream().collect(Collectors.toMap(LeadScore::getDossierId, s -> s));

        LeadScoringConfig config = configRepository.findActiveConfig(orgId).orElse(null);
        int threshold = config != null ? config.getAutoQualificationThreshold() : 70;

        List<LeadPriorityResponse> responses = new ArrayList<>();
        for (Dossier dossier : highPriorityLeads) {
            LeadScore score = scoreMap.get(dossier.getId());
            if (score != null) {
                LeadPriorityResponse response = new LeadPriorityResponse();
                response.setDossier(dossierMapper.toResponse(dossier));
                response.setScore(leadScoreMapper.toResponse(score));
                response.setUrgencyLevel(determineUrgencyLevel(score.getTotalScore(), threshold));
                responses.add(response);
            }
        }

        responses.sort(
                (a, b) ->
                        Integer.compare(
                                b.getScore().getTotalScore(), a.getScore().getTotalScore()));

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/recalculate-all")
    public ResponseEntity<Map<String, Object>> recalculateAllScores() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        autoQualificationService.recalculateAllScores(orgId);

        return ResponseEntity.ok(
                Map.of("message", "Score recalculation initiated", "orgId", orgId));
    }

    private String determineUrgencyLevel(int score, int threshold) {
        if (score >= threshold + 20) {
            return "urgent";
        } else if (score >= threshold + 10) {
            return "high";
        } else if (score >= threshold) {
            return "medium";
        } else {
            return "low";
        }
    }
}
