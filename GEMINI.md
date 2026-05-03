# Atlas Immobilier — Project Instructions

You are Gemini CLI, an expert senior full-stack engineer and project lead for **Atlas Immobilier**, a modern, multi-tenant AI-driven Real Estate CRM (Cognitive Partner).

## Project Overview
Atlas Immobilier is a sophisticated monorepo for real estate professionals. It automates lead management (dossiers), property matching (annonces), and client communications using AI.

### Core Architecture
- **Backend**: Spring Boot 4.0.3 (**Mandatory Java 25**), Maven, JPA/Hibernate, Flyway.
- **Frontend**: Angular 16+, TypeScript, RxJS, Vanilla CSS (Design Tokens).
- **Brain (AI Services)**: FastAPI (Python 3.10+) microservices for Scoring, Matching, Negotiation, etc.
- **Infrastructure**: PostgreSQL 16, Redis (L2 Cache), Caffeine (L1 Cache), Keycloak (IAM), ELK Stack.

---

## Technical Standards & Workflows

### 1. Development & Build
- **Java**: Java 25 est requis. PowerShell (session courante) :
  ```powershell
  $env:JAVA_HOME = 'C:\Program Files\Java\jdk-25.0.2'
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
  ```
  Sinon `scripts/use-temurin-25.ps1` (jabba / Temurin). Maven compile avec `JAVA_HOME`, pas seulement le `java` du PATH.
- **Profiles**:
  - `local`/`dev`: H2 based. `dev` enables the seed data loader.
  - `e2e-*`: Specific profiles for testing suites (e.g., `e2e-postgres-mock`).
- **Formatting**: Spotless is enforced. Use `mvn spotless:apply` for Java.

### 2. Multi-tenancy & Security
- **Isolation**: Row-level isolation via `org_id` on all tables. 
- **Headers**: Frontend must send `X-Org-Id` header.
- **Auth**: Stateless OAuth2 Resource Server (Keycloak). Accept mock tokens when `issuer-uri` is blank.

### 3. Database & Flyway
- **Dual-Folder Strategy**:
  - `db/migration/`: Base migrations. Use `${json_type}` placeholder for H2 (JSON) vs Postgres (JSONB) compatibility.
  - `db/migration-postgres/`: Postgres-specific optimizations (Partial indexes, GIN, Full-Text Search).
- **Versioning**: 
  - V1-V99: Base migrations.
  - V100+: Postgres-only.
  - **Conflict Alert**: There is a duplicate V139. New migrations **MUST** start from V142+.
- **Gotchas**: PostgreSQL is case-sensitive; H2 is set to `DATABASE_TO_LOWER=TRUE`.

### 4. Messaging & Caching
- **Outbox Pattern**: All outbound messages (WhatsApp, Email, SMS) use the Outbox pattern with retry/DLQ logic.
- **Caching**: Two-tier strategy: Caffeine (L1 in-process) -> Redis (L2 distributed).

### 5. Frontend Optimization
- **CommonJS**: lodash, jspdf, html2canvas, and dompurify are allowed CommonJS deps.
- **Lazy Loading**: Heavy deps (`jspdf`, `html2canvas`) must be lazy-loaded via `import()`.
- **Services**: API services named `*-api.service.ts`.

---

## Testing & Validation

### 1. Backend E2E
- **Data Builder**: Always use `BackendE2ETestDataBuilder` for fluent, tenant-aware test data creation.
- **Mocking**: Use `createMockJwt()` from `BaseBackendE2ETest`.
- **Validation**: `mvn verify -Pbackend-e2e-h2` (fast) and `mvn verify -Pbackend-e2e-postgres` (requires Docker).

### 2. Serialization Standards
- **Timestamps**: `LocalDateTime` serializes as ISO-8601 **without milliseconds** (`yyyy-MM-dd'T'HH:mm:ss`).
- **Enums**: Always serialized as **UPPERCASE**. Do not override `toString()`.

---

## AI Agent Specialized Instructions

### Critical Gotchas
- **Pagination & JOIN FETCH**: Never use `JOIN FETCH` with `Pageable` in JPQL. It causes in-memory pagination. Use `@EntityGraph` or a two-query approach instead.
- **PostgreSQL-Only Features**: Partial indexes (e.g., `WHERE status = 'QUEUED'`) fail in H2. Keep them in `migration-postgres/`.
- **Auditing**: Ensure `@EntityListeners(AuditingEntityListener.class)` is present on entities with `@CreatedBy` or `@LastModifiedBy`.

### Operational Commands
- **Backend Build**: `mvn clean install -DskipTests`
- **Frontend Build**: `npm run build`
- **Docker Reset**: `cd infra && .\reset-db.ps1` (Windows)

---

## Memory Tiering Rules
- **Team/Project Rules**: Update this `GEMINI.md`.
- **Personal Local Setup**: Update `~/.gemini/tmp/immo/memory/MEMORY.md`.
- **Cross-Project Preferences**: Update `~/.gemini/GEMINI.md`.
