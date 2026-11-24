# RBAC — Rôles d'agence et droits

> **Statut** : implémenté pour les rôles d'agence (étape 6, lots A et B) ; restriction « mes dossiers » prévue au lot C  
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
| `AGENT` | Agent | Traite les dossiers ; voit les siens et ceux à attribuer (lot C) |
| `PRO` | Agent | Ancien nom, lu comme `AGENT` pour les comptes existants |
| `SUPER_ADMIN` | — | Plateforme, au-dessus des agences ; droits d'un administrateur |

Choix retenus (décidés le 2026-11-23) :

- `ADMIN` n'est pas renommé en `ADMIN_ORG` : 81 contrôles et les jetons existants l'utilisent.
- `OWNER` (propriétaire) et `MODERATOR` (modération plateforme) sont hors périmètre : ils supposent un espace propriétaire et une modération centrale qui n'existent pas. La modération des signalements est faite par l'agence.

## Matrice

| Action | Agent | Manager | Admin |
|---|---|---|---|
| Voir les dossiers | Tous aujourd'hui ; les siens et ceux à attribuer quand le lot C est activé | Tous ceux de l'agence | Tous ceux de l'agence |
| Prendre un dossier à attribuer | Oui, pour lui | Oui | Oui |
| Réassigner un dossier | Non | Oui | Oui |
| Changer le statut, écrire au client, RDV, consentements | Oui (sur ses dossiers au lot C) | Oui | Oui |
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
