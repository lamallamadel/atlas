# Architecture — décisions clés

> **Statut**: Stable (décisions)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`

## Décision A — Audit automatique via listeners JPA
**Choix** : `@EntityListeners` + callbacks JPA pour capturer CREATE/UPDATE/DELETE.
- Avantages : couverture exhaustive quel que soit le point d’entrée (REST, batch, import).
- Contraintes : gérer la sérialisation avant/après, et les cas de lazy-loading.

## Décision B — Multi-tenancy row-level via `org_id`
**Choix** : isolation applicative via `org_id` avec :
- header tenant `X-Org-Id` → `TenantContext` (ThreadLocal)
- **Hibernate Filter** (`@Filter`) activé à chaque requête (filtrage row-level côté ORM)
- Avantages : déploiement simple (une DB), analytics cross-tenant possible (sous contrôle admin).
- Contraintes : discipline stricte (toutes les queries doivent filtrer) + tests d’isolation.

## Décision D — AuthN/AuthZ via Keycloak (OIDC)
**Choix** : Keycloak en local (Docker Compose) + backend en **OAuth2 Resource Server (JWT)**.
- Avantages : standard OIDC, rôles centralisés, trajectoire vers SSO.
- Contraintes : gestion des environnements (issuer URI), et intégration front (actuellement par collage de token).

## Décision C — Workflow sous forme de machine à états
**Choix** : service dédié `DossierWorkflowService` (transition validation) plutôt que patch arbitraire.
- Avantages : cohérence, automatisations (notifications, scoring), UI dynamique.
- Contraintes : maintenir une matrice de transitions + règles contextuelles.

## Décision E — Bounded contexts (CRM vs Coop Habitat)
**Choix** : intégrer “Coop Habitat” comme un **bounded context** séparé (tables + services dédiés) tout en réutilisant les briques transverses :
- multi-tenant (`org_id`), audit, timeline,
- notifications outbound (outbox/worker),
- référentiels/workflows modulables.

- Avantages : évite de déformer le CRM, limite la complexité, facilite l’évolutivité (paiements V2).
- Contraintes : définir clairement les frontières (pas de mélange “Dossier” et “Groupement” sans lien explicite).

Docs :
- `02_fonctionnel/04_module_coop_habitat.md`
- `03_technique/09_notifications.md`
