package com.example.backend.dto;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnoncePublicationService;
import com.example.backend.service.AnnonceQualityService;
import java.util.List;
import java.util.Map;

/** État de publication d'une annonce pour l'espace Pro : qualité, confiance, actions possibles. */
public record AnnoncePublicationResponse(
        Long annonceId,
        AnnonceStatus status,
        Quality quality,
        Trust trust,
        List<AnnoncePublicationService.TransitionOption> transitions,
        Map<String, Object> suspension,
        long openReports) {

    public record Quality(int score, int photoCount, int minPhotos, List<Missing> missing) {}

    public record Missing(String code, String label, boolean blocking) {}

    public record Trust(
            String duplicateStatut,
            Long duplicateOfId,
            Double duplicateSimilarity,
            String fraudStatut,
            Integer fraudScore,
            boolean blocking,
            Map<String, Object> override) {}

    @SuppressWarnings("unchecked")
    public static AnnoncePublicationResponse of(
            Annonce a,
            AnnonceQualityService.Quality q,
            List<AnnoncePublicationService.TransitionOption> transitions,
            Map<String, Object> override,
            long openReports) {
        Quality quality =
                new Quality(
                        q.score(),
                        q.photoCount(),
                        q.minPhotos(),
                        q.missing().stream()
                                .map(c -> new Missing(c.code(), c.label(), c.blocking()))
                                .toList());
        Trust trust =
                new Trust(
                        a.getDuplicateStatut(),
                        a.getDuplicateOfId(),
                        a.getDuplicateSimilarity(),
                        a.getFraudStatut(),
                        a.getFraudScore(),
                        AnnoncePublicationService.hasBlockingTrustSignal(a),
                        override);
        Object suspension = a.getMeta() == null ? null : a.getMeta().get("suspension");
        return new AnnoncePublicationResponse(
                a.getId(),
                a.getStatus(),
                quality,
                trust,
                transitions,
                suspension instanceof Map<?, ?> m ? (Map<String, Object>) m : null,
                openReports);
    }
}
