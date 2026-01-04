# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- FE: Remove `orgId` from create DTOs (`AnnonceCreateRequest`, `DossierCreateRequest`) to rely exclusively on `X-Org-Id`.
- FE: Align `AnnonceStatus` with backend values (`DRAFT`, `PUBLISHED`, `ACTIVE`, `PAUSED`, `ARCHIVED`) and update UI badges.
- FE: Complete `DossierResponse` with `score`, `source`, `parties`, `existingOpenDossierId` and expose them in dossier detail UI.
- FE: Hide `orgId` from “Système” section; keep it only in “Avancé”.
- FE: Translate remaining system/interceptor messages to FR.
- FE: Replace raw “ID annonce” filter in dossiers list with a select/autocomplete based on annonce titles.

## [0.3.0] - 2026-01-04

### Week 3 — Auth/RBAC + Multi-tenant + API hardening

#### Added
- JWT/OIDC security (resource server) and Angular auth guard foundation.
- RBAC roles (`ADMIN`, `PRO`) enforced on protected endpoints.
- Tenant isolation via `X-Org-Id` header and Hibernate `orgIdFilter`.
- ProblemDetails-style error responses and stronger validation patterns.

#### Changed
- API security posture: endpoints under `/api/**` require tenant header and appropriate authorization.

## [0.2.0] - 2026-01-03

### Week 2 — DB schema + CRUD core (Annonce/Dossier) + UI

#### Added
- Flyway migrations for core CRM tables (`annonce`, `dossier`, `partie_prenante`, `consentement`, `message`, `appointment`, `audit_event`).
- CRUD APIs for Annonce and Dossier with filtering and pagination.
- Angular UI for annonces and dossiers (lists, forms, details) + API services.
- Backend/frontend integration testing baseline.

## [0.1.0] - 2026-01-01

### Week 1 baseline - Production-Ready Configuration

#### Added
- Spring profiles: `local`, `staging`, `prod`, `test`.
- `application-staging.yml` for staged environment configuration.
- `application-test.yml` using H2 for faster and isolated JUnit tests.
- `CHANGELOG.md` for project history tracking.
- Artifact upload steps in GitHub Actions workflows.
- Concurrency control in GitHub Actions to optimize PR validation.

#### Changed
- `application.yml`: Removed default active profile to ensure explicit selection.
- `application-prod.yml`: Replaced hardcoded Postgres URL with `${DB_URL}`.
- `pom.xml`: Scoped H2 to `test` and PostgreSQL to `runtime`.
- `backend-ci.yml`: Switched to Maven wrapper (`./mvnw`) and added JAR packaging verification.
- `frontend-ci.yml`: Enabled headless tests and enforced production build configuration.
- `README.md`: Comprehensive update with profile documentation, startup guides, and environment variable requirements.
- `Dockerfile`: Optimized Maven build flags (`-ntp`).
- `docker-compose.yml`: Added default values for environment variables and healthcheck improvements.

#### Verified
- Backend unit tests passing (7/7).
- Frontend linting passing (warnings only).
- Frontend headless tests passing.
- Frontend production build generation.
- JAR artifact packaging.
- Database driver scopes (PostgreSQL runtime, H2 test).
