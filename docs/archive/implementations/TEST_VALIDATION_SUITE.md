# Test Validation Suite

Comprehensive test validation suite for backend and frontend E2E tests with multiple database and authentication configurations.

## Overview

This suite provides comprehensive testing across:

- **Backend E2E Tests**
  - H2 in-memory database (target: <5 minutes)
  - PostgreSQL with Testcontainers (target: <15 minutes)
  
- **Frontend E2E Tests**
  - H2 + Mock Auth
  - H2 + Keycloak Auth
  - PostgreSQL + Mock Auth
  - PostgreSQL + Keycloak Auth

## Quick Start

### Run All Tests

**PowerShell (Windows):**
```powershell
.\scripts\run-full-test-suite.ps1
```

**Bash (Linux/Mac):**
```bash
./scripts/run-full-test-suite.sh
```

### Run Backend Tests Only

**PowerShell:**
```powershell
.\scripts\run-full-test-suite.ps1 -BackendOnly
```

**Bash:**
```bash
./scripts/run-full-test-suite.sh --backend-only
```

### Run Frontend Tests Only

**PowerShell:**
```powershell
.\scripts\run-full-test-suite.ps1 -FrontendOnly
```

**Bash:**
```bash
./scripts/run-full-test-suite.sh --frontend-only
```

### Run Specific Frontend Configuration

**PowerShell:**
```powershell
.\scripts\run-full-test-suite.ps1 -FrontendOnly -Configuration h2-mock
.\scripts\run-full-test-suite.ps1 -FrontendOnly -Configuration postgres-mock
.\scripts\run-full-test-suite.ps1 -FrontendOnly -Configuration h2-keycloak
.\scripts\run-full-test-suite.ps1 -FrontendOnly -Configuration postgres-keycloak
```

**Bash:**
```bash
./scripts/run-full-test-suite.sh --frontend-only --configuration h2-mock
./scripts/run-full-test-suite.sh --frontend-only --configuration postgres-mock
./scripts/run-full-test-suite.sh --frontend-only --configuration h2-keycloak
./scripts/run-full-test-suite.sh --frontend-only --configuration postgres-keycloak
```

## Prerequisites

### Backend Tests

- **Java 17+** (Required)
- **Maven 3.6+** (Required)
- **Docker** (Required for PostgreSQL tests)

### Frontend Tests

- **Node.js** (Required)
- **npm** (Required)
- **Playwright browsers** (Installed automatically if missing)
- **Docker** (Required for PostgreSQL configurations)
- **Keycloak** (Required for Keycloak configurations)

## Features

### 1. Backend E2E Testing

#### H2 Profile
- Fast in-memory database testing
- PostgreSQL compatibility mode
- Target execution time: <5 minutes
- Automatic cleanup after tests

#### PostgreSQL Profile
- Real database testing with Testcontainers
- Tests database-specific features (JSONB, UUID, sequences)
- Target execution time: <15 minutes
- Automatic container cleanup

### 2. Frontend E2E Testing

#### Configuration Matrix

| Configuration | Database | Auth | Use Case |
|--------------|----------|------|----------|
| h2-mock | H2 | Mock JWT | Fast development testing |
| h2-keycloak | H2 | Real Keycloak | Auth integration testing |
| postgres-mock | PostgreSQL | Mock JWT | DB compatibility testing |
| postgres-keycloak | PostgreSQL | Real Keycloak | Full integration testing |

### 3. Database Compatibility Handling

The suite automatically handles:

- **JSONB vs JSON type compatibility**
  - H2 uses JSON
  - PostgreSQL uses JSONB
  - Transparent handling via Flyway placeholders

- **UUID generation**
  - Consistent UUID generation across databases
  - Database-specific strategies

- **Timestamp precision**
  - H2: Millisecond precision
  - PostgreSQL: Microsecond precision
  - Automatic tolerance handling (1000ms for H2, 100ms for PostgreSQL)

- **Sequence behavior**
  - Different syntax between H2 and PostgreSQL
  - Consistent interface via helper utilities

### 4. Authentication Configuration

#### Mock Authentication (Fast)
- JWT token mocking
- No external dependencies
- Ideal for rapid development

#### Keycloak Authentication (Complete)
- Real authentication flow
- Token validation
- Production-like testing

### 5. Coverage Reporting

- Line coverage tracking
- Branch coverage tracking
- 80%+ target for critical business logic
- Automatic report generation

### 6. Performance Metrics

Tracks and validates:
- Test execution times per configuration
- Performance regression detection
- Database query optimization validation

## Test Reports

Reports are generated in the `test-reports/` directory with:

- **Summary table** - Test results by configuration
- **Performance metrics** - Execution times and targets
- **Coverage metrics** - Line and branch coverage
- **Database compatibility** - Tested features
- **Authentication testing** - Mock vs real auth
- **Test categories** - Backend and frontend test breakdown

Example report: `test-reports/test-validation-report-20240115-143022.md`

## Troubleshooting

### Port Conflicts

If PostgreSQL tests fail due to port 5432 being in use:

**Windows:**
```powershell
Stop-Service postgresql-x64-16
```

**Linux/Mac:**
```bash
sudo systemctl stop postgresql
```

### Container Cleanup

If Docker containers aren't cleaned up:

```bash
docker ps -a -q --filter "label=org.testcontainers=true" | xargs docker rm -f
```

### Playwright Installation

If Playwright browsers are missing:

```bash
cd frontend
npx playwright install
```

### Java Version

Ensure Java 17+ is active:

**Windows:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
java -version
```

**Linux/Mac:**
```bash
export JAVA_HOME=/path/to/jdk-17
java -version
```

## Architecture

### Backend Test Structure

```
backend/
├── src/test/java/com/example/backend/
│   ├── annotation/
│   │   ├── BackendE2ETest.java          # Test annotation
│   │   └── BaseBackendE2ETest.java      # Base test class
│   ├── config/
│   │   └── PostgresTestContainerConfig.java  # Testcontainers setup
│   ├── utils/
│   │   └── DatabaseCompatibilityHelper.java  # DB compatibility utilities
│   └── *BackendE2ETest.java             # E2E test classes
└── src/test/resources/
    ├── application-test.yml              # H2 test config
    ├── application-backend-e2e.yml       # Base E2E config
    ├── application-backend-e2e-h2.yml    # H2 E2E config
    └── application-backend-e2e-postgres.yml  # PostgreSQL E2E config
```

### Frontend Test Structure

```
frontend/
├── e2e/
│   ├── *.spec.ts                        # E2E test files
│   ├── global-setup.ts                  # Setup for mock auth
│   ├── test-config-helper.ts            # Configuration helper
│   └── helpers.ts                       # Test utilities
├── playwright.config.ts                 # H2 + Mock (default)
├── playwright-postgres-mock.config.ts   # PostgreSQL + Mock
├── playwright-h2-keycloak.config.ts     # H2 + Keycloak
└── playwright-postgres-keycloak.config.ts  # PostgreSQL + Keycloak
```

### Script Structure

```
scripts/
├── run-full-test-suite.ps1  # PowerShell runner
└── run-full-test-suite.sh   # Bash runner
```

## CI/CD Integration

The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions
- name: Run Full Test Suite
  run: |
    ./scripts/run-full-test-suite.sh
  env:
    CI: true
```

When `CI=true`:
- Retries enabled (2 retries)
- JSON/JUnit reports generated
- Parallel execution configured
- Video capture on failure

## NPM Scripts

The following scripts are available in `frontend/package.json`:

```bash
# Default (H2 + Mock)
npm run e2e

# PostgreSQL + Mock
npm run e2e:postgres

# H2 + Keycloak
npm run e2e:h2-keycloak

# PostgreSQL + Keycloak
npm run e2e:postgres-keycloak

# All configurations
npm run e2e:full

# Fast mode (single browser, H2 only)
npm run e2e:fast

# UI mode (interactive)
npm run e2e:ui
```

## Maven Profiles

Backend test profiles:

```bash
# H2 profile
cd backend
mvn clean test -Pbackend-e2e-h2

# PostgreSQL profile
cd backend
mvn clean test -Pbackend-e2e-postgres
```

## Coverage Goals

The suite enforces 80%+ coverage on:

- **Controllers** - API endpoint logic
- **Services** - Business logic
- **Repositories** - Data access
- **Security** - Authentication and authorization

Coverage is measured with JaCoCo and reported in:
- HTML: `backend/target/site/jacoco/index.html`
- Console output during test execution

## Test Categories

### Backend E2E Tests

1. **Annonce (Property) Tests**
   - CRUD operations
   - Photo management
   - Rules validation

2. **Dossier (Lead/Deal) Tests**
   - Workflow transitions
   - Status management
   - Lead qualification

3. **Partie Prenante (Stakeholder) Tests**
   - Role management
   - Contact information
   - Multi-party scenarios

4. **Message Tests**
   - SMS, Email, WhatsApp channels
   - Message history
   - Template rendering

5. **Appointment Tests**
   - Scheduling
   - Calendar integration
   - Conflict detection

6. **Consentement (Consent) Tests**
   - GDPR compliance
   - Consent tracking
   - Revocation handling

7. **Audit Trail Tests**
   - Change tracking
   - User attribution
   - Timestamp verification

8. **Multi-Tenant Tests**
   - Tenant isolation
   - Cross-tenant security
   - Data partitioning

9. **Security Tests**
   - Authentication
   - Authorization
   - JWT token validation

10. **Complete Workflow Tests**
    - End-to-end business scenarios
    - Integration between modules

### Frontend E2E Tests

1. **Annonce Wizard**
   - Multi-step form navigation
   - Validation
   - Photo upload

2. **Dossier State Machine**
   - Status transitions
   - Validation rules
   - UI state management

3. **Message Composition**
   - Channel selection
   - Template usage
   - Sending

4. **Appointment Management**
   - Calendar view
   - Scheduling
   - Notifications

5. **Partie Prenante CRUD**
   - Create/Read/Update/Delete
   - Form validation
   - Contact management

6. **Consentement Capture**
   - Consent forms
   - Storage
   - Revocation

7. **Multi-Tenant**
   - Organization switching
   - Data isolation
   - Permission enforcement

8. **Error Handling**
   - Validation errors
   - Network errors
   - User feedback

9. **Duplicate Detection**
   - Similarity detection
   - Merge workflows
   - Conflict resolution

## Performance Targets

| Test Suite | Target | Actual | Status |
|------------|--------|--------|--------|
| Backend H2 | <5 min | Measured | ✓/✗ |
| Backend PostgreSQL | <15 min | Measured | ✓/✗ |
| Frontend H2+Mock | N/A | Measured | N/A |
| Frontend H2+Keycloak | N/A | Measured | N/A |
| Frontend Postgres+Mock | N/A | Measured | N/A |
| Frontend Postgres+Keycloak | N/A | Measured | N/A |

## Best Practices

1. **Run locally before pushing**
   ```bash
   ./scripts/run-full-test-suite.sh --backend-only
   ```

2. **Use fast configuration for development**
   ```bash
   npm run e2e:fast
   ```

3. **Test database compatibility before release**
   ```bash
   ./scripts/run-full-test-suite.sh --configuration postgres-mock
   ```

4. **Verify auth integration periodically**
   ```bash
   ./scripts/run-full-test-suite.sh --configuration h2-keycloak
   ```

5. **Check coverage reports**
   - Open `backend/target/site/jacoco/index.html`
   - Ensure 80%+ on critical paths

## Exit Codes

- `0` - All tests passed
- `1` - One or more test suites failed
- Other - Script execution error

## Maintenance

### Adding New Tests

1. **Backend**: Create `*BackendE2ETest.java` in `backend/src/test/java/com/example/backend/`
2. **Frontend**: Create `*.spec.ts` in `frontend/e2e/`

### Updating Database Schema

1. Create Flyway migration in `backend/src/main/resources/db/migration/`
2. Update placeholder in `application-test.yml` if needed
3. Run tests to verify compatibility

### Adding Test Configuration

1. Create new Playwright config file
2. Update `frontend/package.json` scripts
3. Update test runner scripts
4. Document in this README

## Support

For issues or questions:
1. Check troubleshooting section
2. Review test reports in `test-reports/`
3. Check console output for detailed errors
4. Verify prerequisites are installed

## Version History

- **v1.0.0** - Initial release with comprehensive test validation suite
  - Backend H2 and PostgreSQL profiles
  - Frontend 4 configuration matrix
  - Database compatibility helpers
  - Coverage reporting
  - Performance tracking
  - Automated report generation
