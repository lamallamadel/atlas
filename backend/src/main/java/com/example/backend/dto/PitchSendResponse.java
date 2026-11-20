package com.example.backend.dto;

import java.time.LocalDateTime;

/** Message mis en file d'envoi (le statut de livraison suit dans l'historique des messages). */
public record PitchSendResponse(
        Long outboundMessageId,
        String status,
        String channel,
        LocalDateTime pitchedAt,
        int photosQueued) {}
