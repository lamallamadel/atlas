package com.example.backend.entity.enums;

/**
 * Cycle de vie d'une annonce : brouillon, publiée (visible sur le portail), suspendue (retirée
 * temporairement, avec une raison), archivée (fin de vie).
 *
 * <p>{@link #ACTIVE} et {@link #PAUSED} sont les anciens noms de {@link #PUBLISHED} et {@link
 * #SUSPENDED}. Ils restent acceptés en entrée pour les clients existants mais ne sont plus jamais
 * enregistrés (migration V158, {@link #normalize}).
 */
public enum AnnonceStatus {
    DRAFT,
    PUBLISHED,
    SUSPENDED,
    ARCHIVED,
    /**
     * @deprecated ancien nom de {@link #PUBLISHED}.
     */
    @Deprecated
    ACTIVE,
    /**
     * @deprecated ancien nom de {@link #SUSPENDED}.
     */
    @Deprecated
    PAUSED;

    /** Ramène les anciens noms aux statuts actuels ({@code null} reste {@code null}). */
    public static AnnonceStatus normalize(AnnonceStatus status) {
        if (status == ACTIVE) {
            return PUBLISHED;
        }
        if (status == PAUSED) {
            return SUSPENDED;
        }
        return status;
    }
}
