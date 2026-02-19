# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atlas Immobilier CRM — a full-stack real estate CRM monorepo with a Spring Boot 3.2.1 backend (Java 17), Angular 16 frontend, and PostgreSQL 16 database. Manages property listings (annonces), leads/deals (dossiers), messaging (WhatsApp/email/SMS), appointments, tasks, documents, workflows, and cooperative housing projects.

## Build & Run Commands

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
make up       # Start infra (Docker) + frontend
make down     # Stop everything
make test     # Run all backend + frontend tests
make build    # Build backend JAR + frontend dist
make status   # Health check all services
```

Or use `./dev up` / `.\dev.ps1 up` (cross-platform dev script).

### Infrastructure (from `infra/`)
```bash
docker-compose up -d     # PostgreSQL, Redis, Keycloak, ELK, Prometheus, Grafana
docker-compose down
```

## Architecture

### Backend Package Structure (`backend/src/main/java/com/example/backend/`)
- **controller/** — REST controllers at `/api/v1/...` and `/api/v2/...` (versioned via `v2/` subdirectory)
- **service/** — Business logic layer (~70 services)
- **entity/** — JPA entities, all extend `BaseEntity` which provides `orgId`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- **dto/** — Request/Response DTOs with separate Mapper classes; `v2/` subdirectory for v2 API
- **repository/** — Spring Data JPA repositories; `search/` for Elasticsearch repositories
- **filter/** — Servlet filters (RequestContextFilter for MDC/slow-request logging, CorrelationIdFilter)
- **config/** — SecurityConfig, CacheConfig, RedisConfig, ElasticsearchConfig, KeycloakAdminConfig, etc.
- **aspect/** — AOP (audit)
- **exception/** — Global exception handling

### Key Architectural Patterns

**Multi-tenancy:** Row-level isolation via `org_id` column on all tables. Hibernate `@FilterDef(name="orgIdFilter")` on `BaseEntity`. Frontend sends `X-Org-Id` header.

**Authentication:** Keycloak (OAuth2/OIDC). Backend is a stateless OAuth2 Resource Server validating JWTs. Frontend uses `angular-oauth2-oidc`. When `issuer-uri` is blank/"mock", backend accepts mock tokens (for E2E tests).

**Outbound messaging:** Outbox pattern with retry/DLQ for WhatsApp, email, SMS.

**Caching:** Two-tier — Caffeine (in-process L1) + Redis (distributed L2).

**Observability:** Structured logging (Logstash encoder), Prometheus metrics, Grafana dashboards, `X-Correlation-Id` header for request tracing.

### Database
- **PostgreSQL 16** in Docker/staging/prod; **H2** for local dev and unit tests
- **Flyway** migrations in `backend/src/main/resources/db/migration/` (V1–V37)
- Multi-tenant `org_id` on all tables

### Spring Profiles
- `local` — H2, no external deps
- `dev` — H2 with seed data
- `test` — H2 (auto-applied by JUnit)
- `staging` / `prod` — PostgreSQL (requires `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` env vars)
- `e2e-h2-mock`, `e2e-postgres-mock`, `e2e-h2-keycloak`, `e2e-postgres-keycloak` — E2E test profiles

### Frontend Structure (`frontend/src/app/`)
- **pages/** — Route-level lazy-loaded modules (dashboard, annonces, dossiers, login, search, workflow-admin)
- **components/** — 80+ reusable components (kanban, calendar, activity timeline, command palette, WhatsApp UI, notifications, filters)
- **services/** — API services, auth, offline mode, theme, notifications, keyboard shortcuts
- **guards/** — AuthGuard for route protection
- **interceptors/** — HTTP interceptors (auth token, org-id, correlation-id)

### Default Ports
Frontend: 4200 | Backend: 8080 | Keycloak: 8081 | Adminer: 8082 | PostgreSQL: 5432 | Redis: 6379 | Elasticsearch: 9200 | Kibana: 5601 | Prometheus: 9090 | Grafana: 3000

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

- Java 17 (set `JAVA_HOME` before Maven commands — Windows: `$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'`)
- Maven 3.6+ (wrapper `mvnw` available at project root)
- Node.js 18+ and npm
- Docker & Docker Compose (for infrastructure and PostgreSQL E2E tests)
