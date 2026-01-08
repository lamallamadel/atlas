# Quick Test Guide

Fast reference for running the comprehensive test validation suite.

## One-Line Commands

### Run Everything
```bash
# PowerShell
.\scripts\run-full-test-suite.ps1

# Bash
./scripts/run-full-test-suite.sh
```

### Backend Only
```bash
# PowerShell
.\scripts\run-full-test-suite.ps1 -BackendOnly

# Bash
./scripts/run-full-test-suite.sh --backend-only
```

### Frontend Only
```bash
# PowerShell
.\scripts\run-full-test-suite.ps1 -FrontendOnly

# Bash
./scripts/run-full-test-suite.sh --frontend-only
```

## Direct Maven Commands

```bash
# Backend H2 (fast)
cd backend
mvn clean test -Pbackend-e2e-h2

# Backend PostgreSQL (with Testcontainers)
cd backend
mvn clean test -Pbackend-e2e-postgres
```

## Direct npm Commands

```bash
cd frontend

# H2 + Mock (default, fastest)
npm run e2e

# PostgreSQL + Mock
npm run e2e:postgres

# H2 + Keycloak
npm run e2e:h2-keycloak

# PostgreSQL + Keycloak
npm run e2e:postgres-keycloak

# All configurations
npm run e2e:full

# Fast mode (development)
npm run e2e:fast

# UI mode (debugging)
npm run e2e:ui
```

## Expected Results

### Backend H2
- **Duration**: <5 minutes
- **Tests**: ~50+ tests
- **Database**: In-memory H2

### Backend PostgreSQL
- **Duration**: <15 minutes
- **Tests**: ~50+ tests
- **Database**: PostgreSQL via Testcontainers

### Frontend Tests
- **H2 + Mock**: ~11 test files
- **H2 + Keycloak**: ~11 test files (requires Keycloak)
- **PostgreSQL + Mock**: ~11 test files (requires Docker)
- **PostgreSQL + Keycloak**: ~11 test files (requires both)

## Reports Location

After running tests, find reports in:
- **Test Validation Report**: `test-reports/test-validation-report-*.md`
- **Backend Coverage**: `backend/target/site/jacoco/index.html`
- **Frontend Results**: `frontend/test-results/`

## Quick Troubleshooting

### Java Not Found
```bash
# Windows
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Linux/Mac
export JAVA_HOME=/path/to/jdk-17
```

### Port 5432 Conflict
```bash
# Windows
Stop-Service postgresql-x64-16

# Linux/Mac
sudo systemctl stop postgresql
```

### Docker Containers Not Cleaned
```bash
docker ps -a -q --filter "label=org.testcontainers=true" | xargs docker rm -f
```

### Playwright Not Installed
```bash
cd frontend
npx playwright install
```

## Exit Codes

- `0` = All tests passed ✅
- `1` = Some tests failed ❌

## Performance Targets

| Test Suite | Target | Passing? |
|------------|--------|----------|
| Backend H2 | <5 min | Check report |
| Backend PostgreSQL | <15 min | Check report |

## Coverage Target

- **Goal**: 80%+ on critical business logic
- **Location**: `backend/target/site/jacoco/index.html`

## Quick Development Workflow

1. **Make changes** to code
2. **Run fast tests**:
   ```bash
   cd frontend && npm run e2e:fast
   ```
3. **Before commit, run backend**:
   ```bash
   cd backend && mvn clean test -Pbackend-e2e-h2
   ```
4. **Before release, run full suite**:
   ```bash
   ./scripts/run-full-test-suite.sh
   ```

## CI/CD Usage

```yaml
# GitHub Actions example
- name: Run Full Test Suite
  run: ./scripts/run-full-test-suite.sh
  env:
    CI: true
```

## Getting Help

See full documentation:
- `TEST_VALIDATION_SUITE.md` - Complete guide
- `AGENTS.md` - Project setup and commands
- Test reports in `test-reports/` directory
