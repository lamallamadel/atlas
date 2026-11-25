# RBAC — Rôles d'agence et droits

> **Statut** : implémenté (étape 6, lots A, B et C)  
> **Dernière vérification** : 2026-11-23  
> **Source of truth** : Oui (rôles, matrice, règles appliquées par le serveur)  
> **Dépendances** :  
- `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`  
- `docs/atlas-immobilier/02_fonctionnel/05_feature_flags_plans.md`

## Rôles

Les rôles sont des rôles de realm Keycloak, lus dans `realm_access.roles` du jeton.

| Rôle Keycloak | Rôle d'agence | Rôle |
|---|---|---|
| `ADMIN` | Administrateur | Équipe, réglages, intégrations, tous les droits de l'agence |
| `MANAGER` | Manager | Vision de toute l'agence, réassignation, dérogations, invite des agents |
| `AGENT` | Agent | Traite les dossiers ; voit les siens et ceux à attribuer si l'agence l'a choisi |
| `PRO` | Agent | Ancien nom, lu comme `AGENT` pour les comptes existants |
| `SUPER_ADMIN` | — | Plateforme, au-dessus des agences ; droits d'un administrateur |

Choix retenus (décidés le 2026-11-23) :

- `ADMIN` n'est pas renommé en `ADMIN_ORG` : 81 contrôles et les jetons existants l'utilisent.
- `OWNER` (propriétaire) et `MODERATOR` (modération plateforme) sont hors périmètre de l'étape 6 : ils supposent un espace propriétaire et une modération centrale qui n'existent pas. La modération des signalements est faite par l'agence. `OWNER` est spécifié par le cas d'usage n°1 (section ci-dessous, TO-BE).

## Matrice

| Action | Agent | Manager | Admin |
|---|---|---|---|
| Voir les dossiers | Tous ; les siens et ceux à attribuer si le réglage « mes dossiers » est actif | Tous ceux de l'agence | Tous ceux de l'agence |
| Prendre un dossier à attribuer | Oui, pour lui | Oui | Oui |
| Réassigner un dossier | Non | Oui | Oui |
| Changer le statut, écrire au client, RDV, consentements | Oui (sur les dossiers qu'il voit) | Oui | Oui |
| Annonces : créer, modifier, publier, suspendre | Oui | Oui | Oui |
| Déroger à un doublon ou une fraude | Non | Oui | Oui |
| Signalements : écarter, suspendre l'annonce | Oui | Oui | Oui |
| Inviter des utilisateurs | Non | Des agents | Tous les rôles |
| Changer un rôle, désactiver un compte | Non | Non | Oui |
| Réglages, quotas, intégrations (WhatsApp…) | Non | Non | Oui |

## Mise en œuvre

**Lecture des rôles** (`SecurityConfig.toAuthorities`). `AGENT` et `PRO` donnent `ROLE_AGENT` et `ROLE_PRO` ; `MANAGER` donne `ROLE_MANAGER` et `ROLE_PRO`. Les `@PreAuthorize("hasAnyRole('ADMIN','PRO')")` existants signifient donc « membre de l'agence » et restent valables.

**Premier filtre : `@PreAuthorize`.** Il distingue « membre de l'agence » et « admin ».

**Règles fines : `security/AccessPolicy`.** Les services l'appellent :

- `canAssign()` ;
- `canOverrideTrust()` ;
- `canInvite(role)` ;
- `canManageTeam()`.

Un refus renvoie 403 avec un code lisible (`MANAGER_REQUIRED`, `INVITE_FORBIDDEN`, `ADMIN_REQUIRED`).

**Front** (`services/agency-role.ts`). Les mêmes règles servent à masquer les boutons, mais c'est le serveur qui décide.

## Périmètre « mes dossiers »

Réglage d'agence `restrictAgentsToOwnDossiers` (`organization_settings.settings.team`), désactivé par défaut. Seul l'admin le change (`PUT /api/v1/team/settings`) ; tous les membres le lisent (`GET`).

Quand il est actif, il s'applique aux agents seulement, et tout est décidé côté serveur.

Ce qu'un agent voit :

- ses dossiers et ceux à attribuer ;
- tout ce qui se rattache à ces dossiers : messages, RDV, tâches, documents, consentements, parties prenantes, activité, scores, signatures, commentaires, audit.

Le dossier d'un collègue répond 404, comme celui d'une autre agence.

Mécanisme (`security/DossierScope`) :

1. **Filtre Hibernate `dossierScopeFilter`.** `HibernateFilterInterceptor` l'active pour la requête. Il restreint toutes les requêtes JPQL et Criteria :
   - sur `dossier` ;
   - sur les 20 entités qui portent un `dossier_id` ;
   - sur les tables génériques `comment_thread` et `audit_event` (`entity_type = 'DOSSIER'`).
2. **Garde-fou `DossierScopeGuard`.** Ce sont des écouteurs Hibernate `POST_LOAD` et `PRE_INSERT`, car le filtre ne couvre pas `findById`. Un dossier hors périmètre, ou un élément qui s'y rattache, chargé par identifiant ou créé sur un tel dossier, déclenche un 404. Un test vérifie que la liste des entités protégées et celle des entités filtrées restent identiques.
3. **Cas hors JPA :**
   - recherche SQL native : clause ajoutée ;
   - Elasticsearch : non utilisé pour un agent restreint, qui cherche en base ;
   - recherche et mentions de commentaires : clause ajoutée, et filtre d'agence qui manquait ;
   - requêtes personnalisées : refusées (403) ;
   - caches du détail de dossier et du reporting : contournés.

Hors périmètre volontairement :

- les notifications, qui sont adressées à une personne ;
- les réservations de lots, qui forment le stock partagé de l'agence ;
- le portail client.

Les annonces restent partagées par toute l'agence.

Propagation : le réglage est gardé en mémoire 30 secondes par instance.

## Équipe

| Endpoint | Accès | Effet |
|---|---|---|
| `GET /api/v1/team?includeDisabled=` | Membres | Membres de l'agence (attribut Keycloak `orgId`) avec rôle et statut |
| `POST /api/v1/users/invite` | Manager, admin | Crée le compte, lui donne le rôle demandé, envoie l'e-mail de mot de passe |
| `PUT /api/v1/team/{userId}/role` | Admin | Remplace le rôle d'agence (retire `PRO` au passage) |
| `PUT /api/v1/team/{userId}/enabled` | Admin | Désactive ou réactive le compte |

Garde-fous :

- Un compte d'une autre agence renvoie 404, comme entre agences.
- On ne change pas son propre rôle et on ne désactive pas son propre compte.
- L'agence garde toujours au moins un administrateur actif (`LAST_ADMIN`, 409).
- Si l'attribution du rôle échoue à l'invitation, le compte créé est supprimé.
- Le rôle `AGENT` est créé dans le realm s'il manque.
- Keycloak injoignable : 503 `DIRECTORY_UNAVAILABLE`.

Écran : `/pro/team`, visible du manager et de l'admin.

## Traçabilité

- **Réassignation d'un dossier** : ligne dans le fil d'activité, événement d'audit `ASSIGNED`, notification à l'agent.
- **Changement de rôle et désactivation** : journalisés dans les logs applicatifs (auteur, agence, compte). La table d'audit n'accepte que des identifiants numériques, ce qui exclut les comptes Keycloak.

## Propriétaire et bourse aux mandats (cas d'usage n°1)

Spec : `02_fonctionnel/13_uc_proprietaire_mandats.md` § 10 ; modèle : ADR 0005.

Livré (lot A) : `/api/v1/owner/**` exige `ROLE_OWNER` ; toute autre route `/api/**` authentifiée refuse un jeton `OWNER` (403) ; `OwnerContext` vérifie que le claim `org_id` du jeton égale `X-Org-Id` et que l'organisation est de type `OWNER`. La modération des annonces de particuliers (`/api/v1/admin/moderation/owner-annonces`) est réservée à `SUPER_ADMIN`. La bourse aux mandats reste TO-BE (lot B).

| Rôle Keycloak | Autorités | Portée |
|---|---|---|
| `OWNER` | `ROLE_OWNER` seulement (jamais `ROLE_PRO`) | Son organisation personnelle (`org_type = OWNER`) ; routes `/api/v1/owner/**` |
| `MODERATOR` (plus tard ; `SUPER_ADMIN` en attendant) | `ROLE_MODERATOR` | Modération des annonces de particuliers, fraude, litiges de mandat |

| Action | Propriétaire | Agent | Manager | Admin agence |
|---|---|---|---|---|
| Biens, annonce, leads, visites du propriétaire | Les siens | — | — | — |
| Ouvrir ou annuler une demande d'accompagnement ; accepter ou refuser une proposition | Oui | — | — | — |
| Bourse aux mandats : consulter, proposer, retirer sa proposition | — | Oui | Oui | Oui |
| Voir les propositions de l'agence | — | Les siennes | Toutes | Toutes |
| Lire les coordonnées et l'adresse du propriétaire | — | Si mandat `PENDING_SIGNATURE` ou `ACTIVE` de son agence | Idem | Idem |
| Profil public et zones de l'agence | — | — | Oui | Oui |

Conditions supplémentaires appliquées par le serveur : agence `verifiedPro`, module `module.mandate_marketplace` actif, quota `quota.mandate_proposals_month` non épuisé. Les objets inter-organisations passent par `MandateAccessService` ; aucune autre classe ne lève le filtre `orgIdFilter` pour eux.

