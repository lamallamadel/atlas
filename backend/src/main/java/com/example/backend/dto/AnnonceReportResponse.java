package com.example.backend.dto;

import com.example.backend.entity.AnnonceReport;
import java.time.LocalDateTime;

/** Signalement vu par l'agence (sans l'IP ni le navigateur du visiteur). */
public record AnnonceReportResponse(
        Long id,
        Long annonceId,
        String reasonCode,
        String comment,
        String reporterEmail,
        String status,
        String resolution,
        String resolutionComment,
        String closedBy,
        LocalDateTime closedAt,
        LocalDateTime createdAt) {

    public static AnnonceReportResponse from(AnnonceReport r) {
        return new AnnonceReportResponse(
                r.getId(),
                r.getAnnonceId(),
                r.getReasonCode(),
                r.getComment(),
                r.getReporterEmail(),
                r.getStatus(),
                r.getResolution(),
                r.getResolutionComment(),
                r.getClosedBy(),
                r.getClosedAt(),
                r.getCreatedAt());
    }
}
