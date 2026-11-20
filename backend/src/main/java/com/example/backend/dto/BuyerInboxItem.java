package com.example.backend.dto;

import java.time.LocalDateTime;

/**
 * Ligne de la page « Mes relances ».
 *
 * @param section FOLLOW_UP (à relancer), VISIT_TO_PLAN (visite demandée, non planifiée),
 *     RECENT_REPLY (réponse récente) ou UPCOMING_VISIT (visite prévue)
 * @param answered l'agent a écrit au client depuis sa dernière réponse (RECENT_REPLY)
 */
public record BuyerInboxItem(
        Long matchId,
        String section,
        Long annonceId,
        String annonceTitle,
        String annonceCity,
        Long dossierId,
        String leadName,
        int score,
        String replyIntent,
        String replyExcerpt,
        LocalDateTime replyAt,
        String followUpKind,
        LocalDateTime followUpSince,
        LocalDateTime proposedStart,
        Long visitAppointmentId,
        LocalDateTime visitStart,
        LocalDateTime pitchedAt,
        String pitchChannel,
        boolean answered) {}
