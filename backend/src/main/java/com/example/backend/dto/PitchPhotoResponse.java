package com.example.backend.dto;

/**
 * Photo de l'annonce envoyable par WhatsApp avec la proposition.
 *
 * @param suggested présélectionnée par Atlas (pièces les plus parlantes)
 */
public record PitchPhotoResponse(
        Long mediaId,
        String source,
        String url,
        String roomType,
        String caption,
        boolean suggested) {}
