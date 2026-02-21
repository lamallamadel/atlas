package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.LeadScore;
import com.example.backend.entity.LeadScoringConfig;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LeadScoringConfigRepository;
import com.example.backend.repository.LeadScoreRepository;
import com.example.backend.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AutoQualificationService {

    private static final Logger log = LoggerFactory.getLogger(AutoQualificationService.class);

    private final DossierRepository dossierRepository;
    private final LeadScoringEngine scoringEngine;
    private final LeadScoringConfigRepository configRepository;
    private final LeadScoreRepository leadScoreRepository;
    private final DossierStatusTransitionService transitionService;

    public AutoQualificationService(DossierRepository dossierRepository,
                                   LeadScoringEngine scoringEngine,
                                   LeadScoringConfigRepository configRepository,
                                   LeadScoreRepository leadScoreRepository,
                                   DossierStatusTransitionService transitionService) {
        this.dossierRepository = dossierRepository;
        this.scoringEngine = scoringEngine;
        this.configRepository = configRepository;
        this.leadScoreRepository = leadScoreRepository;
        this.transitionService = transitionService;
    }

    @Scheduled(fixedDelayString = "${lead.qualification.check.interval:300000}", initialDelayString = "${lead.qualification.check.initial.delay:60000}")
    @Transactional
    public void autoQualifyLeads() {
        log.info("Starting auto-qualification job");

        try {
            Specification<Dossier> spec = (root, query, criteriaBuilder) -> 
                criteriaBuilder.equal(root.get("status"), DossierStatus.NEW);

            Pageable pageable = PageRequest.of(0, 100);
            Page<Dossier> newDossiers = dossierRepository.findAll(spec, pageable);

            int qualifiedCount = 0;
            int scoredCount = 0;

            for (Dossier dossier : newDossiers.getContent()) {
                try {
                    String originalOrgId = TenantContext.getOrgId();
                    TenantContext.setOrgId(dossier.getOrgId());
                    
                    try {
                        LeadScore score = scoringEngine.calculateScore(dossier);
                        scoredCount++;

                        LeadScoringConfig config = configRepository.findActiveConfig(dossier.getOrgId())
                                .orElse(null);

                        if (config != null && score.getTotalScore() >= config.getAutoQualificationThreshold()) {
                            DossierStatus currentStatus = dossier.getStatus();
                            dossier.setStatus(DossierStatus.QUALIFYING);
                            dossier.setUpdatedAt(LocalDateTime.now());
                            dossierRepository.save(dossier);

                            transitionService.recordTransition(dossier, currentStatus, DossierStatus.QUALIFYING, 
                                    "system", "Auto-qualified based on lead score: " + score.getTotalScore());
                            
                            qualifiedCount++;
                            log.info("Auto-qualified dossier {} with score {}", dossier.getId(), score.getTotalScore());
                        }
                    } finally {
                        TenantContext.setOrgId(originalOrgId);
                    }
                } catch (Exception e) {
                    log.error("Error auto-qualifying dossier {}: {}", dossier.getId(), e.getMessage(), e);
                }
            }

            log.info("Auto-qualification job completed. Scored: {}, Qualified: {}", scoredCount, qualifiedCount);
        } catch (Exception e) {
            log.error("Error in auto-qualification job: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void recalculateAllScores(String orgId) {
        log.info("Recalculating all lead scores for org: {}", orgId);
        
        String originalOrgId = TenantContext.getOrgId();
        TenantContext.setOrgId(orgId);
        
        try {
            Specification<Dossier> spec = (root, query, criteriaBuilder) -> 
                criteriaBuilder.and(
                    criteriaBuilder.equal(root.get("orgId"), orgId),
                    criteriaBuilder.in(root.get("status")).value(List.of(
                        DossierStatus.NEW, 
                        DossierStatus.QUALIFYING, 
                        DossierStatus.QUALIFIED
                    ))
                );

            List<Dossier> dossiers = dossierRepository.findAll(spec);
            
            int count = 0;
            for (Dossier dossier : dossiers) {
                try {
                    scoringEngine.calculateScore(dossier);
                    count++;
                } catch (Exception e) {
                    log.error("Error recalculating score for dossier {}: {}", dossier.getId(), e.getMessage());
                }
            }

            log.info("Recalculated {} lead scores for org: {}", count, orgId);
        } finally {
            TenantContext.setOrgId(originalOrgId);
        }
    }

    @Transactional(readOnly = true)
    public List<Dossier> getHighPriorityLeads(String orgId, int limit) {
        String originalOrgId = TenantContext.getOrgId();
        TenantContext.setOrgId(orgId);
        
        try {
            List<LeadScore> topScores = leadScoreRepository.findTopScoresByOrgId(orgId, PageRequest.of(0, limit));
            
            List<Long> dossierIds = topScores.stream()
                    .map(LeadScore::getDossierId)
                    .toList();

            return dossierRepository.findAllById(dossierIds);
        } finally {
            TenantContext.setOrgId(originalOrgId);
        }
    }
}
