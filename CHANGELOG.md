# Changelog

All notable changes to this project will be documented in this file.

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
