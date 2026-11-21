package com.example.backend.dto;

import java.time.LocalDateTime;

/**
 * Ce que voit le client sur la page de confirmation : rien de plus que son prénom, le canal et la
 * finalité. status : PENDING, ANSWERED ou EXPIRED ; decision : ACCEPT ou REFUSE une fois répondu.
 */
public record PublicConsentView(
        String status,
        String decision,
        String channel,
        String consentType,
        String clientFirstName,
        LocalDateTime expiresAt) {}
