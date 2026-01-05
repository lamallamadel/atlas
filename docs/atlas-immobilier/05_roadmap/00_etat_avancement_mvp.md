# État d’avancement — MVP (Week 1 → Week 3) + reste à faire

Ce document sert de **photo instantanée** pour aligner l’équipe (ou un agent AI) sur :
- ce qui est **déjà livré** (Week 1 à Week 3)
- ce qui reste à faire pour atteindre un **MVP CRM** cohérent et utilisable

---

## Livré

### Week 1 — Foundations
- Monorepo : `backend/`, `frontend/`, `infra/`, `docs/`
- Infrastructure locale Docker Compose : PostgreSQL, volumes persistants, healthchecks
- Convention de profils Spring (local/test/prod) + configuration dev ergonomique
- Base de qualité : hygiène repo, scripts de lancement, conventions de logs

### Week 2 — MVP métier (CRUD + UI)
- Backend :
  - CRUD **Annonces** (`/api/v1/annonces`)
  - CRUD **Dossiers** (`/api/v1/dossiers`) + règles métier de déduplication
  - Endpoint **Dashboard** KPIs (`/api/v1/dashboard/...`)
  - Normalisation des erreurs HTTP (400/404/409) dans les tests
- Frontend :
  - Pages dashboard / annonces / dossiers en FR
  - Stabilisation de tests unitaires FE (HttpClientTestingModule, locale FR, attentes booléennes)

### Week 3 — Sécurité + multi-tenancy
- Infra :
  - Ajout de **Keycloak** au Docker Compose (import realm `myrealm`)
- Backend :
  - **OAuth2 Resource Server (JWT)** (issuer configurable)
  - Rôles : `ADMIN`, `MANAGER`, `PRO` (mapping en autorités Spring)
  - Multi-tenancy : `X-Org-Id` obligatoire + `TenantContext` + filtre Hibernate `orgIdFilter`
  - Tests : `TenantFilter` (400 si header manquant) + tests d’isolation cross-tenant (ORG1/ORG2)
- Frontend :
  - Interceptor HTTP injectant `Authorization` + `X-Org-Id` pour les URLs `/api/`
  - Écran de login par collage de token (dev) + tokens mock (dev)

---

## Reste à faire (priorisé)

### P1 — Compléter le « CRM » minimal (fonctionnel)
1) **Workflow Dossier**
   - matrice de transitions (NEW → QUALIFIED → WON/LOST, etc.)
   - endpoint `GET /api/dossiers/{id}/transitions` + `POST /api/dossiers/{id}/transition`
   - UI : proposer uniquement les transitions autorisées

2) **Parties prenantes (CRUD)**
   - endpoints dédiés (ou enrichissement Dossier) pour gérer acheteur/vendeur/contacts
   - validation (téléphone/email) + règles de déduplication contact (option MVP)

3) **Messagerie / Timeline**
   - endpoints messages (create/list) liés au dossier
   - UI timeline dans le détail dossier (tri, filtres)

4) **Consentements (RGPD)**
   - endpoints consentements liés au dossier (ou party) + UI (badges)
   - règle bloquante : pas d’OUTBOUND si OPT_OUT

5) **Audit (read-only)**
   - capture automatique (listener/AOP) + endpoint de consultation
   - UI : historique dans le dossier

### P2 — Qualité / exploitation
- **Testcontainers PostgreSQL** (migrations Flyway + jsonb + contraintes)
- **E2E Playwright** sur les parcours : création annonce, création dossier, changement statut, timeline
- CI : lint + tests + rapports coverage

### P3 — Reporting & notifications
- reporting (funnel, sources, délais)
- notifications (email/sms) + templates + async

---

## Notes d’exécution (dev)
- Démarrer l’infra : `cd infra && docker compose up -d --build`
- Récupérer un token Keycloak (user `demo`) et le coller dans le login du front
- Définir le tenant dans le navigateur : `localStorage.setItem('org_id','ORG1')`

Voir `03_technique/04_security_multi_tenancy.md` pour le détail.
