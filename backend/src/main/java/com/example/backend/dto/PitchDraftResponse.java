package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Brouillon de message proposant un bien à un acheteur. Rien n'est envoyé : l'agent relit, modifie
 * si besoin puis valide l'envoi.
 *
 * @param engine openai, ollama ou modele (texte sans IA)
 * @param aiRejection raison pour laquelle le texte de l'IA a été écarté (chiffre inventé…), sinon
 *     null
 * @param consentStatus GRANTED, DENIED, PENDING, REVOKED, EXPIRED ou MISSING
 * @param whatsappWindowOpen le client a écrit sur WhatsApp il y a moins de 24 h (null pour SMS)
 * @param blockers raisons empêchant l'envoi (vide si l'envoi est possible)
 * @param photos photos envoyables par WhatsApp (vide pour SMS)
 */
public record PitchDraftResponse(
        String message,
        String engine,
        String aiRejection,
        String language,
        String channel,
        String to,
        String consentStatus,
        Boolean whatsappWindowOpen,
        List<String> blockers,
        List<String> warnings,
        int maxLength,
        LocalDateTime pitchedAt,
        String pitchChannel,
        List<PitchPhotoResponse> photos) {}
