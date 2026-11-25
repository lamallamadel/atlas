package com.example.backend.owner;

/**
 * Alerte envoyée par la plateforme à un propriétaire ou à un prospect (cas d'usage n°1, Q3 :
 * messagerie Atlas + alerte). Tout est calculé avant la publication de l'événement : l'envoi, après
 * validation de la transaction, n'a plus besoin de la base.
 *
 * @param audience à qui s'adresse l'alerte (choisit le modèle WhatsApp)
 * @param phone téléphone au format international, ou {@code null}
 * @param email adresse e-mail, ou {@code null}
 * @param text phrase courte, variable {@code {{1}}} du modèle WhatsApp et corps du SMS
 * @param subject objet de l'e-mail
 * @param linkParam variable du bouton du modèle WhatsApp (jeton du prospect, identifiant du contact
 *     pour le propriétaire)
 * @param linkUrl lien complet, pour l'e-mail et le SMS
 * @param whatsappAllowed {@code false} si le destinataire a retiré son accord WhatsApp
 * @param emailAllowed {@code false} si le destinataire a retiré son accord e-mail
 */
public record PlatformAlert(
        Audience audience,
        String phone,
        String email,
        String text,
        String subject,
        String linkParam,
        String linkUrl,
        boolean whatsappAllowed,
        boolean emailAllowed) {

    public enum Audience {
        OWNER,
        PROSPECT
    }
}
