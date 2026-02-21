# ADR 0003: Multi-tenant Isolation Strategy

## Status
Accepté

## Contexte
Le CRM "Atlas 2026" se transforme en Software-as-a-Service (SaaS) où chaque agence immobilière est une "Organisation" complètement étanche. Les courtiers de l'Organisation A ne doivent en aucun cas accéder aux annonces ou dossiers de l'Organisation B, sous peine de fuite de données critiques. Nous devions choisir la meilleure stratégie de "Database Multi-tenancy".

## Alternatives Envisagées
1.  **Database-per-Tenant** : Une base de données physique distincte pour chaque client. Trop coûteux et pénible à scripter pour des centaines de petites agences PME.
2.  **Schema-per-Tenant** : Une seule DB, mais un `schema` PostgreSQL par agence. Bon compromis, mais complexifie drastiquement le paramétrage Flyway et les connexions poolées (HikariCP).
3.  **Discriminator-Column (Row-level Isolation)** : Une base partagée, toutes les tables ont une colonne `org_id` (Tenant ID).

## Décision
Nous avons opté pour le modèle **Discriminator-Column** (Shared Database, Shared Schema) encadré par la technologie **Hibernate @Filter** et un Context Holder local au thread.

1.  **Filtre Global** : Un filtre `orgIdFilter` (`@FilterDef` / `@Filter`) d'Hibernate est défini globalement.
2.  **Interception de Requête** : Un intercepteur Spring Web (`TenantInterceptor`) extrait le `org_id` soit depuis le token JWT injecté par Keycloak, soit directement depuis un `X-Org-Id` HTTP Header. Il l'injecte ensuite dans un `TenantContext` de type `ThreadLocal`.
3.  **Injection du paramètre** : Avant toute exécution de transaction (grâce à un conseil AOP ou un aspect Spring), la session Hibernate sous-jacente s'active et le filtre conditionnel PostgreSQL `org_id = :tenantId` est automatiquement suffixé à toutes les requêtes (SELECT, UPDATE, DELETE).

## Conséquences

### Positives
*   **Simplicité opérationnelle** : Un seul script Flyway (`V1__init.sql`) à déployer. Backups centralisés. Mise à l'échelle horizontale facilitée. Aucun surcoût d'infrastructure par client ajouté.
*   **Isolation Déclarative** : Le développeur ne doit pas penser à rajouter "WHERE org_id = ?" dans ses requêtes JPQL ; le filtre Hibernate s'en charge.

### Négatives
*   **Risque de fuite en cas d'erreur de dev** : Si une entité est marquée sans l'annotation `@Filter`, il est très facile de polluer l'espace, demandant une forte vigilance en Code Review.
*   **Performances sur gros volumes** : Toutes les requêtes passent par une table massive. L'indexation composite sur `(org_id, id)` est vitale sur toutes les grandes entités du système.
