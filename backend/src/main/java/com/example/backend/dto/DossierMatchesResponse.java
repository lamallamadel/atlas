package com.example.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Biens correspondant aux critères d'un dossier, triés par score décroissant. */
public record DossierMatchesResponse(
        String scope,
        int totalCandidates,
        Map<String, Integer> excluded,
        List<Match> matches,
        LocalDateTime criteriaUpdatedAt) {

    /**
     * @param reasons ce qui correspond (avec la source : photos ou annonce)
     * @param alerts ce qui ne correspond pas ou n'a pas pu être vérifié
     * @param photosAnalyzed false si l'état, le mobilier et les équipements n'ont pas été vérifiés
     *     sur les photos
     */
    public record Match(
            Long annonceId,
            String title,
            String city,
            String category,
            String type,
            String status,
            BigDecimal price,
            String currency,
            Double surface,
            String photoUrl,
            int score,
            List<String> reasons,
            List<String> alerts,
            boolean photosAnalyzed) {}
}
