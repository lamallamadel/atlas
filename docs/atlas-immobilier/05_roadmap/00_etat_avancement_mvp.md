# État d’avancement — MVP (AS-IS)

> **Statut**: Source de vérité (AS-IS)  
> **Dernière vérification**: 2026-11-23 (code de `master`, commit `6c3db9ad`)  
> **Source of truth**: Oui — décrit uniquement ce qui existe dans le code. Le « à faire » vit dans `02_backlog_mvp_execution.md`.  
> **Dépendances**:  
- `docs/atlas-immobilier/05_roadmap/02_backlog_mvp_execution.md`  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`  
- `docs/adr/`

Ce document a été réécrit le 2026-11-23 à partir du code. La version précédente (janvier 2026) déclarait « livrés » des éléments qui ne le sont pas (publication gouvernée, signalements, API publique) et ignorait des modules présents (matching, coop backend, signature).

## Stack réelle

| Couche | Version |
|---|---|
| Backend | Spring Boot 4.0.3, Java 25 |
| Frontend | Angular 21 (composants standalone, signals, zone.js) |
| Services IA | `brain/` (Python FastAPI) : `agent`, `match`, `nego`, `fraud`, `dupli`, `document`, `vision`, `proposal`, `scoring` |
| Base | PostgreSQL 16 (prod), H2 (local, tests). Flyway jusqu’à V156 |
| Messagerie | API WhatsApp Cloud de Meta (v25.0) ; Twilio pour les SMS |
| Identité | Keycloak (OIDC), claim `org_id` |
| Prod | `afroware.app` derrière Nginx + Cloudflare |

## Sites et routes

Les trois « sites » de la spec sont des zones de routes d’une seule application Angular, pas trois domaines.

| Spec | Réalité |
|---|---|
| Portail `atlasia.<tld>` | `/` (accueil, recherche, fiche annonce, consentement, pages légales) |
| Vitrine `biz.atlasia.<tld>` | `/biz` (accueil, agences, promoteurs, tarifs, démo, contact) |
| Pro `pro.atlasia.<tld>` | `/pro` (dashboard, dossiers, annonces, calendrier, tâches, relances, recherche, reporting, workflow-admin, réglages) |
| — | `/customer-portal` (portail client authentifié) |

## AS-IS par domaine

| Domaine | État | Ce qui existe | Ce qui manque par rapport à la spec |
|---|---|---|---|
| Dossiers et workflow | Hybride | Enum `DossierStatus` (`NEW, QUALIFYING, QUALIFIED, APPOINTMENT, WON, LOST`) validé par `DossierStatusTransitionService`. En parallèle : colonnes `case_type` et `status_code`, référentiels (V15), `WorkflowDefinition`, `DossierStatusCodeValidationService` | Un modèle unique (décision : ADR 0004, `case_type` + `status_code`) ; `GET /transitions` par dossier |
| Timeline, messages, RDV, audit | Livré | Activités, messages, rendez-vous, audit, historique de statut, onglets « Échanges » et « Activité » du dossier | — |
| Consentements | Livré, plus fin que la spec | Voir `02_fonctionnel/02_regles_metier.md` §2 : opt-in double pour MARKETING via lien public, preuve agent pour TRANSACTIONNEL, réponse dans la fenêtre de 24 h | — |
| WhatsApp | Livré | Webhook signé (HMAC App Secret), routage par `phone_number_id`, outbox avec relance, réponse depuis le dossier, lien de consentement, templates (`WhatsAppTemplate`, envoi `type: template`) | Validation en conditions réelles d’un template approuvé par Meta, hors fenêtre de 24 h |
| Multi-tenant | Livré | `X-Org-Id` + claim JWT `org_id` (403 si différent), filtre Hibernate après OSIV, tenant posé dans les jobs | — |
| Portail public | Partiel | Recherche `/api/v1/portal/annonces` (toutes agences), lead `POST /api/v1/portal/leads` | Lead routé vers l’agence de l’annonce (aujourd’hui forcé sur `ORG-001`) ; endpoint public de détail (la fiche appelle l’API Pro) ; signalement (simple `console.log`) ; slugs |
| Vitrine Biz | Partiel | Pages en place ; la démo crée un dossier `caseType: DEMO`, détails dans `notes` | Dossier `CRM_LEAD_B2B_DEMO` structuré |
| Pipeline B2B démo | Absent | — | Statuts `B2B_*`, kanban dédié, raisons de perte |
| Publication d’annonces | Divergent | Enum `DRAFT, PUBLISHED, ACTIVE, PAUSED, ARCHIVED`, CRUD Pro `/api/v1/annonces` | Statut `SUSPENDED`, score de qualité, minimum de photos, règle de publication |
| Trust et modération | Partiel | Services IA `brain/fraud` et `brain/dupli`, badges IA sur les annonces | Score de doublon persisté et bloquant, override manager, signalements, file de modération |
| RBAC | Divergent | Rôles `ADMIN`, `PRO`, `USER`, `SUPER_ADMIN` | `ADMIN_ORG`, `MANAGER`, `AGENT`, `OWNER`, `MODERATOR` ; « mes dossiers » ; réassignation contrôlée |
| Feature flags et plans | Absent | `FeatureFlagEntity` (utilisée par le white label) | Contrôle côté API, quotas, plans |
| Coop Habitat | Backend seul | Entités et contrôleurs groupe, membre, projet, lot, cotisation | Écrans, règles d’allocation, notifications |
| Reporting | Livré | Dashboard, KPI, rapports planifiés | — |

## Livré hors spec

Ces modules existent sans règles métier ni critères d’acceptation écrits.

| Module | Code |
|---|---|
| Matching acheteurs ↔ annonces, pitch WhatsApp avec photos, relances | `brain/match`, `PropertyPitchService`, onglet matching du dossier |
| Négociation, documents, vision | `brain/nego`, `brain/document`, `brain/vision`, `BrainVisionClient` |
| Lien de consentement public | `consent_request` (V156), `/api/v1/public/consent/{token}` |
| Lots de programmes (neuf) | `ProgramLotController` |
| Signature électronique | `ESignatureController` |
| Portail client, portail développeur, API publique v1 | `CustomerPortalController`, `DeveloperPortalController`, `PublicApiV1Controller` |
| White label, provisioning, onboarding tenant | `WhiteLabelAdminController`, `TenantProvisioningController`, `TenantOnboardingController` |
| Scoring, import et export de leads | `LeadScoringConfigController`, `LeadImportController`, `LeadExportController` |
| Yield management | `YieldManagementService` |
| Workflows documentaires, actions planifiées | `DocumentWorkflowController`, `ScheduledWorkflowAction` (V148) |
| Apps mobiles (CI) | `.github/workflows/mobile-android-ci.yml`, `mobile-ios-ci.yml` |

## Écarts bloquants pour une deuxième agence

1. Les leads publics vont tous chez `ORG-001`.
2. Aucune règle de publication (photos, qualité, doublons).
3. Signalements factices.
4. Deux modèles de statut de dossier (tranché par l’ADR 0004, migration à faire).
5. Pas de rôles d’agence (manager, agent).

L’ordre de traitement est dans `02_backlog_mvp_execution.md`.
