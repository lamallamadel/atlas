# Changelog — v0.4-week3-2026-01-04

> **Statut**: Historique  
> **Dernière vérification**: 2026-01-10  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/PROJECT_DOCUMENTATION_INDEX.md`

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
