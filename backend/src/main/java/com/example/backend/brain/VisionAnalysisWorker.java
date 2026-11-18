package com.example.backend.brain;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceMedia;
import com.example.backend.repository.AnnonceMediaRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.service.AnnonceMediaService;
import com.example.backend.service.ReverseMatchingService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Analyse en arrière-plan des photos d'une annonce, puis construction du profil agrégé.
 *
 * <p>Pas de transaction englobante : chaque photo est enregistrée dès qu'elle est analysée, pour
 * que l'interface voie la progression et qu'une panne en cours de route ne fasse rien perdre.
 */
@Component
public class VisionAnalysisWorker {

    private static final Logger log = LoggerFactory.getLogger(VisionAnalysisWorker.class);

    private final AnnonceRepository annonceRepository;
    private final AnnonceMediaRepository mediaRepository;
    private final AnnonceMediaService mediaService;
    private final BrainVisionClient visionClient;
    private final ReverseMatchingService reverseMatchingService;
    private final Set<Long> running = ConcurrentHashMap.newKeySet();

    public VisionAnalysisWorker(
            AnnonceRepository annonceRepository,
            AnnonceMediaRepository mediaRepository,
            AnnonceMediaService mediaService,
            BrainVisionClient visionClient,
            @Autowired(required = false) @Nullable ReverseMatchingService reverseMatchingService) {
        this.annonceRepository = annonceRepository;
        this.mediaRepository = mediaRepository;
        this.mediaService = mediaService;
        this.visionClient = visionClient;
        this.reverseMatchingService = reverseMatchingService;
    }

    public boolean isRunning(Long annonceId) {
        return running.contains(annonceId);
    }

    /** Réserve l'annonce ; false si une analyse est déjà en cours. */
    boolean tryStart(Long annonceId) {
        return running.add(annonceId);
    }

    /** Libère la réservation sans rien analyser. */
    void release(Long annonceId) {
        running.remove(annonceId);
    }

    @Async("brainTaskExecutor")
    public void run(Long annonceId) {
        try {
            analyze(annonceId);
        } catch (Exception e) {
            log.error("Analyse visuelle de l'annonce {} interrompue", annonceId, e);
        } finally {
            running.remove(annonceId);
        }
    }

    void analyze(Long annonceId) {
        Annonce annonce = annonceRepository.findById(annonceId).orElse(null);
        if (annonce == null) {
            return;
        }
        Map<String, Object> context = new HashMap<>();
        putIfPresent(context, "categorie", annonce.getCategory());
        putIfPresent(context, "ville", annonce.getCity());

        List<AnnonceMedia> medias =
                mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(annonceId);
        String unavailableError = null;
        for (AnnonceMedia media : medias) {
            if (!AnnonceMedia.STATUS_PENDING.equals(media.getAnalysisStatus())) {
                continue;
            }
            if (unavailableError != null) {
                // Brain indisponible : inutile d'insister sur les photos suivantes
                markFailed(media, unavailableError);
                continue;
            }
            BrainVisionClient.Result result = analyzeOne(media, context);
            switch (result.outcome()) {
                case OK -> {
                    media.setAnalysis(asMap(result.body().get("analysis")));
                    media.setAnalysisEngine(asString(result.body().get("engine")));
                    media.setAnalysisError(null);
                    media.setAnalysisStatus(AnnonceMedia.STATUS_DONE);
                    media.setAnalyzedAt(LocalDateTime.now());
                    mediaRepository.save(media);
                }
                case REJECTED -> {
                    media.setAnalysisStatus(AnnonceMedia.STATUS_REJECTED);
                    media.setAnalysisError(result.error());
                    mediaRepository.save(media);
                }
                case UNAVAILABLE -> {
                    unavailableError = result.error();
                    markFailed(media, unavailableError);
                }
            }
        }

        List<Map<String, Object>> analyses = new ArrayList<>();
        for (AnnonceMedia media :
                mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(annonceId)) {
            if (AnnonceMedia.STATUS_DONE.equals(media.getAnalysisStatus())
                    && media.getAnalysis() != null) {
                analyses.add(media.getAnalysis());
            }
        }
        if (analyses.isEmpty()) {
            return;
        }

        BrainVisionClient.Result profile =
                visionClient.buildProfile(analyses, declared(annonce), List.of("fr"));
        if (profile.outcome() != BrainVisionClient.Outcome.OK) {
            log.warn("Profil visuel de l'annonce {} non calculé : {}", annonceId, profile.error());
            return;
        }
        Annonce fresh = annonceRepository.findById(annonceId).orElse(null);
        if (fresh == null) {
            return;
        }
        fresh.setAiVisionResult(profile.body());
        fresh.setAiVisionUpdatedAt(LocalDateTime.now());
        annonceRepository.save(fresh);
        log.info(
                "Profil visuel de l'annonce {} calculé à partir de {} photo(s)",
                annonceId,
                analyses.size());
        // Ce que l'IA a vu (meublé, état, équipements) change le matching : on le recalcule
        if (reverseMatchingService != null) {
            try {
                reverseMatchingService.recompute(annonceId);
            } catch (Exception e) {
                log.warn("Matching inverse après analyse visuelle échoué : {}", e.getMessage());
            }
        }
    }

    private BrainVisionClient.Result analyzeOne(AnnonceMedia media, Map<String, Object> context) {
        if (AnnonceMedia.SOURCE_UPLOAD.equals(media.getSource())) {
            try {
                String b64 = Base64.getEncoder().encodeToString(mediaService.readBytes(media));
                return visionClient.analyzePhoto(null, b64, media.getContentType(), context);
            } catch (Exception e) {
                return new BrainVisionClient.Result(
                        BrainVisionClient.Outcome.REJECTED,
                        null,
                        "Fichier illisible dans le stockage");
            }
        }
        return visionClient.analyzePhoto(
                media.getExternalUrl(), null, guessContentType(media.getExternalUrl()), context);
    }

    private void markFailed(AnnonceMedia media, String error) {
        media.setAnalysisStatus(AnnonceMedia.STATUS_FAILED);
        media.setAnalysisError(error);
        mediaRepository.save(media);
    }

    static Map<String, Object> declared(Annonce a) {
        Map<String, Object> d = new HashMap<>();
        putIfPresent(d, "title", a.getTitle());
        putIfPresent(d, "description", a.getDescription());
        putIfPresent(d, "category", a.getCategory());
        putIfPresent(d, "type", a.getType() != null ? a.getType().name() : null);
        putIfPresent(d, "city", a.getCity());
        putIfPresent(d, "surface", a.getSurface());
        putIfPresent(d, "price", a.getPrice() != null ? a.getPrice().doubleValue() : null);
        putIfPresent(d, "currency", a.getCurrency());
        return d;
    }

    static String guessContentType(String url) {
        String u = url == null ? "" : url.toLowerCase();
        int q = u.indexOf('?');
        if (q >= 0) {
            u = u.substring(0, q);
        }
        if (u.endsWith(".png")) {
            return "image/png";
        }
        if (u.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private static void putIfPresent(Map<String, Object> map, String key, Object value) {
        if (value != null && !(value instanceof String s && s.isBlank())) {
            map.put(key, value);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) {
        return o instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
    }

    private static String asString(Object o) {
        return o != null ? o.toString() : null;
    }
}
