# Atlas Immobilier — Documentation Produit & Spécifications (v0.4-week3-2026-01-04)

> **Statut**: Stable  
> **Dernière vérification**: 2026-01-10  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/PROJECT_DOCUMENTATION_INDEX.md`

Ce dossier regroupe le **cahier des charges**, les **spécifications fonctionnelles**, les **spécifications techniques**, ainsi que la **roadmap** d’Atlas Immobilier (CRM immobilier).

## Périmètre couvert par cette mise à jour
Cette version consolide le **MVP Week 1 → Week 3** (fondations + CRUD + sécurité multi-tenant) et maintient les spécifications « Advanced CRM » pour la suite.

### Livrables réalisés (Week 1 → Week 3)
- **Monorepo** (`backend/`, `frontend/`, `infra/`, `docs/`) + scripts de dev.
- **Infra locale** via Docker Compose : PostgreSQL + **Keycloak** (import realm).
- **Backend Spring Boot (Java 17)** : CRUD **Annonces** & **Dossiers**, endpoints **Dashboard** + health.
- **Frontend Angular** : UI FR (dashboard / annonces / dossiers) + stabilisation des tests.
- **Sécurité** : Resource Server OAuth2/JWT (Keycloak) + mapping des rôles.
- **Multi-tenancy** : isolation stricte par `org_id` (header `X-Org-Id` + filtre Hibernate) + tests cross-tenant.

### Livrables réalisés (Advanced CRM & Phase 2 Agentic Commerce)
- **Messagerie / suivi des communications** (timeline d’activité) ✅
- **Audit trail** (journal de changements) ✅
- **Gestion des consentements** (RGPD / opt-in / opt-out) ✅
- **Workflow Dossier** (machine à états + transitions) ✅
- **Recherche & reporting** (full-text PostgreSQL + KPIs) ✅
- **Notifications** (email/SMS, templates, async) ✅
- **Qualité / prod readiness** (tests E2E Playwright, CI GitHub Actions, observables) ✅
- **IA Agentique (Phase 2)** : Coach Virtuel (Nudging), Chatbot IA WhatsApp, Génération de Contrats (LLM), Yield Management dynamique, Détection de Fraude/Doublons. ✅
- **UX/UI Calm & Mobile** : Bento Grids, Swipe-Friendly UI, palette de commandes CMD+K. ✅

## Organisation
- `01_cadrage/` : vision, objectifs, scope, personas
- `02_fonctionnel/` : user stories, règles métier, écrans
- `03_technique/` : architecture, API, données, sécurité
- `04_qa_prod/` : tests, CI, exploitation, checklists
- `05_roadmap/` : planification par sprints, dépendances
- `CHANGELOG.md` : évolutions et correctifs clés (dont corrections de tests FE)

## Démarrage local (résumé)
1) Lancer l'infra : `cd infra && docker compose up -d --build`
2) Récupérer un token Keycloak (ex: user `demo`) et le coller dans l'écran Login du front.
3) Définir l'org dans le navigateur : `localStorage.setItem('org_id','ORG1')` (ou `ORG2`).

Les détails (headers, rôles, obtention du token, isolation tenant) sont décrits dans `03_technique/04_security_multi_tenancy.md`.

## Extension (TO-BE) — Coop Habitat
Voir `02_fonctionnel/04_module_coop_habitat.md`.


## Modularité (plateforme unique)

- Modules activables (plans/entitlements) : `02_fonctionnel/05_feature_flags_plans.md`
- RBAC (rôles/permissions) : `03_technique/10_rbac_permissions.md`
- Dictionnaire de données (Core) : `03_technique/11_data_dictionary_core.md`
- Glossaire : `01_cadrage/03_glossaire.md`


## Extension MVP — 3 sites (Portail + Biz + Pro)

- **Portail public** (`atlasia.ma`) : `docs/atlas-immobilier/02_fonctionnel/06_portail_annonces_mvp.md`
- **Site vitrine B2B** (`biz.atlasia.ma`) : `docs/atlas-immobilier/02_fonctionnel/07_site_vitrine_biz_mvp.md`
- **Espace Pro** (`pro.atlasia.ma`) :
  - Pipeline B2B Demo : `docs/atlas-immobilier/02_fonctionnel/09_ui_pro_crm_b2b_demo.md`
  - Publications / Listings : `docs/atlas-immobilier/02_fonctionnel/10_ui_pro_listings_publication.md`

> Convention domaines: `www.atlasia.ma` redirige en 301 vers `atlasia.ma`.
- Arborescence du projet & déploiement (MVP) : `docs/atlas-immobilier/03_technique/14_repo_layout_deploiement.md`

