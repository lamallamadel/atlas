package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Photo d'une annonce et résultat de son analyse visuelle.
 *
 * @param url pour une photo importée, chemin de l'API à appeler avec le jeton (pas une URL
 *     publique)
 */
public record AnnonceMediaResponse(
        Long id,
        Long annonceId,
        String mediaType,
        String source,
        String url,
        String fileName,
        String contentType,
        Long fileSize,
        Integer position,
        String analysisStatus,
        Map<String, Object> analysis,
        String analysisEngine,
        String analysisError,
        LocalDateTime analyzedAt) {}
