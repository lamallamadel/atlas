package com.example.backend.brain;

import com.example.backend.brain.dto.BienScoreRequest;
import com.example.backend.brain.dto.DoublonResultDto;
import com.example.backend.brain.dto.DupliAnnonceDto;
import com.example.backend.brain.dto.FraudRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.repository.AnnonceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
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

            List<Annonce> recentAnnonces =
                    annonceRepository.findTop50ByOrgIdOrderByCreatedAtDesc(annonce.getOrgId());

            List<DupliAnnonceDto> dupliDtos =
                    recentAnnonces.stream()
                            .map(
                                    a ->
                                            new DupliAnnonceDto(
                                                    a.getId(),
                                                    a.getTitle(),
                                                    a.getDescription() != null
                                                            ? a.getDescription()
                                                            : ""))
                            .toList();

            if (dupliDtos.size() < 2) {
                return;
            }

            // Brain injoignable : on garde le résultat précédent plutôt que de l'effacer.
            brainClientService
                    .tryDetectDuplicates(dupliDtos)
                    .ifPresent(
                            doublons -> {
                                applyDuplicateResult(annonce, doublons);
                                annonceRepository.save(annonce);
                            });
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
                                annonce.setFraudAlertes(
                                        result.getAlertes() != null
                                                ? result.getAlertes()
                                                : List.of());
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

    /**
     * Retient le doublon le plus proche de l'annonce parmi les paires renvoyées par le brain, ou
     * efface le marquage s'il n'y en a plus (l'annonce a pu être modifiée depuis). Ne touche pas
     * aux champs de fraude : les deux analyses tournent en parallèle et restent indépendantes.
     */
    static void applyDuplicateResult(Annonce annonce, List<DoublonResultDto> doublons) {
        Long id = annonce.getId();
        Optional<DoublonResultDto> best =
                doublons.stream()
                        .filter(d -> id.equals(d.getAnnonce1()) || id.equals(d.getAnnonce2()))
                        .max(Comparator.comparingDouble(DoublonResultDto::getSimilarite));

        if (best.isEmpty()) {
            annonce.setDuplicateOfId(null);
            annonce.setDuplicateSimilarity(null);
            annonce.setDuplicateStatut(null);
            return;
        }

        DoublonResultDto doublon = best.get();
        Long otherId =
                id.equals(doublon.getAnnonce1()) ? doublon.getAnnonce2() : doublon.getAnnonce1();
        annonce.setDuplicateOfId(otherId);
        annonce.setDuplicateSimilarity(doublon.getSimilarite());
        annonce.setDuplicateStatut(doublon.getStatut());
        log.info(
                "Duplicate detected for annonce {}: annonce {} (similarity={}, status={})",
                id,
                otherId,
                doublon.getSimilarite(),
                doublon.getStatut());
    }
}
