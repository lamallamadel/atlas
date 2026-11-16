# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atlas Immobilier CRM — a full-stack real estate CRM monorepo. Services:
- **`backend/`** — Spring Boot 4.0.3 (Java 25), the primary REST API
- **`frontend/`** — Angular 16, Pro Space UI + Design System (`src/app/design-system/`)
- **`ml-service/`** — Python FastAPI service for ML scoring
- **`brain/`** — Python agent service (`agent/`, `match/`, `nego/`, `fraud/`, `dupli/`, `document/`); see `brain/AGENT_CONTEXT.md`
- **`infra/`** — docker-compose for PostgreSQL 16, Redis, Keycloak, ELK, Prometheus, Grafana
- **`terraform/`** — infra-as-code for cloud deploys

Domain: property listings (annonces), leads/deals (dossiers), messaging (WhatsApp/email/SMS), appointments, tasks, documents, workflows, cooperative housing projects.

Agent rules live in `.cursor/rules/*.mdc`; `context-compaction-threshold.mdc` is marked `alwaysApply: true` (compact context when it hits 75% down to ~25%).

## Build & Run Commands

**IMPORTANT:** This project requires Java 25. Set `JAVA_HOME` to a JDK 25 install, or use `scripts/use-temurin-25.ps1` (Windows) to set it before Maven commands.

**Windows (PowerShell):** Maven utilise `JAVA_HOME` pour compiler ; alignez-le sur votre JDK 25.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-25.0.2'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd backend
mvn clean install
```

**Linux/Mac:**
```bash
export JAVA_HOME=/path/to/jdk-25
cd backend
mvn clean install
```

### Backend (from `backend/`)
```bash
mvn clean install -DskipTests          # Install dependencies
mvn spotless:check                      # Check Java formatting
mvn spotless:apply                      # Auto-fix Java formatting
mvn test                                # Unit tests (H2, no Docker needed)
mvn test -Dtest=MyTestClass             # Run a single test class
mvn test -Dtest=MyTestClass#myMethod    # Run a single test method
mvn spring-boot:run -Dspring-boot.run.profiles=local   # Run locally (H2)
mvn spring-boot:run -Dspring-boot.run.profiles=dev     # Run with seed data (H2)
mvn verify -Pbackend-e2e-h2            # E2E tests with H2
mvn verify -Pbackend-e2e-postgres      # E2E tests with PostgreSQL (Docker required)
```

### Frontend (from `frontend/`)
```bash
npm install           # Install dependencies
npm start             # Dev server at http://localhost:4200 (proxies /api to :8080)
npm test              # Unit tests (Karma/Jasmine, ChromeHeadless)
npm run lint          # ESLint
npm run build         # Production build
npm run e2e           # Playwright E2E (H2 + mock auth)
npm run e2e:fast      # Fast single-browser E2E
npm run e2e:ui        # Interactive Playwright UI mode
```

### Full Stack Orchestration
```bash
# Linux/Mac
./atlas up        # Start infra (Docker) + frontend
./atlas down      # Stop everything
./atlas test      # Run all backend + frontend tests
./atlas build     # Build backend JAR + frontend dist
./atlas status    # Health check all services
./atlas logs      # View logs (all | backend | frontend | db)
./atlas reset     # Reset database

# Preferred "run everything" entry point (per README)
./scripts/run-full-test-suite.sh                 # Linux/Mac
./scripts/run-full-test-suite.sh --backend-only
./scripts/run-full-test-suite.sh --frontend-only
.\scripts\run-full-test-suite.ps1                # Windows
```

**Windows:** Use `AtlasDevConsole.ps1` — a WPF graphical dashboard that auto-discovers all commands, profiles, and services from the repo.

### Infrastructure (from `infra/`)
```bash
docker-compose up -d     # PostgreSQL, Redis, Keycloak, ELK, Prometheus, Grafana
docker-compose down
```

## Architecture

### Backend Package Structure (`backend/src/main/java/com/example/backend/`)
- **controller/** — REST controllers at `/api/v1/...` and `/api/v2/...` (versioned via `v2/` subdirectory)
- **service/** — Business logic layer (~130 services)
- **entity/** — JPA entities, all extend `BaseEntity` which provides `orgId`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- **dto/** — Request/Response DTOs with separate Mapper classes; `v2/` subdirectory for v2 API
- **repository/** — Spring Data JPA repositories; `search/` for Elasticsearch repositories
- **filter/** — Servlet filters (RequestContextFilter for MDC/slow-request logging, CorrelationIdFilter)
- **config/** — SecurityConfig, CacheConfig, RedisConfig, ElasticsearchConfig, KeycloakAdminConfig, etc.
- **aspect/** — AOP (audit)
- **workflow/** — Workflow automation engine: `WorkflowActionDispatcher`, action handlers (`ScheduleActionHandler`, …), and scheduled action execution
- **exception/** — Global exception handling

### Key Architectural Patterns

**Multi-tenancy:** Row-level isolation via `org_id` column on all tables. Hibernate `@FilterDef(name="orgIdFilter")` on `BaseEntity`. Frontend sends `X-Org-Id` header.

**Authentication:** Keycloak (OAuth2/OIDC). Backend is a stateless OAuth2 Resource Server validating JWTs. Frontend uses `angular-oauth2-oidc`. When `issuer-uri` is blank/"mock", backend accepts mock tokens (for E2E tests).

**Outbound messaging:** Outbox pattern with retry/DLQ for WhatsApp, email, SMS.

**Caching:** Two-tier — Caffeine (in-process L1) + Redis (distributed L2).

**Observability:** Structured logging (Logstash encoder), Prometheus metrics, Grafana dashboards, `X-Correlation-Id` header for request tracing.

### Database
- **PostgreSQL 16** in Docker/staging/prod; **H2** for local dev and unit tests
- Multi-tenant `org_id` on all tables
- **Flyway migrations are split into three folders** under `backend/src/main/resources/db/`:
  - **`migration/`** — cross-database base migrations (V1–V148 at time of writing). Must be portable between H2 and PostgreSQL: standard SQL only, no partial indexes, no GIN/GiST, no PL/pgSQL, no `ON CONFLICT`; use the `${json_type}` placeholder for JSON/JSONB columns.
  - **`migration-postgres/`** — PostgreSQL-only optimizations (V100–V107+): partial indexes, GIN/full-text, PL/pgSQL, upserts.
  - **`migration-h2/`** — H2-only variants (V200+) for cases where the base migration cannot be made portable. Do NOT put H2-specific DDL in the base `migration/` folder.
- **Next available version numbers:** V149+ (highest is `V148__Create_scheduled_workflow_action.sql`). V140, V143, V144 are also unused slots but out-of-order migrations are risky — prefer V149+. The old V139 duplicate has been resolved: `V139__Add_whatsapp_quota_tier_and_cost_tracking.sql` stayed, the other was renumbered to `V142__Add_reminder_strategy_to_appointment.sql`.
- In production the DB may have additional migrations applied outside this repo; always check before picking a version number: `SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5`.

### Spring Profiles
- `local` — H2, no external deps
- `dev` — H2 with seed data
- `test` — H2 (auto-applied by JUnit)
- `staging` / `prod` — PostgreSQL (requires `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` env vars)
- `e2e-h2-mock`, `e2e-postgres-mock`, `e2e-h2-keycloak`, `e2e-postgres-keycloak` — E2E test profiles

### Frontend Structure (`frontend/src/app/`)
- **pages/** — Route-level lazy-loaded modules (dashboard, annonces, dossiers, login, search, workflow-admin)
- **components/** — 80+ reusable components (kanban, calendar, activity timeline, command palette, WhatsApp UI, notifications, filters)
- **design-system/** — DS primitives (`ds-button`, `ds-card`, `page-header`, `filter-bar`, …), exported via barrel `design-system/index.ts`
- **services/** — API services, auth, offline mode, theme, notifications, keyboard shortcuts
- **guards/** — AuthGuard for route protection
- **interceptors/** — HTTP interceptors (auth token, org-id, correlation-id)

### Frontend — Design System rules (enforced)

- **`@angular/material` imports are forbidden in app code** (lint-enforced; see commit `c2fb0c4`). Use DS primitives from the barrel `src/app/design-system/index.ts` instead of `mat-*`.
- **SCSS:** use `var(--ds-*)` tokens; no hex colors, no new `var(--at-*)` / `var(--color-*)` outside the DS semantic bridge, no new `src/styles/_atlasia-*.scss` files.
- **Pro Space (`/pro/...`):** prefer `ds-card` over `mat-card` for new content wrappers.
- **Verify locally:**
  ```bash
  cd frontend
  npm run lint:ds-colors         # chains ds-scss + ds-css + ds-legacy-vars
  npm run lint:ds-scss -- --fail # CI-strict mode
  ```
- **Plan of record:** `frontend/docs/design-system-migration-plan.md`; detailed rules: `.cursor/rules/design-system-migration.mdc`.

### Default Ports
Frontend: 4200 | Backend: 8080 | Keycloak: 8081 | Adminer: 8082 | PostgreSQL: 5432 | Redis: 6379 | Elasticsearch: 9200 | Kibana: 5601 | Prometheus: 9090 | Grafana: 3000 | Nginx: 80/443

### Production URLs (via Nginx reverse proxy + Cloudflare)
- `afroware.app` — Frontend (Angular) + Backend API (`/api/`, `/actuator/`)
- `api.afroware.app` — Backend API (direct access)
- `identity.afroware.app` — Keycloak (IAM/OIDC)
- `db.afroware.app` — Adminer (database admin)
- `grafana.afroware.app` — Grafana (monitoring dashboards)
- `logs.afroware.app` — Kibana (log explorer)

SSL is terminated by Cloudflare (Full Strict mode) with Origin certificates mounted at `/etc/ssl/cloudflare/` on the server.

## Code Style

- **EditorConfig** enforced: UTF-8, LF endings, 4-space indent for Java/XML, 2-space for TS/JS/YAML/JSON
- **Java:** Spring Boot conventions; entities extend `BaseEntity`; DTOs use Request/Response + Mapper pattern
- **TypeScript:** Strict mode; Angular ESLint; component prefix `app-`; HTTP services named `*-api.service.ts`
- **Tests:** Co-located with source (`.spec.ts` for Angular, `*Test.java` for Java)

## E2E Testing

### Backend E2E Tests

Located in `backend/src/test/java/com/example/backend/` with filenames `*BackendE2ETest.java`.

**Test Data Builder:** Use `BackendE2ETestDataBuilder` (injected via `@Autowired`) for creating test data with proper tenant/relationship setup:
```java
@Autowired private BackendE2ETestDataBuilder testDataBuilder;

// Fluent builders: annonceBuilder(), dossierBuilder(), partiePrenanteBuilder(),
// messageBuilder(), appointmentBuilder(), consentementBuilder(), notificationBuilder()
Annonce annonce = testDataBuilder.annonceBuilder()
    .withTitle("Test Property").withType(AnnonceType.SALE)
    .withPrice(new BigDecimal("350000")).withCity("Paris")
    .withPhotos().withRulesJson().persist();

Dossier dossier = testDataBuilder.dossierBuilder()
    .withAnnonceId(annonce.getId()).withLeadName("John Doe")
    .withStatus(DossierStatus.NEW).withInitialParty(PartiePrenanteRole.BUYER)
    .persist();
```
Cleanup is automatic via `@AfterEach` in base test classes, or call `testDataBuilder.deleteAllTestData()`.

**Mock JWT for E2E tests:** Use `createMockJwt(orgId, subject, roles...)` from `BaseBackendE2ETest`.

### Frontend E2E Tests

Playwright tests in `frontend/e2e/`. Config files:
- `playwright.config.ts` — H2 + mock auth (default)
- `playwright-postgres-mock.config.ts` — PostgreSQL + mock auth
- `playwright-h2-keycloak.config.ts` — H2 + real Keycloak
- `playwright-postgres-keycloak.config.ts` — PostgreSQL + real Keycloak
- `playwright.fast.config.ts` — fast single-browser mode

Install browsers: `cd frontend && npx playwright install`

## Serialization Conventions

- **Timestamps:** `LocalDateTime` serializes without milliseconds (`2024-01-15T10:30:00`). In tests, use `startsWith()` or `exists()` matchers instead of exact timestamp comparison.
- **Enums:** Always serialize as uppercase (`"SCHEDULED"`, `"EMAIL"`). Do not override `toString()` on enums — Jackson uses `name()`.
- **JPA Auditing:** Enabled via `@EnableJpaAuditing`. Entities with `@CreatedBy`/`@LastModifiedBy` get auditor from JWT subject. Entities using this: Dossier, Annonce, AppointmentEntity, ActivityEntity.

## H2 vs PostgreSQL Gotchas

- H2 uses `JSON` type, PostgreSQL uses `JSONB` — use `@JdbcTypeCode(SqlTypes.JSON)` with `columnDefinition = "jsonb"` for portable mapping
- PostgreSQL is case-sensitive; H2 is configured with `MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`
- Avoid `JOIN FETCH` with `Pageable` — causes in-memory pagination. Use `@EntityGraph`, two-query approach (paginated IDs then fetch), or DTO projections instead
- PostgreSQL partial indexes (outbound message processing) are not available in H2
- Run both profiles before committing: `mvn verify -Pbackend-e2e-h2 && mvn verify -Pbackend-e2e-postgres`

## Frontend Bundle Notes

CommonJS dependencies explicitly allowed in `angular.json`: `lodash`, `jspdf`, `html2canvas`, `dompurify`, `canvg`. Heavy deps (`jspdf`, `html2canvas`) are lazy-loaded via dynamic `import()` to minimize initial bundle size.

Bundle analysis: `cd frontend && npm run build -- --stats-json && npx webpack-bundle-analyzer dist/frontend/stats.json`

## Prerequisites

- **Java 25** (see top of file for `JAVA_HOME` setup)
- **Maven 3.6+** (wrapper `mvnw` at project root)
- **Node.js 18+** and npm
- **Docker & Docker Compose** (for infrastructure and PostgreSQL E2E tests)
- **Python 3** (only if touching `ml-service/` or `brain/`)
