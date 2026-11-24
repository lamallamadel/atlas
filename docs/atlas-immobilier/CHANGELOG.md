# Changelog — v0.8-uc-proprietaire-2026-11-25

Cas d'usage n°1 : le propriétaire publie seul ou confie son bien à un agent (spec TO-BE, à valider avant code).
- `02_fonctionnel/13_uc_proprietaire_mandats.md` : parcours UC-P1 à UC-P9, matching, règles R-PROP-01 à 14, modèle, API, écrans, lots A/B/C et critères d'acceptation, questions ouvertes Q1 à Q8.
- `docs/adr/0005` : une organisation par propriétaire ; mandat et bien (`property`) comme objets inter-organisations.
- Intégré dans : personas, glossaire, nomenclature (§ 10 bis), règles métier (§ 8), feature flags (`module.mandate_marketplace`), RBAC (rôle `OWNER`), backlog (étapes 8 à 10).
- Backlog : étapes 2 à 7 marquées faites.

# Changelog — v0.7-docs-realigned-2026-11-23

Relecture des specs contre le code de `master` (commit `6c3db9ad`).
- `05_roadmap/00_etat_avancement_mvp.md` réécrit depuis le code : stack réelle, sites et routes, AS-IS par domaine, modules livrés hors spec, écarts bloquants.
- `05_roadmap/02_backlog_mvp_execution.md` : nouvel ordre de travail (leads multi-agences, publication gouvernée, signalements, rôles d’agence).
- `02_fonctionnel/02_regles_metier.md` §2 : règles de consentement réelles (MARKETING en opt-in double, TRANSACTIONNEL, réponse dans la fenêtre WhatsApp de 24 h, lien de consentement).
- WhatsApp : l’API WhatsApp Cloud de Meta remplace Twilio dans la doc (Twilio reste pour les SMS).
- Codes : `CRM_LEAD_B2B_DEMO` unifié, raisons de perte B2B alignées sur la nomenclature, sources de lead sans préfixe (comme en base), résultats de RDV corrigés.
- Coop Habitat : statut « backend seul ». Branding : état actuel `afroware.app` + routes `/`, `/biz`, `/pro`.
- `docs/implementations_archive/` déplacé dans `docs/archive/implementations/` ; liens morts vers des fichiers supprimés corrigés.
- `CLAUDE.md` : Angular 21, prochaine migration V157.

# Changelog — v0.4-week3-2026-01-04

> **Statut**: Historique  
> **Dernière vérification**: 2026-01-10  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/README.md`

## Week 3 — Sécurité + multi-tenancy (implémenté)
- Ajout **Keycloak** dans `infra/docker-compose.yml` + import automatique du realm (`myrealm`) et utilisateur de démonstration.
- Backend : **OAuth2 Resource Server (JWT)** + mapping de rôles depuis `realm_access.roles` (Keycloak) ou `roles`.
- Sécurisation des endpoints `'/api/**'` (actuator + swagger autorisés).
- Multi-tenancy : header `X-Org-Id` obligatoire sur les endpoints API + `TenantContext` + filtre Hibernate `orgIdFilter` activé à chaque requête.
- Tests : couverture des cas `401`/`403`, validation du `TenantFilter` et tests d’isolation cross-tenant sur services Annonce/Dossier.
- Frontend : interceptor HTTP ajoutant `Authorization: Bearer <token>` + `X-Org-Id` (depuis `localStorage`) + écran de login par token (dev).

## Points restant « Advanced CRM » (spécification prête, implémentation à venir)
- Endpoints + UI : **messages**, **consentements**, **audit read-only**, **appointments**, **workflow transitions**.
- E2E Playwright (parcours critiques) + durcissement CI.

---

# Changelog — v0.3-advanced-crm-2026-01-03

## Ajouts (Advanced CRM)
- Messagerie & timeline d’activité (EMAIL/SMS/PHONE/WHATSAPP, entrant/sortant).
- Audit logging automatique via listeners JPA (`@PostPersist/@PostUpdate/@PreRemove`) avec diffs JSON avant/après.
- Consentement RGPD par canal (opt-in/opt-out) + règles bloquantes de communication.
- Multi-tenancy `org_id` : filtrage systématique en lecture/écriture + contrôles Spring Security.
- Workflow Dossier (machine à états) + endpoint des transitions autorisées.
- Recherche & reporting (PostgreSQL full-text + KPIs).
- Notifications (email/SMS) avec templates + dispatch async.
- Stratégie de tests (Testcontainers + Playwright) et objectifs de couverture.

## Correctifs FE (tests unitaires)
- `DashboardKpiService` : ajout de `HttpClientTestingModule` dans le spec (provider `HttpClient` manquant).
- `GenericTableComponent` : alignement des attentes booléennes sur la locale FR (`Oui/Non` au lieu de `Yes/No`).
- `DossiersComponent` : enregistrement de la locale `fr` (`registerLocaleData(localeFr)`) + `LOCALE_ID=fr-FR` pour éviter l’erreur `Missing locale data "fr-FR"`.

## v0.6-docs-market-ready — 2026-01-07

- Harmonisation documentation selon 4 règles de cohérence (source of truth, encart statut, AS-IS vs TO-BE, enums → référentiels).
- Ajout des spécifications “référentiels + workflows modulables” (multi-métiers immobilier).
- Mise à jour notifications/outbound selon **Choix B** : WhatsApp Outbound réel (provider, templates, outbox, retry, monitoring) + consentement strict.

## 2026-01-10 — MVP “3 sites” (Portail + Biz + Pro)

Ajouts post `docs_merged_normalized` :
- Spécification Portail d’annonces (`atlasia.ma`) + URLs/SEO.
- Spécification site vitrine B2B (`biz.atlasia.ma`) + formulaire démo.
- Workflow B2B Demo (statuts/transitions + lost reasons) pour `CRM_LEAD_B2B_DEMO`.
- Contrat API Pro pour dossiers B2B Demo.
- Spécification UI Pro (Kanban/Liste/Détail) B2B Demo.
- Spécification UI Pro Publications / Listings.
- Contrat API Pro Listings (CRUD, médias, transitions, trust, reports).
- Acceptance Criteria E2E (Portail + Biz + Pro).

## Documentation — 2026-01-10
- Ajout de la page unique **Arborescence & déploiement (MVP)** : `docs/atlas-immobilier/03_technique/14_repo_layout_deploiement.md`


## Documentation — 2026-01-11
- Ajout de la spécification **Biz — SEO & Tracking (MVP)** : `docs/atlas-immobilier/02_fonctionnel/11_biz_seo_tracking.md`

- Ajout du document **MVP — Scope Freeze** : `docs/atlas-immobilier/01_cadrage/05_mvp_scope_freeze.md`
- Ajout du document **Référentiel — Freeze MVP** : `docs/atlas-immobilier/02_fonctionnel/12_referential_freeze_mvp.md`

- Ajout du document **API Public — Portail & Biz (MVP)** : `docs/atlas-immobilier/03_technique/15_api_public_portal_biz.md`
- Ajout du document **Modèle de données — MVP (DB Schema)** : `docs/atlas-immobilier/03_technique/16_db_mvp_schema.md`
- Ajout du document **Runbook — Dev & Déploiement (MVP)** : `docs/atlas-immobilier/03_technique/17_runbook_dev_deploy_mvp.md`
- Ajout du document **Backlog — Exécution MVP** : `docs/atlas-immobilier/05_roadmap/02_backlog_mvp_execution.md`