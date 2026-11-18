package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Acheteur (dossier) correspondant à une annonce.
 *
 * @param status NEW (pas encore vu), SEEN, DISMISSED (écarté par l'agent)
 */
public record BuyerMatchResponse(
        Long id,
        Long dossierId,
        String leadName,
        String dossierStatus,
        int score,
        List<String> reasons,
        List<String> alerts,
        String status,
        LocalDateTime createdAt) {}
