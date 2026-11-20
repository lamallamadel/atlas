package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Message validé par l'agent, à envoyer au client acheteur.
 *
 * @param mediaIds photos de l'annonce à joindre (WhatsApp uniquement, 3 au plus), envoyées après le
 *     texte
 */
public record PitchSendRequest(
        @NotBlank @Size(max = 1000) String message,
        @NotNull String channel,
        String language,
        @Size(max = 3) List<Long> mediaIds) {}
