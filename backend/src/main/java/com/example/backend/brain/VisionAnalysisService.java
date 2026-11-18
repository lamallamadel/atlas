package com.example.backend.brain;

import com.example.backend.dto.AnnonceMediaResponse;
import com.example.backend.dto.VisionStatusResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceMedia;
import com.example.backend.repository.AnnonceMediaRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.service.AnnonceMediaService;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Analyse visuelle d'une annonce : déclenchement, état d'avancement, application de la description
 * proposée (toujours sur décision de l'agent).
 */
@Service
public class VisionAnalysisService {

    public static final int MAX_DESCRIPTION_LENGTH = 10_000;

    private final AnnonceMediaService mediaService;
    private final AnnonceMediaRepository mediaRepository;
    private final AnnonceRepository annonceRepository;
    private final VisionAnalysisWorker worker;

    public VisionAnalysisService(
            AnnonceMediaService mediaService,
            AnnonceMediaRepository mediaRepository,
            AnnonceRepository annonceRepository,
            VisionAnalysisWorker worker) {
        this.mediaService = mediaService;
        this.mediaRepository = mediaRepository;
        this.annonceRepository = annonceRepository;
        this.worker = worker;
    }

    /**
     * Lance l'analyse des photos en attente (et des échecs techniques précédents). Avec {@code
     * force}, réanalyse toutes les photos.
     *
     * <p>Volontairement sans @Transactional : les changements de statut doivent être enregistrés
     * avant que le worker asynchrone ne relise les photos.
     */
    public VisionStatusResponse requestAnalysis(Long annonceId, boolean force) {
        Annonce annonce = mediaService.requireAnnonce(annonceId);
        mediaService.syncExternalPhotos(annonce);

        List<AnnonceMedia> medias =
                mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(annonceId);
        if (medias.isEmpty()) {
            throw new IllegalArgumentException("Aucune photo à analyser pour cette annonce");
        }
        if (!worker.tryStart(annonceId)) {
            return status(annonceId); // une analyse tourne déjà
        }
        boolean pending = false;
        try {
            for (AnnonceMedia media : medias) {
                String s = media.getAnalysisStatus();
                boolean retry = AnnonceMedia.STATUS_FAILED.equals(s);
                boolean redo =
                        force && !AnnonceMedia.STATUS_PENDING.equals(s) && !isNonHttpsLink(media);
                if (retry || redo) {
                    media.setAnalysisStatus(AnnonceMedia.STATUS_PENDING);
                    media.setAnalysisError(null);
                    mediaRepository.save(media);
                }
                pending |= retry || redo || AnnonceMedia.STATUS_PENDING.equals(s);
            }
        } catch (RuntimeException e) {
            worker.release(annonceId);
            throw e;
        }
        if (!pending && annonce.getAiVisionResult() != null) {
            // Rien de nouveau : on ne refait pas payer l'analyse ni la description
            worker.release(annonceId);
            return status(annonceId);
        }
        worker.run(annonceId);
        return status(annonceId);
    }

    public VisionStatusResponse status(Long annonceId) {
        Annonce annonce = mediaService.requireAnnonce(annonceId);
        List<AnnonceMediaResponse> medias =
                mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(annonceId).stream()
                        .map(AnnonceMediaService::toResponse)
                        .toList();
        return VisionStatusResponse.of(
                worker.isRunning(annonceId),
                medias,
                annonce.getAiVisionResult(),
                annonce.getAiVisionUpdatedAt());
    }

    /**
     * Remplace la description de l'annonce par le texte validé (et éventuellement corrigé) par
     * l'agent.
     */
    public void applyDescription(Long annonceId, String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("La description ne peut pas être vide");
        }
        if (description.length() > MAX_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Description trop longue");
        }
        Annonce annonce = mediaService.requireAnnonce(annonceId);
        annonce.setDescription(description.strip());
        annonceRepository.save(annonce);
    }

    private static boolean isNonHttpsLink(AnnonceMedia media) {
        return AnnonceMedia.SOURCE_URL.equals(media.getSource())
                && (media.getExternalUrl() == null
                        || !media.getExternalUrl().startsWith("https://"));
    }
}
