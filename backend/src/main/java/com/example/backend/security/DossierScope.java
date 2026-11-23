package com.example.backend.security;

import java.util.HashMap;
import java.util.Map;

/**
 * Périmètre « mes dossiers » (étape 6, lot C). Quand l'agence l'active, un agent ne voit que ses
 * dossiers et ceux à attribuer, ainsi que tout ce qui s'y rattache (messages, RDV, documents…).
 *
 * <p>Deux mécanismes, posés par {@code HibernateFilterInterceptor} pour la durée de la requête :
 *
 * <ul>
 *   <li>le filtre Hibernate {@link #FILTER} restreint toutes les requêtes JPQL et Criteria sur
 *       {@code Dossier} et sur les entités qui portent un {@code dossier_id} ;
 *   <li>{@link DossierScopeGuard} refuse (404) le chargement direct par identifiant d'un dossier
 *       hors périmètre ou d'un élément qui s'y rattache, et l'écriture sur un tel dossier.
 * </ul>
 *
 * <p>Les requêtes SQL natives et les caches partagés doivent en tenir compte eux-mêmes ({@link
 * #isRestricted()}).
 */
public final class DossierScope {

    public static final String FILTER = "dossierScopeFilter";
    public static final String PARAM = "dsUserId";

    /** Condition sur {@code dossier}. */
    public static final String DOSSIER_CONDITION =
            "({alias}.assigned_to = :dsUserId OR {alias}.assigned_to IS NULL)";

    /** Condition sur une entité rattachée à un dossier par {@code dossier_id}. */
    public static final String CHILD_CONDITION =
            "({alias}.dossier_id IS NULL OR {alias}.dossier_id IN (SELECT dsf.id FROM dossier dsf"
                    + " WHERE dsf.assigned_to = :dsUserId OR dsf.assigned_to IS NULL))";

    /**
     * Condition sur une table générique ({@code entity_type}, {@code entity_id}) : fils de
     * commentaires, événements d'audit.
     */
    public static final String TYPED_CONDITION =
            "({alias}.entity_type <> 'DOSSIER' OR {alias}.entity_id IN (SELECT dsf.id FROM dossier"
                    + " dsf WHERE dsf.assigned_to = :dsUserId OR dsf.assigned_to IS NULL))";

    private record State(String userId, Map<Long, Boolean> visibility) {}

    private static final ThreadLocal<State> CURRENT = new ThreadLocal<>();

    private DossierScope() {}

    /** Active le périmètre pour l'agent {@code userId} sur le fil de la requête. */
    public static void enter(String userId) {
        CURRENT.set(new State(userId, new HashMap<>()));
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static boolean isRestricted() {
        return CURRENT.get() != null;
    }

    /** L'agent restreint, ou {@code null}. */
    public static String userId() {
        State state = CURRENT.get();
        return state == null ? null : state.userId();
    }

    /** Un dossier ainsi assigné est-il visible ? Toujours vrai hors périmètre. */
    public static boolean isVisibleAssignee(String assignedTo) {
        State state = CURRENT.get();
        return state == null || assignedTo == null || assignedTo.equals(state.userId());
    }

    /** Visibilité déjà calculée pour ce dossier dans la requête, ou {@code null}. */
    static Boolean memo(Long dossierId) {
        State state = CURRENT.get();
        return state == null ? Boolean.TRUE : state.visibility().get(dossierId);
    }

    static void remember(Long dossierId, boolean visible) {
        State state = CURRENT.get();
        if (state != null) {
            state.visibility().put(dossierId, visible);
        }
    }
}
