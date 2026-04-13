# Repository Guidelines

## Project Structure & Module Organization
This repository contains a Spring Boot backend module. Application code lives in `src/main/java/com/example/backend`, grouped by `controller`, `service`, `repository`, `entity`, `dto`, and `config`. Runtime configuration, email templates, and Flyway migrations live in `src/main/resources`, with cross-database SQL in `db/migration` and PostgreSQL-only optimizations in `db/migration-postgres`. Tests are under `src/test/java/com/example/backend`; load and performance assets are in `src/test/scala` and `k6-tests/`. Operational notes and feature runbooks sit in `docs/` and the root `*.md` files.

## Build, Test, and Development Commands
Use Java 17 and set `JAVA_HOME` before Maven commands.

- `mvn clean package`: compile, run unit tests, and build the jar.
- `mvn spring-boot:run`: start the app locally on port 8080.
- `mvn test`: run unit and slice tests with Surefire.
- `mvn verify -Pbackend-e2e-h2`: run backend E2E tests against H2 plus integration tests matched by Failsafe.
- `mvn verify -Pbackend-e2e-postgres`: run PostgreSQL-backed E2E and integration tests; Docker/Testcontainers is required.
- `mvn spotless:apply`: format Java sources with Spotless.
- `mvn jacoco:report`: generate coverage output in `target/site/jacoco`.

## Coding Style & Naming Conventions
Java uses Spotless with `google-java-format` in AOSP style, so prefer 4-space indentation and let the formatter settle wrapping. Keep packages feature-aligned and follow Spring naming: `AnnonceController`, `AnnonceService`, `AnnonceRepository`. DTOs should end with `Request`, `Response`, or `Mapper`; enum and entity names stay singular. Flyway files must keep the `V<number>__Description.sql` pattern, with base migrations in `db/migration` and PostgreSQL-specific work at version `100+` in `db/migration-postgres`.

## Testing Guidelines
JUnit 5, Spring Boot Test, MockMvc, and Testcontainers are the main test tools. Name unit tests `*Test`, backend end-to-end tests `*BackendE2ETest` or `*E2ETest`, and heavier integration tests `*IT` or `*IntegrationTest`. For tenant-aware API tests, include both the JWT and `X-Org-Id` header. Add or update tests with every behavior change, especially around Flyway migrations, multi-tenancy, and outbound messaging flows.

## Commit & Pull Request Guidelines
Recent history favors short, imperative subjects, often with Conventional Commit prefixes such as `feat:` and `fix:`. Keep commits focused and describe the visible change, for example `feat: add partial index for queued outbound messages`. Pull requests should include a concise summary, affected profiles or migrations, linked issue, and proof of validation (`mvn test`, E2E profile, or screenshots/log snippets when behavior is operational).

## Security & Configuration Tips
Do not commit secrets. Start from `.env.security.example`, `storage.example.env`, and profile-specific YAML files. When adding JSON columns in shared migrations, use the `${json_type}` placeholder instead of hardcoding `JSONB`.
