# Stratégie de tests & production readiness — état Week 3

## Backend
### Types de tests en place
- **Unit/Service tests** (H2 ou profil test) couvrant :
  - règles métier Annonce/Dossier
  - déduplication Dossier
  - cas d’erreurs normalisés (400/404/409)
  - **isolation cross-tenant** (ORG1/ORG2)

- **Tests Web/Security** couvrant :
  - endpoints protégés `/api/**` (401/403)
  - endpoints publics (actuator / swagger / ping)
  - comportement du `TenantFilter` (400 si `X-Org-Id` absent)

### Recommandations (sprints suivants)
- **Testcontainers PostgreSQL** pour valider :
  - migrations Flyway
  - jsonb / indexes / contraintes
  - performances des filtres et recherches

### Objectif couverture
- 85%+ sur services critiques (workflow, multi-tenancy, consentements)

---

## Frontend
### Unit tests (Karma/Jasmine)
- Tests de stabilité existants sur :
  - `AuthService` (stockage token + parsing JWT)
  - `HttpAuthInterceptor` (injection `Authorization` + `X-Org-Id`)
  - correctifs de specs (HttpClientTestingModule, locale FR, attentes booléennes)

### E2E — Playwright (à planifier)
Parcours critiques :
1) création annonce
2) création dossier (déduplication)
3) changement statut dossier
4) isolation tenant (ORG1/ORG2) si testable via environnement
5) smoke : dashboard KPIs

---

## CI (à industrialiser)
- lint + unit tests FE/BE
- integration tests (Testcontainers)
- e2e (Playwright headless)
- artefacts : rapports coverage
