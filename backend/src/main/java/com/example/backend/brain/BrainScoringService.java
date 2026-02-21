package com.example.backend.brain;

import com.example.backend.brain.dto.BienScoreRequest;
import com.example.backend.brain.dto.DoublonResultDto;
import com.example.backend.brain.dto.DupliAnnonceDto;
import com.example.backend.brain.dto.FraudRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.repository.AnnonceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!test & !backend-e2e")
public class BrainScoringService {

    private static final Logger log = LoggerFactory.getLogger(BrainScoringService.class);

    private final BrainClientService brainClientService;
    private final AnnonceRepository annonceRepository;
    private final ObjectMapper objectMapper;

    public BrainScoringService(
            BrainClientService brainClientService,
            AnnonceRepository annonceRepository,
            ObjectMapper objectMapper) {
        this.brainClientService = brainClientService;
        this.annonceRepository = annonceRepository;
        this.objectMapper = objectMapper;
    }

    @Async("brainTaskExecutor")
    @Transactional
    public void triggerScoringAsync(Long annonceId) {
        try {
            Annonce annonce = annonceRepository.findById(annonceId).orElse(null);
            if (annonce == null) {
                return;
            }
            if (annonce.getPrice() == null
                    || annonce.getSurface() == null
                    || annonce.getSurface() <= 0) {
                log.debug(
                        "Skipping AI scoring for annonce {} — missing price or surface", annonceId);
                return;
            }

            BienScoreRequest req = BienScoreRequest.from(annonce);
            brainClientService
                    .scoreAnnonce(req)
                    .ifPresent(
                            result -> {
                                annonce.setAiScore(result.getScore());
                                if (result.getDetails() != null) {
                                    try {
                                        annonce.setAiScoreDetails(
                                                objectMapper.writeValueAsString(
                                                        result.getDetails()));
                                    } catch (JsonProcessingException e) {
                                        log.warn(
                                                "Could not serialize score details for annonce {}",
                                                annonceId);
                                    }
                                }
                                annonceRepository.save(annonce);
                                log.info(
                                        "AI score for annonce {}: {}/100",
                                        annonceId,
                                        result.getScore());
                            });
        } catch (Exception e) {
            log.warn("Failed to score annonce {}: {}", annonceId, e.getMessage());
        }
    }

    @Async("brainTaskExecutor")
    public CompletableFuture<List<DoublonResultDto>> detectDuplicatesAsync(
            List<DupliAnnonceDto> annonces) {
        return CompletableFuture.completedFuture(brainClientService.detectDuplicates(annonces));
    }

    @Async("brainTaskExecutor")
    @Transactional
    public void triggerDuplicateCheckAsync(Long annonceId) {
        try {
            Annonce annonce = annonceRepository.findById(annonceId).orElse(null);
            if (annonce == null) {
                return;
            }

            List<Annonce> recentAnnonces = annonceRepository.findTop50ByOrgIdOrderByCreatedAtDesc(annonce.getOrgId());

            List<DupliAnnonceDto> dupliDtos = recentAnnonces.stream()
                    .map(
                            a -> new DupliAnnonceDto(
                                    a.getId(),
                                    a.getTitle(),
                                    a.getDescription() != null
                                            ? a.getDescription()
                                            : ""))
                    .toList();

            if (dupliDtos.size() < 2) {
                return;
            }

            List<DoublonResultDto> doublons = brainClientService.detectDuplicates(dupliDtos);

            for (DoublonResultDto doublon : doublons) {
                if (doublon.getAnnonce1().equals(annonceId)
                        || doublon.getAnnonce2().equals(annonceId)) {
                    log.info(
                            "Duplicate detected for annonce {}: similarity={}, status={}",
                            annonceId,
                            doublon.getSimilarite(),
                            doublon.getStatut());

                    if ("DOUBLON_CERTAIN".equals(doublon.getStatut())) {
                        annonce.setFraudStatut("FRAUDULEUX");
                        annonce.setFraudScore(Math.max(
                                annonce.getFraudScore() != null ? annonce.getFraudScore() : 0, 90));
                        annonceRepository.save(annonce);
                    } else if ("DOUBLON_PROBABLE".equals(doublon.getStatut())) {
                        if (annonce.getFraudStatut() == null
                                || "SAIN".equals(annonce.getFraudStatut())) {
                            annonce.setFraudStatut("SUSPECT");
                            annonce.setFraudScore(Math.max(
                                    annonce.getFraudScore() != null ? annonce.getFraudScore() : 0,
                                    50));
                            annonceRepository.save(annonce);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check duplicates for annonce {}: {}", annonceId, e.getMessage());
        }
    }

    @Async("brainTaskExecutor")
    @Transactional
    public void triggerFraudAsync(Long annonceId) {
        try {
            Annonce annonce = annonceRepository.findById(annonceId).orElse(null);
            if (annonce == null) {
                return;
            }
            if (annonce.getPrice() == null
                    || annonce.getSurface() == null
                    || annonce.getSurface() <= 0) {
                log.debug(
                        "Skipping fraud analysis for annonce {} — missing price or surface",
                        annonceId);
                return;
            }

            FraudRequest req = FraudRequest.from(annonce);
            brainClientService
                    .analyzeFraud(req)
                    .ifPresent(
                            result -> {
                                annonce.setFraudScore(result.getScoreFraude());
                                annonce.setFraudStatut(result.getStatut());
                                annonceRepository.save(annonce);
                                log.info(
                                        "Fraud analysis for annonce {}: {} (score: {})",
                                        annonceId,
                                        result.getStatut(),
                                        result.getScoreFraude());
                            });
        } catch (Exception e) {
            log.warn("Failed to analyze fraud for annonce {}: {}", annonceId, e.getMessage());
        }
    }
}
