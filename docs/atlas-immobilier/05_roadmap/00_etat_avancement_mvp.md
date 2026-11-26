# État d’avancement — MVP (AS-IS)

> **Statut**: Source de vérité (AS-IS)  
> **Dernière vérification**: 2026-11-24 (branche `chore/release-stabilization`, étapes 1 à 7 du plan de relecture)  
> **Source of truth**: Oui — décrit uniquement ce qui existe dans le code. Le « à faire » vit dans `02_backlog_mvp_execution.md`.  
> **Dépendances**:  
- `docs/atlas-immobilier/05_roadmap/02_backlog_mvp_execution.md`  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`  
- `docs/adr/`

Ce document a été réécrit le 2026-11-23 à partir du code, puis mis à jour le 2026-11-24 après les étapes 3 à 7 (leads multi-agences, publication gouvernée, signalements, rôles d'agence, pipeline B2B, modules, écrans Coop).

## Stack réelle

| Couche | Version |
|---|---|
| Backend | Spring Boot 4.0.3, Java 25 |
| Frontend | Angular 21 (composants standalone, signals, zone.js) |
| Services IA | `brain/` (Python FastAPI) : `agent`, `match`, `nego`, `fraud`, `dupli`, `document`, `vision`, `proposal`, `scoring` |
| Base | PostgreSQL 16 (prod), H2 (local, tests). Flyway jusqu’à V162 |
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
| Dossiers et workflow | Livré (ADR 0004, phases A et B) | `case_type` + `status_code` font foi : un changement de statut est validé par le workflow du type (`DossierWorkflowCatalog` ou `WorkflowDefinition` publiée), avec exigences (raison de perte, rendez-vous). `GET /dossiers/{id}/transitions`, carte « Statut » du dossier. L'enum `DossierStatus` est une projection. Historique avec codes (V161) | Phase C : écrans et kanban CRM lus depuis le code de statut, retrait de l'enum |
| Timeline, messages, RDV, audit | Livré | Activités, messages, rendez-vous, audit, historique de statut, onglets « Échanges » et « Activité » du dossier | — |
| Consentements | Livré, plus fin que la spec | Voir `02_fonctionnel/02_regles_metier.md` §2 : opt-in double pour MARKETING via lien public, preuve agent pour TRANSACTIONNEL, réponse dans la fenêtre de 24 h | — |
| WhatsApp | Livré | Webhook signé (HMAC App Secret), routage par `phone_number_id`, outbox avec relance, réponse depuis le dossier, lien de consentement, templates (`WhatsAppTemplate`, envoi `type: template`) | Validation en conditions réelles d’un template approuvé par Meta, hors fenêtre de 24 h |
| Multi-tenant | Livré | `X-Org-Id` + claim JWT `org_id` (403 si différent), filtre Hibernate après OSIV, tenant posé dans les jobs | — |
| Portail public | Livré | Recherche `/api/v1/portal/annonces` (annonces publiées), détail public sans données internes, lead `POST /api/v1/portal/leads` routé vers l'agence de l'annonce avec consentement, signalement d'annonce, photos servies aux visiteurs non connectés (`/portal/annonces/{id}/media/{mediaId}`), badge « Particulier » | Limite anti-spam sur les leads et signalements anonymes ; slugs |
| Vitrine Biz | Livré | La demande de démo crée un dossier `CRM_LEAD_B2B_DEMO` dans l'organisation plateforme, profil gardé en `lead_details` (V162) | — |
| Pipeline B2B démo | Livré | Statuts `B2B_*` (spec 08), raisons `B2B_LOST_*`, écran kanban `/pro/b2b-demo` | Replanification dédiée, annulation du RDV à la perte |
| Publication d’annonces | Livré | `DRAFT → PUBLISHED ⇄ SUSPENDED → ARCHIVED` (V158), score de qualité, 3 photos minimum, doublon certain ou fraude bloquants sauf dérogation manager | Dédoublonnage synchrone à la publication |
| Trust et modération | Livré (agence) | Signalements depuis le portail (V159), file côté Pro, écarter ou suspendre l'annonce | Seuil de suspension automatique, notification de nouveau signalement, écran de file dédié |
| Propriétaire autonome (cas d'usage n°1, lot A) | Livré | Inscription par code (WhatsApp, SMS en secours, V165), rôle `OWNER` et organisation personnelle (`organization`, V163), biens (`property`, V164), annonce du propriétaire avec modération a priori par l'équipe Atlas (`/pro/moderation`), contacts reçus dans l'espace `/proprietaire`, échanges avec le prospect par la plateforme et lien personnel `/contact/{jeton}`, créneaux de visite, alertes WhatsApp / e-mail / SMS (V166) (spec 13) | Rappel de visite ; lots B et C |
| Bourse aux mandats (cas d'usage n°1, lot B) | Livré | Demande d'accompagnement ouverte ou directe, annuaire et profil des agences vérifiées, zones, propositions (5 au plus, une par agence, quota mensuel), messages masqués avant acceptation, acceptation par code, mandat et dossier `CRM_MANDATE_*` dans l'agence, exclusivité (annonce du propriétaire suspendue, redirection), mandats simples regroupés sur une fiche portail (V167, spec 13) | Document de mandat et signature en ligne ; lot C (score, invitations, suivi par le propriétaire, avis) |
| RBAC | Livré | Rôles `ADMIN`, `MANAGER`, `AGENT` (`PRO` lu comme agent), `SUPER_ADMIN`, `OWNER` (routes `/api/v1/owner/**` seulement) ; `AccessPolicy` ; assignation des dossiers (V160) ; périmètre « mes dossiers » activable par agence ; écran « Équipe » (spec `10_rbac_permissions.md`) | `MODERATOR` (la modération est faite par le super-admin) |
| Feature flags et plans | Partiel | Modules par agence appliqués côté API (`@RequiresFeature`, 403) : Coop, Neuf, export des leads, signature ; actifs par défaut, gérés par le super-admin (spec 05) | Plans → modules, quotas (dossiers mensuels) |
| Coop Habitat | Partiel | Backend CRUD et écrans `/pro/coop` : membres, cotisations, projets et lots (spec 04) | Rang FIFO, allocation avec PV, échéancier, justificatifs, WhatsApp |
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

Les cinq écarts relevés le 2026-11-23 sont traités :
- leads routés vers l'agence de l'annonce ;
- règles de publication ;
- signalements réels ;
- modèle de statut unique (phases A et B de l'ADR 0004) ;
- rôles d'agence.

Points de vigilance qui restent avant d'ouvrir le portail à plusieurs agences :
- limite anti-spam sur les formulaires publics ;
- notification et seuil de suspension sur les signalements ;
- audit des requêtes personnalisées (`CustomQueryService`), qui assemblent du SQL à partir de paramètres.

L'ordre de traitement est dans `02_backlog_mvp_execution.md`.
