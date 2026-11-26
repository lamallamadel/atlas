package com.example.backend.mandate;

import java.util.List;

/**
 * Alerte à une ou plusieurs agences sans destinataire désigné (demande ouverte correspondant à
 * l'agence, invitation, demande directe) : elle va à leurs administrateurs et managers (spec 13 §
 * 13). Publiée dans la transaction, envoyée après sa validation par {@link AgencyAlertSender}.
 *
 * @param agencyOrgIds agences à prévenir
 * @param subject titre de la notification et objet de l'e-mail
 * @param message phrase courte
 * @param path chemin de l'espace Pro ({@code /pro/mandats/demandes/12})
 */
public record AgencyAlert(List<String> agencyOrgIds, String subject, String message, String path) {

    public static AgencyAlert of(String agencyOrgId, String subject, String message, String path) {
        return new AgencyAlert(List.of(agencyOrgId), subject, message, path);
    }
}
