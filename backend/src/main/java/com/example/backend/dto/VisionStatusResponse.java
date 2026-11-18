package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * État de l'analyse visuelle d'une annonce.
 *
 * @param status EMPTY (aucune photo), RUNNING, PENDING (photos pas encore analysées), DONE
 * @param result profil agrégé renvoyé par le brain : {@code profile}, {@code inconsistencies},
 *     {@code descriptions}, {@code description_engine}
 */
public record VisionStatusResponse(
        String status,
        int total,
        int done,
        int pending,
        int failed,
        int rejected,
        List<AnnonceMediaResponse> media,
        Map<String, Object> result,
        LocalDateTime updatedAt) {

    public static VisionStatusResponse of(
            boolean running,
            List<AnnonceMediaResponse> media,
            Map<String, Object> result,
            LocalDateTime updatedAt) {
        int done = 0, pending = 0, failed = 0, rejected = 0;
        for (AnnonceMediaResponse m : media) {
            switch (m.analysisStatus()) {
                case "DONE" -> done++;
                case "PENDING" -> pending++;
                case "FAILED" -> failed++;
                case "REJECTED" -> rejected++;
                default -> {}
            }
        }
        String status;
        if (running) {
            status = "RUNNING";
        } else if (media.isEmpty()) {
            status = "EMPTY";
        } else if (pending > 0 || (result == null && done > 0)) {
            status = "PENDING";
        } else {
            status = "DONE";
        }
        return new VisionStatusResponse(
                status, media.size(), done, pending, failed, rejected, media, result, updatedAt);
    }
}
