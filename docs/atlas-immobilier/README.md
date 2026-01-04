# Atlas Immobilier — Documentation Produit & Spécifications (v0.4-week3-2026-01-04)

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

### Backlog déjà spécifié (Advanced CRM)
- **Messagerie / suivi des communications** (timeline d’activité)
- **Audit trail** (journal de changements)
- **Gestion des consentements** (RGPD / opt-in / opt-out)
- **Workflow Dossier** (machine à états + transitions)
- **Recherche & reporting** (full-text PostgreSQL + KPIs)
- **Notifications** (email/SMS, templates, async)
- **Qualité / prod readiness** (tests, CI, couverture, observabilité)

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

